export type AnalysisPollResult = "completed" | "failed" | "timeout";

export async function pollAnalysisTask(
  projectId: string,
  taskId: string,
  onUpdate?: (message: string) => void,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<AnalysisPollResult> {
  const maxAttempts = options?.maxAttempts ?? 45;
  const intervalMs = options?.intervalMs ?? 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    const res = await fetch(`/api/projects/${projectId}/analysis-tasks/${taskId}`);
    if (!res.ok) return "failed";

    const data = (await res.json()) as {
      task?: { status: string; progress: number; message?: string; error?: string };
    };
    const task = data.task;
    if (!task) return "failed";

    onUpdate?.(task.message ?? `分析中… ${task.progress}%`);

    if (task.status === "completed") return "completed";
    if (task.status === "failed") {
      onUpdate?.(task.error ?? "分析失败");
      return "failed";
    }
  }

  return "timeout";
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
      const result = await pollAnalysisTask(projectId, taskId, onUpdate);
      if (result === "completed") completed += 1;
      else if (result === "failed") failed += 1;
      else timeout += 1;
    })
  );

  return { completed, failed, timeout };
}
