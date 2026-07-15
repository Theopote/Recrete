import { NextResponse } from "next/server";
import { buildProjectAIContext, withAIInvocation, aiErrorResponse } from "@/lib/ai";
import { askProjectCopilot, getCopilotRagSources } from "@/lib/ai/agents/copilot-agent";
import {
  runStrategyIterationWorkflow,
  findStrategyForInstruction,
} from "@/lib/ai/workflow/strategy-workflow";
import { requireProjectAccess } from "@/lib/auth/authorize";
import type { AIMessage } from "@/types";

function isStrategyIterationRequest(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    lower.includes("refine") ||
    lower.includes("iterate") ||
    lower.includes("revise strategy") ||
    lower.includes("调整方案") ||
    lower.includes("优化方案") ||
    lower.includes("更激进") ||
    lower.includes("更保守") ||
    lower.includes("改立面") ||
    lower.includes("改方案")
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { user } = access;

  const { messages } = (await request.json()) as { messages: AIMessage[] };
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

  try {
    if (lastUserMessage && isStrategyIterationRequest(lastUserMessage.content)) {
      const projectContext = await buildProjectAIContext(
        projectId,
        user.organizationId,
        lastUserMessage.content
      );
      if (!projectContext) {
        return NextResponse.json(
          {
            error: "NOT_FOUND",
            code: "NOT_FOUND",
            message: "项目不存在或无权访问。",
            retryable: false,
          },
          { status: 404 }
        );
      }

      const strategies = projectContext.project.strategies ?? [];
      if (strategies.length === 0) {
        const response = await withAIInvocation(
          {
            organizationId: user.organizationId,
            userId: user.id,
            operation: "copilot",
          },
          () => askProjectCopilot(projectContext, messages)
        );
        return NextResponse.json({
          response,
          sources: getCopilotRagSources(projectContext),
        });
      }

      const target = findStrategyForInstruction(strategies, lastUserMessage.content);
      if (!target) {
        return NextResponse.json({
          response:
            "无法确定要调整哪个方案。请指定方案 1、2 或 3，或先在策略实验室生成方案。",
        });
      }

      const result = await withAIInvocation(
        {
          organizationId: user.organizationId,
          userId: user.id,
          operation: "strategy_generate",
        },
        () =>
          runStrategyIterationWorkflow(projectId, user.organizationId, {
            strategyId: target.id,
            instruction: lastUserMessage.content,
          })
      );

      if (!result) {
        return NextResponse.json({
          response: "方案调整失败，请稍后重试。",
          retryable: true,
        });
      }

      return NextResponse.json({
        response: `**方案已更新：${result.strategy.name}**\n\n${result.strategy.summary}\n\n**更新重点：**\n• 空间：${result.strategy.spatialStrategy.slice(0, 120)}…\n• 立面：${result.strategy.facadeStrategy.slice(0, 120)}…\n\nBuilding Memory 已同步本次迭代。`,
        strategyUpdated: result.strategy,
      });
    }

    const projectContext = await buildProjectAIContext(
      projectId,
      user.organizationId,
      lastUserMessage?.content
    );
    if (!projectContext) {
      return NextResponse.json(
        {
          error: "NOT_FOUND",
          code: "NOT_FOUND",
          message: "项目不存在或无权访问。",
          retryable: false,
        },
        { status: 404 }
      );
    }

    const response = await withAIInvocation(
      {
        organizationId: user.organizationId,
        userId: user.id,
        operation: "copilot",
      },
      () => askProjectCopilot(projectContext, messages)
    );

    return NextResponse.json({
      response,
      sources: getCopilotRagSources(projectContext),
    });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
