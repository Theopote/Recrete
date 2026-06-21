/**
 * Build professional prompt context from terminology dictionary and regional codes.
 */

import type { ProjectWithRelations } from "@/types";
import { buildingCodes, getCodesForScenario, searchCodes } from "./code-database";
import { architecturalTerms, searchTerms } from "./term-dictionary";

const REGION_CITIES: Record<string, string[]> = {
  西北: ["西安", "xi'an", "xian", "兰州"],
  华东: ["上海", "shanghai", "杭州", "hangzhou", "南京"],
  华北: ["北京", "beijing", "天津"],
  西南: ["成都", "chengdu", "重庆"],
  华南: ["广州", "guangzhou", "深圳"],
};

export function inferRegion(location: string): string {
  const lower = location.toLowerCase();
  for (const [region, cities] of Object.entries(REGION_CITIES)) {
    if (cities.some((c) => lower.includes(c.toLowerCase()) || location.includes(c))) {
      return region;
    }
  }
  return "全国";
}

function scenarioKeywords(targetFunction?: string): string[] {
  if (!targetFunction) return ["structure", "fire"];
  const kws: string[] = [];
  if (/文化|community|public|assembly/i.test(targetFunction)) kws.push("fire", "egress", "疏散");
  if (/office|办公/i.test(targetFunction)) kws.push("load", "荷载");
  if (/hotel|酒店/i.test(targetFunction)) kws.push("energy", "facade");
  if (/heritage|历史|文保/i.test(targetFunction)) kws.push("heritage", "保护");
  return kws.length ? kws : ["structure", "fire"];
}

export function buildTerminologyPromptBlock(keywords: string[] = []): string {
  const terms = new Set<string>();
  for (const kw of keywords) {
    for (const t of searchTerms(kw)) {
      terms.add(`${t.en} / ${t.zh}`);
    }
  }

  if (terms.size === 0) {
    return architecturalTerms
      .slice(0, 12)
      .map((t) => `- ${t.en} (${t.zh})`)
      .join("\n");
  }

  return [...terms].slice(0, 15).map((t) => `- ${t}`).join("\n");
}

export function buildRegionalCodePromptBlock(
  location: string,
  targetFunction?: string,
  limit = 5
): string {
  const scenario = targetFunction?.includes("文化") ? "function_conversion" : "all";
  const scenarioCodes = getCodesForScenario(scenario);
  const searched = scenarioKeywords(targetFunction).flatMap((kw) => searchCodes(kw).slice(0, 2));

  const seen = new Set<string>();
  const lines: string[] = [];

  for (const code of scenarioCodes.slice(0, limit)) {
    if (seen.has(code.id)) continue;
    seen.add(code.id);
    const req = code.keyRequirements[0];
    lines.push(
      `- ${code.code} ${code.nameZh}: ${req ? `${req.section} ${req.titleZh} — ${req.descriptionZh}` : code.category}`
    );
  }

  for (const { code, requirement } of searched) {
    if (seen.has(code.id) || lines.length >= limit + 2) continue;
    seen.add(code.id);
    lines.push(
      `- ${code.code} ${requirement.section} ${requirement.titleZh}: ${requirement.descriptionZh}`
    );
  }

  const region = inferRegion(location);
  const fallback = buildingCodes.slice(0, 3).map((c) => `- ${c.code} ${c.nameZh}`).join("\n");
  return `Region · 区域: ${region}\n${lines.join("\n") || fallback}`;
}

export function buildProfessionalPromptContext(project: ProjectWithRelations): string {
  const terminology = buildTerminologyPromptBlock([
    project.structureType,
    project.buildingType,
    project.targetFunction,
    "renovation",
    "MEP",
    "fire",
  ]);
  const codes = buildRegionalCodePromptBlock(project.location, project.targetFunction);

  return `## Professional terminology (use consistently)
${terminology}

## Applicable codes & standards
${codes}`;
}

export function inferRenovationScenario(project: ProjectWithRelations): string {
  const heritage = project.building?.heritageLevel;
  if (heritage && heritage !== "none") return "heritage_renovation";
  const target = project.targetFunction.toLowerCase();
  if (target.includes("文化") || target.includes("community") || target.includes("public")) {
    return "function_conversion";
  }
  if (target.includes("office") || target.includes("办公")) return "office_renovation";
  return "all";
}
