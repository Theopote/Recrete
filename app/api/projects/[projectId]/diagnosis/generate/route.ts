import { NextResponse } from "next/server";
import { getProjectById, addDiagnosisItems } from "@/lib/db/repository";
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
  const items = await ai.generateDiagnosis(project, project.documents);
  const created = await addDiagnosisItems(projectId, items);
  return NextResponse.json(created);
}
