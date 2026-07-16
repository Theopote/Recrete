export function navigateToBuildingCondition(projectId: string) {
  window.location.assign(`/projects/${projectId}?section=building-condition`);
}

export async function pollBimModelReady(
  projectId: string,
  modelId: string,
  onUpdate?: (message: string) => void,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<"ready" | "failed" | "timeout"> {
  const maxAttempts = options?.maxAttempts ?? 30;
  const intervalMs = options?.intervalMs ?? 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    const res = await fetch(`/api/projects/${projectId}/bim-models`);
    if (!res.ok) return "failed";

    const data = (await res.json()) as { models?: { id: string; status: string }[] };
    const model = data.models?.find((m) => m.id === modelId);
    if (!model) return "failed";

    if (model.status === "ready") return "ready";
    if (model.status === "failed" || model.status === "unsupported") return "failed";
    onUpdate?.(`CAD 转换中… (${attempt + 1}/${maxAttempts})`);
  }

  return "timeout";
}

export async function openBuildingConditionAfterIngest(input: {
  projectId: string;
  analysisTaskId?: string;
  bimModelId?: string;
  onUpdate?: (message: string) => void;
}) {
  if (input.analysisTaskId) {
    const { pollAnalysisTask } = await import("@/lib/documents/poll-analysis-task");
    const outcome = await pollAnalysisTask(
      input.projectId,
      input.analysisTaskId,
      input.onUpdate
    );
    if (outcome.result === "failed") return false;
  }

  if (input.bimModelId) {
    await pollBimModelReady(input.projectId, input.bimModelId, input.onUpdate);
  }

  navigateToBuildingCondition(input.projectId);
  return true;
}
