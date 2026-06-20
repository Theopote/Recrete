import { NextResponse } from "next/server";
import { updateIssueStatus } from "@/lib/db/repository";
import type { IssueStatus } from "@/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; issueId: string }> }
) {
  const { issueId } = await params;
  const { status } = await request.json() as { status: IssueStatus };
  const issue = await updateIssueStatus(issueId, status);
  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }
  return NextResponse.json(issue);
}
