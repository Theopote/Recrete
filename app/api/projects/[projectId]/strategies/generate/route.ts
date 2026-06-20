import { NextResponse } from "next/server";
import { getProjectById, addStrategies } from "@/lib/db/repository";
import { getAIService } from "@/lib/ai";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const ai = getAIService();
  const strategies = await ai.generateRenovationStrategies(
    project,
    project.diagnosis ?? []
  );
  const created = await addStrategies(projectId, strategies);

  const withMetrics = created.map((s) => ({
    ...s,
    metrics: {
      cost: Math.floor(Math.random() * 60 + 20),
      schedule: Math.floor(Math.random() * 60 + 20),
      risk: Math.floor(Math.random() * 60 + 20),
      designValue: Math.floor(Math.random() * 60 + 30),
      constructionDifficulty: Math.floor(Math.random() * 60 + 20),
      preservationLevel: Math.floor(Math.random() * 60 + 30),
    },
  }));

  return NextResponse.json(withMetrics);
}
