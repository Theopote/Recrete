import { NextResponse } from "next/server";
import {
  queueSurveyDocumentJobs,
  runSurveyFinalizeWorkflow,
  runSurveyWorkflow,
} from "@/lib/ai/workflow/survey-workflow";
import { requireProjectAccess } from "@/lib/auth/authorize";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const body = await request.json().catch(() => ({}));
  const { user } = access;

  if (body.finalize === true) {
    const result = await runSurveyFinalizeWorkflow(projectId, user.organizationId);
    if (!result) {
      return NextResponse.json({ error: "Survey finalize failed" }, { status: 500 });
    }
    return NextResponse.json(result);
  }

  if (body.async !== false) {
    const queued = await queueSurveyDocumentJobs(projectId, user.organizationId, {
      language: body.language,
      createIssues: body.createIssues,
      onlyUnanalyzed: body.onlyUnanalyzed,
    });
    if (!queued) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(queued);
  }

  const result = await runSurveyWorkflow(projectId, user.organizationId, {
    language: body.language,
    createIssues: body.createIssues,
    onlyUnanalyzed: body.onlyUnanalyzed,
  });
  if (!result) {
    return NextResponse.json({ error: "Survey workflow failed" }, { status: 500 });
  }

  return NextResponse.json(result);
}
