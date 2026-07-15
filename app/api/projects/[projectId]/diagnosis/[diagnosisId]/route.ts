import { NextResponse } from "next/server";
import { updateDiagnosisItem } from "@/lib/db/repository";
import { diagnosisItemSchema } from "@/lib/validators/project";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; diagnosisId: string }> }
) {
  const { projectId, diagnosisId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  try {
    const body = await request.json();
    const parsed = diagnosisItemSchema.partial().parse(body);
    const updated = await updateDiagnosisItem(diagnosisId, parsed);
    if (!updated) {
      return NextResponse.json({ error: "Diagnosis item not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
