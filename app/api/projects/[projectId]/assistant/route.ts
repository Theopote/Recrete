import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/repository";
import { getAIService } from "@/lib/ai";
import type { AIMessage } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { messages } = await request.json() as { messages: AIMessage[] };
  const ai = getAIService();
  const response = await ai.askProjectAssistant(
    {
      project,
      diagnosisItems: project.diagnosis,
      strategies: project.strategies,
      issues: project.issues,
    },
    messages
  );

  return NextResponse.json({ response });
}
