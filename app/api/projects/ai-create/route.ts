import { NextResponse } from "next/server";
import { z } from "zod";
import { parseProjectBrief } from "@/lib/ai/agents/project-creation-agent";
import { createProjectFromBrief } from "@/lib/db/repository";
import { guardOrRespond } from "@/lib/auth/api-guard";
import { getSessionOrThrow } from "@/lib/auth/authorize";

const schema = z.object({
  brief: z.string().min(20, "Please describe your building and renovation goals in at least one sentence."),
});

export async function POST(request: Request) {
  const denied = await guardOrRespond("POST", "/api/projects/ai-create");
  if (denied) return denied;

  const session = await getSessionOrThrow();
  if ("error" in session) return session.error;

  try {
    const body = await request.json();
    const { brief } = schema.parse(body);
    const draft = await parseProjectBrief(brief);
    const project = await createProjectFromBrief(draft, session.user.organizationId);

    return NextResponse.json({
      project,
      summary: draft.analysisSummary,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    throw error;
  }
}
