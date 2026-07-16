import type { ProjectSection } from "@/types";

export const LEGACY_SECTION_MAP: Record<string, ProjectSection> = {
  building: "building-memory",
  documents: "survey-intelligence",
  strategies: "strategy-lab",
  timeline: "overview",
};

export function resolveProjectSection(section: string): ProjectSection {
  return (LEGACY_SECTION_MAP[section] ?? section) as ProjectSection;
}

export function isOverviewSection(section: string): boolean {
  return resolveProjectSection(section) === "overview";
}

export function sectionNeedsStrategyMetrics(section: string): boolean {
  const resolved = resolveProjectSection(section);
  return resolved === "strategy-lab" || resolved === "cost-risk";
}

export function sectionNeedsCollaboration(section: string): boolean {
  return resolveProjectSection(section) === "collaboration";
}
