export type AnalysisPollResult = "completed" | "failed" | "timeout";

export interface AnalysisPollOutcome {
  result: AnalysisPollResult;
  error?: string;
}

export async function pollAnalysisTask(
  projectId: string,
  taskId: string,
  onUpdate?: (message: string) => void,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<AnalysisPollOutcome> {
  const maxAttempts = options?.maxAttempts ?? 45;
  const intervalMs = options?.intervalMs ?? 2000;
  let lastError: string | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    const res = await fetch(`/api/projects/${projectId}/analysis-tasks/${taskId}`);
    if (!res.ok) return { result: "failed", error: "无法获取分析状态" };

    const data = (await res.json()) as {
      task?: { status: string; progress: number; message?: string; error?: string };
    };
    const task = data.task;
    if (!task) return { result: "failed", error: "分析任务不存在" };

    onUpdate?.(task.message ?? `分析中… ${task.progress}%`);

    if (task.status === "completed") return { result: "completed" };
    if (task.status === "failed") {
      lastError = task.error ?? "分析失败";
      onUpdate?.(lastError);
      return { result: "failed", error: lastError };
    }
  }

  return { result: "timeout" };
}

export async function pollAnalysisTasks(
  projectId: string,
  taskIds: string[],
  onUpdate?: (message: string) => void
): Promise<{ completed: number; failed: number; timeout: number }> {
  let completed = 0;
  let failed = 0;
  let timeout = 0;

  await Promise.all(
    taskIds.map(async (taskId) => {
      const outcome = await pollAnalysisTask(projectId, taskId, onUpdate);
      if (outcome.result === "completed") completed += 1;
      else if (outcome.result === "failed") failed += 1;
      else timeout += 1;
    })
  );

  return { completed, failed, timeout };
}
