import { NextResponse } from "next/server";
import { addDiagnosisItems } from "@/lib/db/repository";
import { diagnosisItemSchema } from "@/lib/validators/project";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  try {
    const body = await request.json();
    const parsed = diagnosisItemSchema.parse(body);
    const [created] = await addDiagnosisItems(projectId, [parsed]);
    return NextResponse.json(created);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
