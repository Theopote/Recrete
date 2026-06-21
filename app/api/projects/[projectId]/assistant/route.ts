import { NextResponse } from "next/server";
import { buildProjectAIContext } from "@/lib/ai";
import { askProjectCopilot } from "@/lib/ai/agents/copilot-agent";
import type { AIMessage } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const projectContext = await buildProjectAIContext(projectId);
  if (!projectContext) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { messages } = await request.json() as { messages: AIMessage[] };
  const response = await askProjectCopilot(projectContext, messages);

  return NextResponse.json({ response });
}
