import { NextResponse } from "next/server";
import { updateReport } from "@/lib/db/repository";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "generating", "ready", "published"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; reportId: string }> }
) {
  const { reportId } = await params;
  try {
    const body = await request.json();
    const parsed = updateSchema.parse(body);
    const updated = await updateReport(reportId, parsed);
    if (!updated) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
