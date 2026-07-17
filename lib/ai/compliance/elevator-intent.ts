import type { ProjectWithRelations } from "@/types";

export function hasElevatorIntent(project: ProjectWithRelations): boolean {
  const text = [
    project.renovationGoal,
    project.targetFunction,
    project.description ?? "",
    project.currentFunction,
  ]
    .join(" ")
    .toLowerCase();
  return /电梯|elevator|lift|加装电梯|无障碍.*梯/.test(text);
}
