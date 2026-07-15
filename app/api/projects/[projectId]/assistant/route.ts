import { NextResponse } from "next/server";
import { buildProjectAIContext } from "@/lib/ai";
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

  if (lastUserMessage && isStrategyIterationRequest(lastUserMessage.content)) {
    const projectContext = await buildProjectAIContext(
      projectId,
      user.organizationId,
      lastUserMessage.content
    );
    if (!projectContext) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const strategies = projectContext.project.strategies ?? [];
    if (strategies.length === 0) {
      const response = await askProjectCopilot(projectContext, messages);
      return NextResponse.json({
        response,
        sources: getCopilotRagSources(projectContext),
      });
    }

    const target = findStrategyForInstruction(strategies, lastUserMessage.content);
    if (!target) {
      return NextResponse.json({
        response:
          "I couldn't identify which strategy to refine. Please specify option 1, 2, or 3, or generate strategies in Strategy Lab first.",
      });
    }

    const result = await runStrategyIterationWorkflow(projectId, user.organizationId, {
      strategyId: target.id,
      instruction: lastUserMessage.content,
    });

    if (!result) {
      return NextResponse.json({ response: "Strategy iteration failed. Please try again." });
    }

    return NextResponse.json({
      response: `**Strategy refined: ${result.strategy.name}**\n\n${result.strategy.summary}\n\n**Updated focus:**\n• Spatial: ${result.strategy.spatialStrategy.slice(0, 120)}…\n• Facade: ${result.strategy.facadeStrategy.slice(0, 120)}…\n\nBuilding Memory has been updated with this iteration.`,
      strategyUpdated: result.strategy,
    });
  }

  const projectContext = await buildProjectAIContext(
    projectId,
    user.organizationId,
    lastUserMessage?.content
  );
  if (!projectContext) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const response = await askProjectCopilot(projectContext, messages);
  return NextResponse.json({
    response,
    sources: getCopilotRagSources(projectContext),
  });
}
