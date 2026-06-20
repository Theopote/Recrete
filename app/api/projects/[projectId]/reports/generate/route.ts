import { NextResponse } from "next/server";
import { getProjectById, addReport } from "@/lib/db/repository";
import { getAIService } from "@/lib/ai";
import type { ReportType } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { reportType } = await request.json() as { reportType: ReportType };
  const ai = getAIService();
  const { title, content } = await ai.generateReport(
    project,
    project.diagnosis ?? [],
    project.strategies ?? [],
    project.issues ?? [],
    reportType
  );

  const report = await addReport(projectId, {
    title,
    type: reportType,
    content,
    status: "ready",
    createdById: "user-1",
  });

  return NextResponse.json(report);
}
