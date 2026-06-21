import type { ProjectWithRelations, DiagnosisItem } from "@/types";
import type { AIInsight, BuildingMemory, SourceEvidence } from "@/types/ai";

export interface DataConflict {
  id: string;
  title: string;
  category: "drawing_mismatch" | "capacity_mismatch" | "occupancy_mismatch" | "timeline_mismatch" | "general";
  severity: "low" | "medium" | "high" | "critical";
  existingClaim: string;
  newClaim: string;
  existingSource: string;
  newSource: string;
  recommendation: string;
  confidence: number;
}

function extractNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  return match ? Number(match[1]) : null;
}

export function detectDataConflicts(input: {
  project: ProjectWithRelations;
  buildingMemory?: BuildingMemory | null;
  evidence: SourceEvidence[];
  diagnosis: DiagnosisItem[];
  recentDocumentSummaries?: string[];
}): Omit<DataConflict, "id">[] {
  const conflicts: Omit<DataConflict, "id">[] = [];
  const { project, buildingMemory, evidence, diagnosis, recentDocumentSummaries = [] } = input;

  const memoryFacts = buildingMemory?.knownFacts ?? [];
  const allText = [
    ...memoryFacts,
    buildingMemory?.summary ?? "",
    ...evidence.map((e) => e.quote ?? ""),
    ...recentDocumentSummaries,
  ].join(" ");

  const memoryFloorArea = extractNumber(allText, /(\d[\d,]*)\s*sqm/i);
  const docFloorAreas = recentDocumentSummaries
    .map((s) => extractNumber(s, /(\d[\d,]*)\s*sqm/i))
    .filter((n): n is number => n !== null);

  for (const area of docFloorAreas) {
    if (memoryFloorArea && Math.abs(area - memoryFloorArea) / memoryFloorArea > 0.08) {
      conflicts.push({
        title: "Gross floor area mismatch",
        category: "drawing_mismatch",
        severity: "high",
        existingClaim: `Building Memory references ~${memoryFloorArea.toLocaleString()} sqm GFA`,
        newClaim: `Recent document analysis reports ${area.toLocaleString()} sqm`,
        existingSource: "Building Memory",
        newSource: "Document analysis",
        recommendation: "Verify measured GFA against as-built drawings and update Building Memory.",
        confidence: 0.86,
      });
      break;
    }
  }

  const fireEvidence = evidence.filter(
    (e) =>
      e.quote?.toLowerCase().includes("fire") ||
      e.quote?.includes("防火") ||
      e.locationLabel?.toLowerCase().includes("fire")
  );
  const fireDiagnosis = diagnosis.filter((d) => d.category === "fire_safety" && d.severity !== "low");

  if (fireEvidence.length > 0 && fireDiagnosis.length > 0) {
    const optimistic = fireEvidence.some((e) =>
      /compliant|meets|adequate|符合/.test(e.quote ?? "")
    );
    const critical = fireDiagnosis.some((d) => d.severity === "critical" || d.severity === "high");
    if (optimistic && critical) {
      conflicts.push({
        title: "Fire safety assessment conflict",
        category: "occupancy_mismatch",
        severity: "critical",
        existingClaim: fireEvidence[0].quote ?? "Document evidence suggests acceptable fire conditions",
        newClaim: fireDiagnosis[0].title,
        existingSource: `Evidence: ${fireEvidence[0].locationLabel ?? fireEvidence[0].sourceType}`,
        newSource: `Diagnosis: ${fireDiagnosis[0].category}`,
        recommendation: "Commission fire engineering review to reconcile document findings with diagnosis.",
        confidence: 0.9,
      });
    }
  }

  const loadDiagnosis = diagnosis.find(
    (d) =>
      d.category === "structure" &&
      (d.title.toLowerCase().includes("load") || d.title.includes("承载"))
  );
  const capacityEvidence = evidence.find(
    (e) =>
      e.quote?.toLowerCase().includes("capacity") ||
      e.quote?.includes("承载") ||
      e.quote?.toLowerCase().includes("insufficient")
  );

  if (loadDiagnosis && capacityEvidence) {
    conflicts.push({
      title: "Structural capacity information conflict",
      category: "capacity_mismatch",
      severity: "high",
      existingClaim: capacityEvidence.quote ?? "Evidence notes capacity concern",
      newClaim: loadDiagnosis.description.slice(0, 160),
      existingSource: capacityEvidence.locationLabel ?? "Source evidence",
      newSource: `Diagnosis: ${loadDiagnosis.title}`,
      recommendation: "Structural engineer to reconcile survey evidence with load verification diagnosis.",
      confidence: 0.84,
    });
  }

  if (
    project.currentFunction !== project.targetFunction &&
    buildingMemory?.summary.toLowerCase().includes("strong") &&
    diagnosis.filter((d) => d.severity === "critical").length >= 2
  ) {
    conflicts.push({
      title: "Optimistic memory vs critical diagnosis",
      category: "general",
      severity: "medium",
      existingClaim: buildingMemory.summary.slice(0, 120),
      newClaim: `${diagnosis.filter((d) => d.severity === "critical").length} critical diagnosis items for occupancy change`,
      existingSource: "Building Memory summary",
      newSource: "Diagnosis module",
      recommendation: "Refresh Building Memory after resolving critical diagnosis items.",
      confidence: 0.8,
    });
  }

  const drawingIssues = (project.issues ?? []).filter(
    (i) => i.category === "drawing_mismatch" && i.status === "open"
  );
  if (drawingIssues.length > 0 && recentDocumentSummaries.length > 0) {
    conflicts.push({
      title: "As-built drawing mismatch flagged",
      category: "drawing_mismatch",
      severity: "high",
      existingClaim: drawingIssues[0].description.slice(0, 140),
      newClaim: recentDocumentSummaries[0].slice(0, 140),
      existingSource: `Site issue: ${drawingIssues[0].title}`,
      newSource: "Latest document analysis",
      recommendation: "Field-verify floor plate dimensions and update drawing archive.",
      confidence: 0.88,
    });
  }

  return conflicts;
}

export function conflictsToInsights(
  projectId: string,
  conflicts: Omit<DataConflict, "id">[]
): Omit<AIInsight, "id" | "projectId" | "createdAt" | "updatedAt">[] {
  return conflicts.map((c) => ({
    title: c.title,
    type: "data_conflict" as const,
    priority:
      c.severity === "critical"
        ? ("critical" as const)
        : c.severity === "high"
          ? ("high" as const)
          : ("medium" as const),
    summary: `${c.existingClaim} ↔ ${c.newClaim}`,
    evidence: `${c.existingSource} vs ${c.newSource}`,
    recommendation: c.recommendation,
    confidence: c.confidence,
    status: "open" as const,
    sourceType: "conflict_detection",
    sourceId: null,
  }));
}
