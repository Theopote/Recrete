import type { ProjectWithRelations } from "@/types";

export function resolveComplianceScenarios(project: ProjectWithRelations): string[] {
  const scenarios = new Set<string>(["all", "pre_renovation_inspection"]);

  if (project.targetFunction !== project.currentFunction) {
    scenarios.add("function_conversion");
  }

  const original = project.originalFunction.toLowerCase();
  const target = project.targetFunction.toLowerCase();
  const building = project.buildingType.toLowerCase();

  if (original.includes("办公") || original.includes("office")) {
    scenarios.add("office_renovation");
  }

  if (
    target.includes("公共") ||
    target.includes("文化") ||
    target.includes("public") ||
    target.includes("cultural") ||
    target.includes("community")
  ) {
    scenarios.add("public_building_renovation");
  }

  if (project.building?.heritageLevel && project.building.heritageLevel !== "none") {
    scenarios.add("heritage_renovation");
    scenarios.add("historic_building");
  }

  if (building.includes("工业") || building.includes("warehouse") || building.includes("industrial")) {
    scenarios.add("adaptive_reuse");
  }

  if (
    target.includes("节能") ||
    target.includes("energy") ||
    project.renovationGoal.toLowerCase().includes("energy")
  ) {
    scenarios.add("energy_retrofit");
    scenarios.add("facade_renovation");
    scenarios.add("window_replacement");
  }

  if (project.constructionYear < 2001) {
    scenarios.add("structural_assessment");
    scenarios.add("safety_upgrade");
  }

  if (project.targetFunction !== project.originalFunction) {
    scenarios.add("interior_renovation");
  }

  return [...scenarios];
}

export function isPublicTargetFunction(targetFunction: string) {
  const lower = targetFunction.toLowerCase();
  return (
    targetFunction.includes("公共") ||
    targetFunction.includes("文化") ||
    lower.includes("public") ||
    lower.includes("cultural") ||
    lower.includes("community") ||
    lower.includes("museum") ||
    lower.includes("library")
  );
}

export function isFunctionConversion(project: ProjectWithRelations) {
  return project.targetFunction !== project.currentFunction;
}

export function hasHeritageConstraints(project: ProjectWithRelations) {
  const level = project.building?.heritageLevel;
  return Boolean(level && level !== "none");
}
