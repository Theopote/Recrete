import { NextResponse } from "next/server";
import { addIssue } from "@/lib/db/repository";
import { siteIssueSchema } from "@/lib/validators/project";
import { guardOrRespond } from "@/lib/auth/api-guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const denied = await guardOrRespond("POST", "/api/projects/*/issues");
  if (denied) return denied;

  const { projectId } = await params;
  try {
    const body = await request.json();
    const parsed = siteIssueSchema.parse(body);
    const issue = await addIssue(projectId, {
      title: parsed.title,
      category: parsed.category,
      priority: parsed.priority,
      location: parsed.location ?? null,
      description: parsed.description,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      assignedToId: "user-3",
      photoUrl: null,
    });
    return NextResponse.json(issue);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    );
  }
}
