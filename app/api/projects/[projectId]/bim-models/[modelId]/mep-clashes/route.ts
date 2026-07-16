import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/auth/authorize";
import { getBimModel, updateBimModel } from "@/lib/bim/bim-model-repository";
import { persistMepClashIssues } from "@/lib/db/mep-clash-store";
import type { MepClashReport } from "@/lib/ai/agents/mep-agent";
import type { AppLocale } from "@/lib/i18n/locale";
import type { BimIfcElement, BimMepClashSummary } from "@/types/bim";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> }
) {
  const { projectId, modelId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { project } = access;

  const model = await getBimModel(projectId, modelId);
  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }
  if (model.format !== "ifc") {
    return NextResponse.json({ error: "Only IFC models support geometry clash detection" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    clashReport?: MepClashReport;
    elements?: BimIfcElement[];
    createIssues?: boolean;
    locale?: AppLocale;
  };

  if (!body.clashReport) {
    return NextResponse.json({ error: "clashReport is required" }, { status: 400 });
  }

  const createIssues = body.createIssues !== false;
  const locale = body.locale === "en" ? "en" : "zh";
  const clashReport = body.clashReport;

  const issueResult = createIssues
    ? await persistMepClashIssues({
        projectId,
        clashes: clashReport.clashes,
        existingIssues: project.issues ?? [],
        locale,
      })
    : { created: [], skipped: 0 };

  const mepClashSummary: BimMepClashSummary = {
    clashCount: clashReport.clashCount,
    criticalCount: clashReport.criticalCount,
    elementCount: body.elements?.length ?? model.metadata?.mepElements?.length ?? 0,
    lastRunAt: new Date().toISOString(),
    source: "ifc_geometry",
  };

  const updatedModel = await updateBimModel(projectId, modelId, {
    metadata: {
      ...(model.metadata ?? {}),
      mepElements: body.elements ?? model.metadata?.mepElements,
      mepClashSummary,
    },
  });

  return NextResponse.json({
    clashReport,
    model: updatedModel,
    issuesCreated: issueResult.created,
    issueStats: {
      created: issueResult.created.length,
      skipped: issueResult.skipped,
    },
  });
}
