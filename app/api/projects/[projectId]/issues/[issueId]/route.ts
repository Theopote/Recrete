import { NextResponse } from "next/server";
import { updateIssueStatus } from "@/lib/db/repository";
import { requireProjectAccess } from "@/lib/auth/authorize";
import type { IssueStatus } from "@/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; issueId: string }> }
) {
  const { projectId, issueId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const { status } = await request.json() as { status: IssueStatus };
  const issue = await updateIssueStatus(issueId, status);
  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }
  return NextResponse.json(issue);
}
