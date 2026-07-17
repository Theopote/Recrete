"use client";

import { useEffect, useState } from "react";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ProjectWithRelations } from "@/types";
import { MEASUREMENT_FIELD_LABELS, mergeMeasurements } from "@/lib/ai/compliance/measurements";
import type {
  ProjectSiteMeasurementsDto,
  ProjectSiteMeasurementsResponse,
} from "@/types/site-measurements";
import { Building2, ShieldCheck, Loader2, Sparkles, Flame, Zap, Coins, Leaf, Landmark, ArrowUpDown } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import type { BilingualString } from "@/lib/i18n/bilingual";
import { MepIfcClashPanel } from "@/components/bim/MepIfcClashPanel";
import { ElevatorFeasibilityPanel } from "@/components/building-condition/ElevatorFeasibilityPanel";
import { DataSourceNote } from "@/components/ai/WebReference";
import type { BimModel } from "@/types/bim";
import type { ElevatorFeasibilityResult } from "@/types/elevator-feasibility";
import type { ElevatorBimMockScenario } from "@/lib/mock-data/elevator-bim-rooms";

type ExpertTab = "structural" | "compliance" | "fire" | "mep" | "energy" | "cost" | "heritage" | "elevator";

type StrengtheningMethod = {
  method: BilingualString | string;
  pros: Array<BilingualString | string>;
  cons: Array<BilingualString | string>;
  costLevel: string;
};

type StrengtheningOptions = Record<string, StrengtheningMethod[]>;

interface ExpertAgentsSectionProps {
  project: ProjectWithRelations;
}

export function ExpertAgentsSection({ project }: ExpertAgentsSectionProps) {
  const { locale, t, bt } = useLocale();
  const [activeTab, setActiveTab] = useState<ExpertTab>("structural");
  const [structuralLoading, setStructuralLoading] = useState(false);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [structuralResult, setStructuralResult] = useState<Record<string, unknown> | null>(null);
  const [complianceResult, setComplianceResult] = useState<Record<string, unknown> | null>(null);
  const [fireLoading, setFireLoading] = useState(false);
  const [mepLoading, setMepLoading] = useState(false);
  const [costLoading, setCostLoading] = useState(false);
  const [fireResult, setFireResult] = useState<Record<string, unknown> | null>(null);
  const [mepResult, setMepResult] = useState<Record<string, unknown> | null>(null);
  const [energyLoading, setEnergyLoading] = useState(false);
  const [energyResult, setEnergyResult] = useState<Record<string, unknown> | null>(null);
  const [costResult, setCostResult] = useState<Record<string, unknown> | null>(null);
  const [heritageLoading, setHeritageLoading] = useState(false);
  const [heritageResult, setHeritageResult] = useState<Record<string, unknown> | null>(null);
  const [elevatorLoading, setElevatorLoading] = useState(false);
  const [elevatorResult, setElevatorResult] = useState<ElevatorFeasibilityResult | null>(null);
  const [elevatorMockScenario, setElevatorMockScenario] = useState<ElevatorBimMockScenario>("feasible");
  const [bimModels, setBimModels] = useState<BimModel[]>([]);
  const [selectedBimModelId, setSelectedBimModelId] = useState("");

  const [structuralInput, setStructuralInput] = useState({
    carbonationDepth: "",
    coverThickness: "",
    existingLoad: "",
    targetLoad: "",
  });

  const [complianceMeta, setComplianceMeta] = useState<{
    scenarios?: string[];
    applicableCodes?: Array<{ code: string; nameZh: string; category: string }>;
    history?: Array<{
      id: string;
      overallCompliance: string;
      diagnosisCount: number;
      diagnosisApplied: boolean;
      createdAt: string;
    }>;
  } | null>(null);

  const [complianceInput, setComplianceInput] = useState({
    applyDiagnosis: true,
  });

  const [siteMeasurementCompleteness, setSiteMeasurementCompleteness] = useState({
    filled: 0,
    total: 11,
    ratio: 0,
  });

  const [fireInput, setFireInput] = useState({
    stairWidth: "",
    travelDistance: "",
    floorArea: "",
    occupantLoad: "",
    hasSprinkler: false,
  });

  const [mepInput, setMepInput] = useState({
    electricalCapacityKva: "",
    hvacAgeYears: "",
    requiredElectricalKva: "",
    plumbingCondition: "fair" as "good" | "fair" | "poor",
    shaftWidthMm: "",
    shaftDepthMm: "",
    floorToFloorHeightM: "",
    ceilingPlenumMm: "",
    mainBeamDepthMm: "",
    hvacMainDuctWidthMm: "",
    riserCount: "",
    createIssues: true,
  });

  const [energyInput, setEnergyInput] = useState({
    annualEnergyKwh: "",
    windowUValue: "",
    wallInsulated: false,
    hvacAgeYears: "",
    electricityPricePerKwh: "0.85",
  });

  const [heritageInput, setHeritageInput] = useState({
    hasProtectedFacade: false,
    hasHistoricInterior: false,
    interventionScope: "partial_interior" as
      | "facade_only"
      | "partial_interior"
      | "full_adaptive_reuse",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/projects/${project.id}/site-measurements`);
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as ProjectSiteMeasurementsResponse;
      const m = mergeMeasurements(data.historyFallback ?? {}, data.measurements);
      setSiteMeasurementCompleteness(data.completeness);
      setStructuralInput({
        carbonationDepth: m.carbonationDepth?.toString() ?? "",
        coverThickness: m.coverThickness?.toString() ?? "",
        existingLoad: m.existingLoadKN?.toString() ?? "",
        targetLoad: m.targetLoadKN?.toString() ?? "",
      });
      setFireInput((prev) => ({
        ...prev,
        stairWidth: m.stairWidth?.toString() ?? "",
        travelDistance: m.travelDistance?.toString() ?? "",
        hasSprinkler: m.hasSprinkler ?? false,
      }));
      setEnergyInput((prev) => ({
        ...prev,
        windowUValue: m.windowUValue?.toString() ?? "",
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/projects/${project.id}/bim-models`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      const list = (data.models as BimModel[]).map((model) => ({
        ...model,
        createdAt: new Date(model.createdAt),
        updatedAt: new Date(model.updatedAt),
      }));
      if (!cancelled) {
        setBimModels(list);
        const firstReadyIfc = list.find((model) => model.format === "ifc" && model.status === "ready");
        if (firstReadyIfc) setSelectedBimModelId(firstReadyIfc.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  const selectedBimModel =
    bimModels.find((model) => model.id === selectedBimModelId) ?? null;

  const parseOptionalNum = (value: string) => {
    if (!value.trim()) return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
  };

  const syncSiteMeasurements = async (updates: Record<string, unknown>) => {
    const res = await fetch(`/api/projects/${project.id}/site-measurements`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updates, replace: false }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as ProjectSiteMeasurementsDto;
    setSiteMeasurementCompleteness(data.completeness);
  };

  const runStructural = async () => {
    setStructuralLoading(true);
    try {
      await syncSiteMeasurements({
        carbonationDepth: parseOptionalNum(structuralInput.carbonationDepth),
        coverThickness: parseOptionalNum(structuralInput.coverThickness),
        existingLoadKN: parseOptionalNum(structuralInput.existingLoad),
        targetLoadKN: parseOptionalNum(structuralInput.targetLoad),
      });
      const res = await fetch(`/api/projects/${project.id}/experts/structural`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carbonationDepth: structuralInput.carbonationDepth
            ? Number(structuralInput.carbonationDepth)
            : undefined,
          existingLoad: structuralInput.existingLoad
            ? Number(structuralInput.existingLoad)
            : undefined,
          targetLoad: structuralInput.targetLoad ? Number(structuralInput.targetLoad) : undefined,
        }),
      });
      if (res.ok) setStructuralResult(await res.json());
    } finally {
      setStructuralLoading(false);
    }
  };

  const loadComplianceMeta = async () => {
    const res = await fetch(`/api/projects/${project.id}/compliance?history=5`);
    if (res.ok) {
      const data = await res.json();
      setComplianceMeta({
        scenarios: data.scenarios,
        applicableCodes: data.applicableCodes,
        history: data.history?.map((h: {
          id: string;
          overallCompliance: string;
          diagnosisCount: number;
          diagnosisApplied: boolean;
          createdAt: string;
        }) => ({
          id: h.id,
          overallCompliance: h.overallCompliance,
          diagnosisCount: h.diagnosisCount,
          diagnosisApplied: h.diagnosisApplied,
          createdAt: h.createdAt,
        })),
      });
    }
  };

  const runCompliance = async () => {
    setComplianceLoading(true);
    try {
      if (!complianceMeta) await loadComplianceMeta();
      await syncSiteMeasurements({
        stairWidth: parseOptionalNum(fireInput.stairWidth),
        travelDistance: parseOptionalNum(fireInput.travelDistance),
        hasSprinkler: fireInput.hasSprinkler,
        windowUValue: parseOptionalNum(energyInput.windowUValue),
        carbonationDepth: parseOptionalNum(structuralInput.carbonationDepth),
        coverThickness: parseOptionalNum(structuralInput.coverThickness),
        existingLoadKN: parseOptionalNum(structuralInput.existingLoad),
        targetLoadKN: parseOptionalNum(structuralInput.targetLoad),
      });
      const res = await fetch(`/api/projects/${project.id}/experts/compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applyDiagnosis: complianceInput.applyDiagnosis,
        }),
      });
      if (res.ok) {
        setComplianceResult(await res.json());
        await loadComplianceMeta();
      }
    } finally {
      setComplianceLoading(false);
    }
  };

  const runFire = async () => {
    setFireLoading(true);
    try {
      await syncSiteMeasurements({
        stairWidth: parseOptionalNum(fireInput.stairWidth),
        travelDistance: parseOptionalNum(fireInput.travelDistance),
        hasSprinkler: fireInput.hasSprinkler,
      });
      const res = await fetch(`/api/projects/${project.id}/experts/fire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stairWidth: fireInput.stairWidth ? Number(fireInput.stairWidth) : undefined,
          travelDistance: fireInput.travelDistance ? Number(fireInput.travelDistance) : undefined,
          floorArea: fireInput.floorArea ? Number(fireInput.floorArea) : undefined,
          occupantLoad: fireInput.occupantLoad ? Number(fireInput.occupantLoad) : undefined,
          hasSprinkler: fireInput.hasSprinkler,
        }),
      });
      if (res.ok) setFireResult(await res.json());
    } finally {
      setFireLoading(false);
    }
  };

  const runMep = async () => {
    setMepLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/experts/mep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electricalCapacityKva: mepInput.electricalCapacityKva
            ? Number(mepInput.electricalCapacityKva)
            : undefined,
          hvacAgeYears: mepInput.hvacAgeYears ? Number(mepInput.hvacAgeYears) : undefined,
          requiredElectricalKva: mepInput.requiredElectricalKva
            ? Number(mepInput.requiredElectricalKva)
            : undefined,
          plumbingCondition: mepInput.plumbingCondition,
          shaftWidthMm: mepInput.shaftWidthMm ? Number(mepInput.shaftWidthMm) : undefined,
          shaftDepthMm: mepInput.shaftDepthMm ? Number(mepInput.shaftDepthMm) : undefined,
          floorToFloorHeightM: mepInput.floorToFloorHeightM
            ? Number(mepInput.floorToFloorHeightM)
            : undefined,
          ceilingPlenumMm: mepInput.ceilingPlenumMm ? Number(mepInput.ceilingPlenumMm) : undefined,
          mainBeamDepthMm: mepInput.mainBeamDepthMm ? Number(mepInput.mainBeamDepthMm) : undefined,
          hvacMainDuctWidthMm: mepInput.hvacMainDuctWidthMm
            ? Number(mepInput.hvacMainDuctWidthMm)
            : undefined,
          riserCount: mepInput.riserCount ? Number(mepInput.riserCount) : undefined,
          createIssues: mepInput.createIssues,
          locale,
        }),
      });
      if (res.ok) setMepResult(await res.json());
    } finally {
      setMepLoading(false);
    }
  };

  const runEnergy = async () => {
    setEnergyLoading(true);
    try {
      await syncSiteMeasurements({
        windowUValue: parseOptionalNum(energyInput.windowUValue),
      });
      const res = await fetch(`/api/projects/${project.id}/experts/energy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annualEnergyKwh: energyInput.annualEnergyKwh
            ? Number(energyInput.annualEnergyKwh)
            : undefined,
          windowUValue: energyInput.windowUValue ? Number(energyInput.windowUValue) : undefined,
          wallInsulated: energyInput.wallInsulated,
          hvacAgeYears: energyInput.hvacAgeYears ? Number(energyInput.hvacAgeYears) : undefined,
          electricityPricePerKwh: energyInput.electricityPricePerKwh
            ? Number(energyInput.electricityPricePerKwh)
            : undefined,
        }),
      });
      if (res.ok) setEnergyResult(await res.json());
    } finally {
      setEnergyLoading(false);
    }
  };

  const runCost = async () => {
    setCostLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/experts/cost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) setCostResult(await res.json());
    } finally {
      setCostLoading(false);
    }
  };

  const runHeritage = async () => {
    setHeritageLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/experts/heritage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(heritageInput),
      });
      if (res.ok) setHeritageResult(await res.json());
    } finally {
      setHeritageLoading(false);
    }
  };

  const runElevator = async () => {
    setElevatorLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/experts/elevator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingLoad: structuralInput.existingLoad
            ? Number(structuralInput.existingLoad)
            : undefined,
          mockScenario: elevatorMockScenario,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setElevatorResult(data.result ?? null);
      }
    } finally {
      setElevatorLoading(false);
    }
  };

  const fireAnalysis = fireResult?.analysis as {
    egressRating?: string;
    compartmentRating?: string;
    findings?: Array<BilingualString | string>;
    recommendations?: Array<BilingualString | string>;
  } | undefined;

  const mepAnalysis = mepResult?.analysis as {
    overallRating?: string;
    findings?: Array<BilingualString | string>;
    recommendations?: Array<BilingualString | string>;
    estimatedUpgradeScope?: Array<BilingualString | string>;
    electricalLoad?: {
      capacityKva: number;
      requiredKva: number;
      utilizationPercent: number;
      status: string;
    };
    hvacEfficiency?: {
      estimatedCop: number;
      efficiencyRating: string;
      note: BilingualString | string;
    };
    plumbing?: {
      condition: string;
      findings: Array<BilingualString | string>;
      optimizations: Array<BilingualString | string>;
    };
  } | undefined;

  const mepClashReport = mepResult?.clashReport as {
    clashCount?: number;
    criticalCount?: number;
    summary?: BilingualString | string;
    clashes?: Array<{
      id: string;
      type: string;
      priority: string;
      disciplines: string[];
      title: BilingualString | string;
      description: BilingualString | string;
      location: BilingualString | string;
      remediation: BilingualString | string;
      clearanceMm?: number;
      requiredClearanceMm?: number;
    }>;
  } | undefined;

  const mepIssueStats = mepResult?.issueStats as {
    created?: number;
    skipped?: number;
  } | undefined;

  const energyAnalysis = energyResult?.analysis as {
    simulation?: {
      estimatedAnnualKwh: number;
      rating: string;
      benchmarkComparison: { currentEui: number; targetEui: number; gapPercent: number };
      breakdown: Array<{ system: string; systemZh: string; kwh: number; sharePercent: number }>;
    };
    recommendedBundle?: Array<{
      name: string;
      nameZh: string;
      estimatedSavingsPercent: number;
      estimatedCostPerSqm: number;
    }>;
    roi?: {
      totalInvestment: number;
      annualCostSavings: number;
      simplePaybackYears: number;
      roiPercent10Year: number;
    };
    findings?: Array<BilingualString | string>;
    recommendations?: Array<BilingualString | string>;
  } | undefined;

  const costEstimate = costResult?.estimate as {
    estimatedCostPerSqm?: number;
    estimatedCostPerSqmMin?: number;
    estimatedCostPerSqmMax?: number;
    estimatedTotalCost?: number;
    costLevel?: string;
    confidence?: number;
    benchmark?: { region: string; sampleSize: number; updatedAt: string };
    referenceCases?: Array<{ title: string; costPerSqm?: number; outcome?: string }>;
    breakdown?: Array<{ item: string; itemZh?: string; sharePercent: number }>;
    wbsItems?: Array<{
      code: string;
      name: string;
      nameZh?: string;
      unit: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
      sharePercent: number;
    }>;
    provenance?: { dataSourceNote?: string; projectActualRecordCount?: number };
  } | undefined;

  const heritageAssessment = heritageResult?.assessment as {
    heritageLevel?: string;
    overallRisk?: string;
    authenticityScores?: Array<{
      factor: string;
      labelEn: string;
      labelZh: string;
      score: number;
      noteEn: string;
      noteZh: string;
    }>;
    reversibleInterventions?: BilingualString[];
    prohibitedActions?: BilingualString[];
    recommendations?: BilingualString[];
    guidelines?: Array<{ id: string; principleEn: string; principleZh: string }>;
  } | undefined;

  const assessment = structuralResult?.assessment as {
    safetyRating?: string;
    findings?: Array<BilingualString | string>;
    recommendations?: Array<BilingualString | string>;
    loadCapacityCheck?: { compliant: boolean; note: BilingualString | string };
    risks?: Array<{
      issue: BilingualString | string;
      severity: string;
      recommendation: BilingualString | string;
    }>;
  } | undefined;

  const strengtheningOptions = structuralResult?.strengtheningOptions as StrengtheningOptions | undefined;

  const strengtheningIssueLabel = (key: string) => {
    const labels: Record<string, [string, string]> = {
      insufficient_capacity: ["Insufficient capacity", "承载力不足"],
      corrosion: ["Rebar corrosion", "钢筋腐蚀"],
      seismic: ["Seismic strengthening", "抗震加固"],
      crack: ["Crack treatment", "裂缝处理"],
      masonry_seismic: ["Masonry seismic retrofit", "砌体抗震加固"],
      settlement: ["Differential settlement", "地基不均匀沉降"],
      joint_strengthening: ["Beam-column joint strengthening", "梁柱节点加固"],
      precast_slab: ["Precast slab retrofit", "预制板结构改造"],
      timber_protection: ["Timber conservation strengthening", "木结构保护性加固"],
    };
    const pair = labels[key];
    return pair ? t(pair[0], pair[1]) : key;
  };

  const costLevelLabel = (level: string) => {
    if (level === "low") return t("Low", "低");
    if (level === "medium") return t("Medium", "中");
    if (level === "high") return t("High", "高");
    return level;
  };

  const complianceStatusLabel = (status: string) => {
    if (status === "compliant") return t("Compliant", "符合");
    if (status === "non_compliant") return t("Non-compliant", "不符合");
    if (status === "requires_verification") return t("Verify", "待核实");
    return status;
  };

  const overallComplianceLabel = (status: string) => {
    if (status === "compliant") return t("Compliant", "整体符合");
    if (status === "non_compliant") return t("Non-compliant", "存在不合规项");
    if (status === "partial") return t("Partial", "部分符合");
    return status;
  };

  const riskLevelLabel = (risk: string) => {
    if (risk === "low") return t("Low", "低");
    if (risk === "medium") return t("Medium", "中");
    if (risk === "high") return t("High", "高");
    return risk;
  };

  const safetyRatingLabel = (rating: string) => {
    if (rating === "safe") return t("Safe", "安全");
    if (rating === "acceptable") return t("Acceptable", "基本满足");
    if (rating === "marginal") return t("Marginal", "边缘");
    if (rating === "unsafe") return t("Unsafe", "不安全");
    return rating;
  };

  const egressRatingLabel = (rating: string) => {
    if (rating === "adequate") return t("Adequate", "满足");
    if (rating === "marginal") return t("Marginal", "边缘");
    if (rating === "insufficient") return t("Insufficient", "不足");
    if (rating === "unknown") return t("Unknown", "待核实");
    return rating;
  };

  const compartmentRatingLabel = (rating: string) => {
    if (rating === "compliant") return t("Compliant", "符合");
    if (rating === "non_compliant") return t("Non-compliant", "不符合");
    if (rating === "requires_verification") return t("Verify", "待核实");
    return rating;
  };

  const mepOverallRatingLabel = (rating: string) => {
    if (rating === "adequate") return t("Adequate", "满足");
    if (rating === "upgrade_required") return t("Upgrade required", "需升级");
    if (rating === "replacement_required") return t("Replacement required", "需更换");
    return rating;
  };

  const electricalStatusLabel = (status: string) => {
    if (status === "adequate") return t("Adequate", "充足");
    if (status === "marginal") return t("Marginal", "边缘");
    if (status === "insufficient") return t("Insufficient", "不足");
    return status;
  };

  const mepClashPriorityLabel = (priority: string) => {
    if (priority === "critical") return t("Critical", "严重");
    if (priority === "high") return t("High", "高");
    if (priority === "medium") return t("Medium", "中");
    if (priority === "low") return t("Low", "低");
    return priority;
  };

  const energyRatingLabel = (rating: string) => {
    if (rating === "poor") return t("Poor", "较差");
    if (rating === "average") return t("Average", "一般");
    if (rating === "good") return t("Good", "良好");
    return rating;
  };

  const heritageLevelLabel = (level: string) => {
    const labels: Record<string, [string, string]> = {
      national: ["National heritage", "全国重点文物"],
      provincial: ["Provincial heritage", "省级文物"],
      municipal: ["Municipal heritage", "市级文物"],
      district: ["District heritage", "区县级文物"],
      none: ["None", "无文保等级"],
    };
    const pair = labels[level];
    return pair ? t(pair[0], pair[1]) : level;
  };

  const severityLabel = (severity: string) => {
    if (severity === "low") return t("Low", "低");
    if (severity === "medium") return t("Medium", "中");
    if (severity === "high") return t("High", "高");
    if (severity === "critical") return t("Critical", "严重");
    return severity;
  };

  const report = complianceResult?.report as {
    engineVersion?: string;
    overallCompliance?: string;
    scenarios?: string[];
    climateZone?: string;
    summary?: {
      total: number;
      compliant: number;
      nonCompliant: number;
      requiresVerification: number;
    };
    measurementCoverage?: {
      fieldsFilled: number;
      fieldsTotal: number;
      dataDependentRules: number;
      dataDependentRulesResolved: number;
      missingFields: string[];
    };
    applicableCodes?: Array<{ code: string; nameZh: string; category: string }>;
    checks?: Array<{
      ruleId: string;
      requirement: string;
      requirementZh?: string;
      status: string;
      code: string;
      section?: string;
      priority: string;
      note: string;
      noteZh?: string;
      remediation?: BilingualString | string;
      requiredValue?: string;
      actualValue?: string;
    }>;
    criticalIssues?: Array<BilingualString | string>;
    recommendations?: Array<BilingualString | string>;
  } | undefined;

  const diagnosisStats = complianceResult?.diagnosisStats as {
    created?: number;
    skipped?: number;
  } | undefined;

  const complianceRun = complianceResult?.run as {
    id?: string;
    diagnosisApplied?: boolean;
    diagnosisCount?: number;
  } | undefined;

  const statusColor = (status: string) => {
    if (status === "compliant") return "border-green-300 text-green-700";
    if (status === "non_compliant") return "border-destructive text-destructive";
    return "border-amber-300 text-amber-700";
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Expert Agent Matrix"
        titleZh="专家 Agent 矩阵"
        description="Run structural, MEP, energy, and compliance expert agents with optional site measurements."
        descriptionZh="运行结构、机电、能效与合规专家 Agent，可输入现场测量数据辅助评估。"
      />

      <div className="flex gap-2">
        <Button
          variant={activeTab === "structural" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("structural")}
        >
          <Building2 className="h-3.5 w-3.5" /> {t("Structural", "结构")}
        </Button>
        <Button
          variant={activeTab === "compliance" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => {
            setActiveTab("compliance");
            if (!complianceMeta) void loadComplianceMeta();
            void fetch(`/api/projects/${project.id}/site-measurements`)
              .then((res) => (res.ok ? res.json() : null))
              .then((data: ProjectSiteMeasurementsDto | null) => {
                if (data) setSiteMeasurementCompleteness(data.completeness);
              });
          }}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> {t("Compliance", "合规")}
        </Button>
        <Button
          variant={activeTab === "fire" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("fire")}
        >
          <Flame className="h-3.5 w-3.5" /> {t("Fire", "消防")}
        </Button>
        <Button
          variant={activeTab === "mep" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("mep")}
        >
          <Zap className="h-3.5 w-3.5" /> {t("MEP", "机电")}
        </Button>
        <Button
          variant={activeTab === "energy" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("energy")}
        >
          <Leaf className="h-3.5 w-3.5" /> {t("Energy", "能效")}
        </Button>
        <Button
          variant={activeTab === "cost" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("cost")}
        >
          <Coins className="h-3.5 w-3.5" /> {t("Cost", "成本")}
        </Button>
        <Button
          variant={activeTab === "heritage" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("heritage")}
        >
          <Landmark className="h-3.5 w-3.5" /> {t("Heritage", "遗产")}
        </Button>
        <Button
          variant={activeTab === "elevator" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => {
            setActiveTab("elevator");
            void fetch(`/api/projects/${project.id}/experts/elevator`)
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                if (data?.result) setElevatorResult(data.result);
              });
          }}
        >
          <ArrowUpDown className="h-3.5 w-3.5" /> {t("Elevator", "电梯")}
        </Button>
      </div>

      {activeTab === "structural" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {t("Structural Engineer Agent", "结构工程师 Agent")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">{t("Carbonation depth (mm)", "碳化深度 (mm)")}</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder={t("e.g. 18", "如 18")}
                    value={structuralInput.carbonationDepth}
                    onChange={(e) =>
                      setStructuralInput((s) => ({ ...s, carbonationDepth: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("Cover thickness (mm)", "保护层厚度 (mm)")}</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder={t("e.g. 25", "如 25")}
                    value={structuralInput.coverThickness}
                    onChange={(e) =>
                      setStructuralInput((s) => ({ ...s, coverThickness: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("Existing load (kN/m²)", "现有荷载 (kN/m²)")}</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder={t("e.g. 2.0", "如 2.0")}
                    value={structuralInput.existingLoad}
                    onChange={(e) =>
                      setStructuralInput((s) => ({ ...s, existingLoad: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("Target load (kN/m²)", "目标荷载 (kN/m²)")}</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder={t("e.g. 3.5", "如 3.5")}
                    value={structuralInput.targetLoad}
                    onChange={(e) =>
                      setStructuralInput((s) => ({ ...s, targetLoad: e.target.value }))
                    }
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {t(
                  "Values sync to project site measurements when you run the assessment.",
                  "运行评估时会同步写入项目现场测量数据。"
                )}
              </p>
              <Button variant="copper" size="sm" onClick={runStructural} disabled={structuralLoading}>
                {structuralLoading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                {t("Run Structural Assessment", "运行结构评估")}
              </Button>
            </CardContent>
          </Card>

          {assessment && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("Safety rating", "安全评级")}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {safetyRatingLabel(assessment.safetyRating ?? "")}
                  </Badge>
                </div>
                {assessment.findings && assessment.findings.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">{t("Findings", "发现")}</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {assessment.findings.map((f, i) => (
                        <li key={i}>• {bt(f)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {assessment.risks && assessment.risks.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">{t("Risks", "风险")}</p>
                    <ul className="text-xs space-y-2">
                      {assessment.risks.map((r, i) => (
                        <li key={i}>
                          <span className="font-medium">{bt(r.issue)}</span>{" "}
                          <Badge variant="outline" className="text-[10px] ml-1">
                            {severityLabel(r.severity)}
                          </Badge>
                          <p className="text-muted-foreground mt-0.5">{bt(r.recommendation)}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {assessment.loadCapacityCheck && (
                  <div className="border rounded-md p-2 text-xs">
                    <p className="font-medium mb-1">{t("Load capacity check", "承载力复核")}</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] mb-1 ${assessment.loadCapacityCheck.compliant ? "border-green-300" : "border-destructive"}`}
                    >
                      {assessment.loadCapacityCheck.compliant
                        ? t("Compliant", "满足")
                        : t("Insufficient", "不足")}
                    </Badge>
                    <p className="text-muted-foreground">{bt(assessment.loadCapacityCheck.note)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {strengtheningOptions && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {t("Strengthening recommendations", "加固方案建议")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {Object.entries(strengtheningOptions).map(([key, methods]) =>
                  methods.length > 0 ? (
                    <div key={key}>
                      <p className="text-xs font-medium mb-2">{strengtheningIssueLabel(key)}</p>
                      <div className="space-y-2">
                        {methods.map((m, mi) => (
                          <div key={mi} className="border rounded-md p-2 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{bt(m.method)}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {costLevelLabel(m.costLevel)} {t("cost", "造价")}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mt-1">
                              {t("Pros", "优点")}：{m.pros.map((p) => bt(p)).join("；")}
                            </p>
                            <p className="text-muted-foreground mt-0.5">
                              {t("Cons", "缺点")}：{m.cons.map((c) => bt(c)).join("；")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "compliance" && (
        <div className="space-y-4">
          {complianceMeta && (
            <Card>
              <CardContent className="p-4 space-y-2 text-xs">
                <p className="font-medium">{t("Applicable codes", "适用规范")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {complianceMeta.applicableCodes?.map((c) => (
                    <Badge key={c.code} variant="outline" className="text-[10px]">
                      {c.code}
                      {locale === "zh" && c.nameZh ? ` ${c.nameZh}` : ""}
                    </Badge>
                  ))}
                </div>
                {complianceMeta.scenarios && complianceMeta.scenarios.length > 0 && (
                  <p className="text-muted-foreground">
                    {t("Scenarios", "场景")}: {complianceMeta.scenarios.join(", ")}
                  </p>
                )}
                {complianceMeta.history && complianceMeta.history.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="font-medium mb-1">{t("Recent runs", "历史记录")}</p>
                    <ul className="text-muted-foreground space-y-1">
                      {complianceMeta.history.map((h) => (
                        <li key={h.id}>
                          • {new Date(h.createdAt).toLocaleString()} —{" "}
                          {overallComplianceLabel(h.overallCompliance)}
                          {h.diagnosisApplied
                            ? ` · ${t(`${h.diagnosisCount} diagnosis written`, `写入 ${h.diagnosisCount} 条诊断`)}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {t("Compliance Engine", "合规引擎")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-copper/30 bg-copper/5 p-3 text-xs space-y-2">
                <p className="font-medium">
                  {t(
                    `Project measurements: ${siteMeasurementCompleteness.filled}/${siteMeasurementCompleteness.total} fields`,
                    `项目测量数据：已填 ${siteMeasurementCompleteness.filled}/${siteMeasurementCompleteness.total} 项`
                  )}
                </p>
                <p className="text-muted-foreground">
                  {t(
                    "Compliance checks use saved site measurements from Building Condition. Fill missing values there for definitive rule results.",
                    "合规检查使用「建筑现状」中保存的现场测量数据。请在彼处补全缺失项以获得明确判定。"
                  )}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/projects/${project.id}?section=building-condition`}>
                    {t("Edit Site Measurements", "编辑现场测量数据")}
                  </a>
                </Button>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={complianceInput.applyDiagnosis}
                  onChange={(e) =>
                    setComplianceInput((s) => ({
                      ...s,
                      applyDiagnosis: e.target.checked,
                    }))
                  }
                />
                {t("Auto-write diagnosis items to database", "自动写入诊断项")}
              </label>
              <Button variant="copper" size="sm" onClick={runCompliance} disabled={complianceLoading}>
                {complianceLoading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                {t("Run Compliance Check", "运行合规检查")}
              </Button>
            </CardContent>
          </Card>

          {report && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t("Overall", "总体")}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {overallComplianceLabel(report.overallCompliance ?? "")}
                  </Badge>
                  {report.climateZone && (
                    <Badge variant="outline" className="text-[10px]">
                      {t("Climate", "气候区")}: {report.climateZone}
                    </Badge>
                  )}
                  {report.engineVersion && (
                    <Badge variant="outline" className="text-[10px]">
                      {t("Engine", "引擎")} v{report.engineVersion}
                    </Badge>
                  )}
                  {complianceRun?.id && (
                    <Badge variant="outline" className="text-[10px]">
                      {t("Run", "运行")} {complianceRun.id.slice(0, 8)}
                    </Badge>
                  )}
                </div>

                {diagnosisStats && (
                  <p className="text-xs text-muted-foreground">
                    {t("Diagnosis", "诊断")}: {diagnosisStats.created ?? 0}{" "}
                    {t("created", "条已创建")}
                    {(diagnosisStats.skipped ?? 0) > 0
                      ? `, ${diagnosisStats.skipped} ${t("skipped (duplicate)", "条跳过（重复）")}`
                      : ""}
                    {complianceRun?.diagnosisApplied ? ` · ${t("persisted", "已持久化")}` : ""}
                  </p>
                )}

                {report.summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="border rounded-md p-2">
                      <p className="text-muted-foreground">{t("Total", "总计")}</p>
                      <p className="font-semibold">{report.summary.total}</p>
                    </div>
                    <div className="border rounded-md p-2 border-green-200">
                      <p className="text-muted-foreground">{t("Compliant", "符合")}</p>
                      <p className="font-semibold">{report.summary.compliant}</p>
                    </div>
                    <div className="border rounded-md p-2 border-destructive/30">
                      <p className="text-muted-foreground">{t("Non-compliant", "不符合")}</p>
                      <p className="font-semibold">{report.summary.nonCompliant}</p>
                    </div>
                    <div className="border rounded-md p-2 border-amber-200">
                      <p className="text-muted-foreground">{t("Verify", "待核实")}</p>
                      <p className="font-semibold">{report.summary.requiresVerification}</p>
                    </div>
                  </div>
                )}

                {report.measurementCoverage && (
                  <div className="rounded-md border border-copper/30 bg-copper/5 p-3 text-xs space-y-2">
                    <p className="font-medium">
                      {t(
                        `Measurement data: ${report.measurementCoverage.fieldsFilled}/${report.measurementCoverage.fieldsTotal} fields · ${report.measurementCoverage.dataDependentRulesResolved}/${report.measurementCoverage.dataDependentRules} measurable rules resolved`,
                        `测量数据：${report.measurementCoverage.fieldsFilled}/${report.measurementCoverage.fieldsTotal} 项 · ${report.measurementCoverage.dataDependentRulesResolved}/${report.measurementCoverage.dataDependentRules} 条可量化规则已判定`
                      )}
                    </p>
                    {report.measurementCoverage.missingFields.length > 0 && (
                      <p className="text-muted-foreground">
                        {t("Missing fields", "缺失字段")}:{" "}
                        {report.measurementCoverage.missingFields
                          .map((key) => {
                            const label =
                              MEASUREMENT_FIELD_LABELS[
                                key as keyof typeof MEASUREMENT_FIELD_LABELS
                              ];
                            return label ? t(label.en, label.zh) : key;
                          })
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                )}

                {report.checks && (
                  <div className="space-y-2">
                    {report.checks.map((c) => (
                      <div key={c.ruleId} className="text-xs border rounded-md p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">
                            {t(c.requirement, c.requirementZh ?? c.requirement)}
                          </span>
                          <div className="flex gap-1">
                            <Badge variant="outline" className={`text-[10px] ${statusColor(c.status)}`}>
                              {complianceStatusLabel(c.status)}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {c.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-muted-foreground mt-1">
                          {c.code}
                          {c.section ? ` §${c.section}` : ""} — {t(c.note, c.noteZh ?? c.note)}
                        </p>
                        {(c.requiredValue || c.actualValue) && (
                          <p className="text-muted-foreground mt-0.5">
                            {t("Required", "要求")}: {c.requiredValue}
                            {c.actualValue ? ` · ${t("Actual", "实测")}: ${c.actualValue}` : ""}
                          </p>
                        )}
                        {c.remediation && (
                          <p className="text-muted-foreground mt-0.5">→ {bt(c.remediation)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {report.criticalIssues && report.criticalIssues.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-destructive mb-1">
                      {t("Critical issues", "严重问题")}
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {report.criticalIssues.map((i, idx) => (
                        <li key={idx}>• {bt(i)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.recommendations && report.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">{t("Recommendations", "建议")}</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {report.recommendations.slice(0, 5).map((i, idx) => (
                        <li key={idx}>• {bt(i)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "fire" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {t("Fire Protection Agent", "消防 Agent")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">{t("Stair width (m)", "楼梯宽度 (m)")}</Label>
                  <Input className="h-8 text-xs mt-1" value={fireInput.stairWidth} onChange={(e) => setFireInput((s) => ({ ...s, stairWidth: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{t("Travel distance (m)", "疏散距离 (m)")}</Label>
                  <Input className="h-8 text-xs mt-1" value={fireInput.travelDistance} onChange={(e) => setFireInput((s) => ({ ...s, travelDistance: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{t("Floor area (m²)", "楼层面积 (m²)")}</Label>
                  <Input className="h-8 text-xs mt-1" value={fireInput.floorArea} onChange={(e) => setFireInput((s) => ({ ...s, floorArea: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{t("Occupant load", "人员密度")}</Label>
                  <Input className="h-8 text-xs mt-1" value={fireInput.occupantLoad} onChange={(e) => setFireInput((s) => ({ ...s, occupantLoad: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={fireInput.hasSprinkler} onChange={(e) => setFireInput((s) => ({ ...s, hasSprinkler: e.target.checked }))} />
                {t("Sprinkler system present", "设有喷淋系统")}
              </label>
              <p className="text-[10px] text-muted-foreground">
                {t(
                  "Stair width, travel distance, and sprinkler sync to project measurements.",
                  "楼梯宽度、疏散距离与喷淋状态会同步至项目测量数据。"
                )}
              </p>
              <Button variant="copper" size="sm" onClick={runFire} disabled={fireLoading}>
                {fireLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                {t("Run Fire Analysis", "运行消防分析")}
              </Button>
            </CardContent>
          </Card>
          {fireAnalysis && (
            <Card><CardContent className="p-4 space-y-2 text-xs">
              <div className="flex gap-2">
                <Badge variant="outline">
                  {t("Egress", "疏散")}: {egressRatingLabel(fireAnalysis.egressRating ?? "")}
                </Badge>
                <Badge variant="outline">
                  {t("Compartment", "防火分区")}:{" "}
                  {compartmentRatingLabel(fireAnalysis.compartmentRating ?? "")}
                </Badge>
              </div>
              <ul className="text-muted-foreground space-y-1">
                {fireAnalysis.findings?.map((f, i) => (
                  <li key={i}>• {bt(f)}</li>
                ))}
              </ul>
              {fireAnalysis.recommendations && fireAnalysis.recommendations.length > 0 && (
                <div>
                  <p className="font-medium mb-1">{t("Recommendations", "建议")}</p>
                  <ul className="text-muted-foreground space-y-1">
                    {fireAnalysis.recommendations.map((r, i) => (
                      <li key={i}>• {bt(r)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent></Card>
          )}
        </div>
      )}

      {activeTab === "mep" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("MEP Expert Agent", "机电专家 Agent")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{t("Electrical capacity (kVA)", "电气容量 (kVA)")}</Label>
                  <Input className="h-8 text-xs mt-1" value={mepInput.electricalCapacityKva} onChange={(e) => setMepInput((s) => ({ ...s, electricalCapacityKva: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{t("Required kVA", "需求 kVA")}</Label>
                  <Input className="h-8 text-xs mt-1" value={mepInput.requiredElectricalKva} onChange={(e) => setMepInput((s) => ({ ...s, requiredElectricalKva: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{t("HVAC age (years)", "暖通年限 (年)")}</Label>
                  <Input className="h-8 text-xs mt-1" value={mepInput.hvacAgeYears} onChange={(e) => setMepInput((s) => ({ ...s, hvacAgeYears: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">{t("Plumbing condition", "给排水状况")}</Label>
                  <select
                    className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    value={mepInput.plumbingCondition}
                    onChange={(e) =>
                      setMepInput((s) => ({
                        ...s,
                        plumbingCondition: e.target.value as "good" | "fair" | "poor",
                      }))
                    }
                  >
                    <option value="good">{t("Good", "良好")}</option>
                    <option value="fair">{t("Fair", "一般")}</option>
                    <option value="poor">{t("Poor", "较差")}</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-medium">{t("Pipeline clash inputs", "管线冲突检测参数")}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">{t("Shaft width (mm)", "管井宽度 (mm)")}</Label>
                    <Input className="h-8 text-xs mt-1" value={mepInput.shaftWidthMm} onChange={(e) => setMepInput((s) => ({ ...s, shaftWidthMm: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Shaft depth (mm)", "管井深度 (mm)")}</Label>
                    <Input className="h-8 text-xs mt-1" value={mepInput.shaftDepthMm} onChange={(e) => setMepInput((s) => ({ ...s, shaftDepthMm: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Riser count", "立管数量")}</Label>
                    <Input className="h-8 text-xs mt-1" value={mepInput.riserCount} onChange={(e) => setMepInput((s) => ({ ...s, riserCount: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Floor-to-floor (m)", "层高 (m)")}</Label>
                    <Input className="h-8 text-xs mt-1" value={mepInput.floorToFloorHeightM} onChange={(e) => setMepInput((s) => ({ ...s, floorToFloorHeightM: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Ceiling plenum (mm)", "吊顶夹层 (mm)")}</Label>
                    <Input className="h-8 text-xs mt-1" value={mepInput.ceilingPlenumMm} onChange={(e) => setMepInput((s) => ({ ...s, ceilingPlenumMm: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("Main beam depth (mm)", "主梁深度 (mm)")}</Label>
                    <Input className="h-8 text-xs mt-1" value={mepInput.mainBeamDepthMm} onChange={(e) => setMepInput((s) => ({ ...s, mainBeamDepthMm: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">{t("HVAC main duct width (mm)", "主风管宽度 (mm)")}</Label>
                    <Input className="h-8 text-xs mt-1" value={mepInput.hvacMainDuctWidthMm} onChange={(e) => setMepInput((s) => ({ ...s, hvacMainDuctWidthMm: e.target.value }))} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={mepInput.createIssues}
                    onChange={(e) => setMepInput((s) => ({ ...s, createIssues: e.target.checked }))}
                  />
                  {t("Create mep_conflict site issues for detected clashes", "为检测到的冲突创建机电冲突现场问题")}
                </label>
              </div>

              <Button variant="copper" size="sm" onClick={runMep} disabled={mepLoading}>
                {mepLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                {t("Run MEP Assessment", "运行机电评估")}
              </Button>
            </CardContent>
          </Card>
          {mepAnalysis && (
            <Card><CardContent className="p-4 space-y-3 text-xs">
              <Badge variant="outline">{mepOverallRatingLabel(mepAnalysis.overallRating ?? "")}</Badge>
              {mepAnalysis.electricalLoad && (
                <div className="border rounded-md p-2">
                  <p className="font-medium mb-1">{t("Electrical load analysis", "电气负荷分析")}</p>
                  <p className="text-muted-foreground">
                    {mepAnalysis.electricalLoad.capacityKva} kVA / {t("required", "需求")}{" "}
                    {mepAnalysis.electricalLoad.requiredKva} kVA
                    （{mepAnalysis.electricalLoad.utilizationPercent}% ·{" "}
                    {electricalStatusLabel(mepAnalysis.electricalLoad.status)}）
                  </p>
                </div>
              )}
              {mepAnalysis.hvacEfficiency && (
                <div className="border rounded-md p-2">
                  <p className="font-medium mb-1">{t("HVAC efficiency", "暖通效率评估")}</p>
                  <p className="text-muted-foreground">
                    COP ~{mepAnalysis.hvacEfficiency.estimatedCop} ·{" "}
                    {energyRatingLabel(mepAnalysis.hvacEfficiency.efficiencyRating)}
                  </p>
                  <p className="text-muted-foreground mt-1">{bt(mepAnalysis.hvacEfficiency.note)}</p>
                </div>
              )}
              {mepAnalysis.plumbing && (
                <div className="border rounded-md p-2">
                  <p className="font-medium mb-1">
                    {t("Plumbing optimization", "给排水优化")}（
                    {energyRatingLabel(mepAnalysis.plumbing.condition)}）
                  </p>
                  {mepAnalysis.plumbing.findings.length > 0 && (
                    <ul className="text-muted-foreground space-y-1 mb-2">
                      {mepAnalysis.plumbing.findings.map((f, i) => (
                        <li key={i}>• {bt(f)}</li>
                      ))}
                    </ul>
                  )}
                  <ul className="text-muted-foreground space-y-1">
                    {mepAnalysis.plumbing.optimizations.map((o, i) => (
                      <li key={i}>• {bt(o)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {mepAnalysis.findings && mepAnalysis.findings.length > 0 && (
                <ul className="text-muted-foreground space-y-1">
                  {mepAnalysis.findings.map((f, i) => (
                    <li key={i}>• {bt(f)}</li>
                  ))}
                </ul>
              )}
              {mepAnalysis.recommendations && mepAnalysis.recommendations.length > 0 && (
                <div>
                  <p className="font-medium mb-1">{t("Recommendations", "建议")}</p>
                  <ul className="text-muted-foreground space-y-1">
                    {mepAnalysis.recommendations.map((r, i) => (
                      <li key={i}>• {bt(r)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {mepAnalysis.estimatedUpgradeScope && mepAnalysis.estimatedUpgradeScope.length > 0 && (
                <p className="text-muted-foreground">
                  {t("Upgrade scope", "升级范围")}：
                  {mepAnalysis.estimatedUpgradeScope.map((s) => bt(s)).join("、")}
                </p>
              )}
            </CardContent></Card>
          )}

          {mepClashReport && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t("Pipeline clash detection", "管线冲突检测")}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={mepClashReport.clashCount ? "destructive" : "outline"}>
                    {mepClashReport.clashCount ?? 0} {t("clash(es)", "处冲突")}
                  </Badge>
                  {(mepClashReport.criticalCount ?? 0) > 0 && (
                    <Badge variant="destructive">
                      {mepClashReport.criticalCount} {t("high/critical", "高/严重")}
                    </Badge>
                  )}
                  {mepIssueStats && (mepIssueStats.created ?? 0) > 0 && (
                    <Badge variant="secondary">
                      {t("Issues created", "已创建问题")}: {mepIssueStats.created}
                    </Badge>
                  )}
                  {mepIssueStats && (mepIssueStats.skipped ?? 0) > 0 && (
                    <span className="text-muted-foreground">
                      {t("Skipped (duplicate)", "跳过（重复）")}: {mepIssueStats.skipped}
                    </span>
                  )}
                </div>
                {mepClashReport.summary && (
                  <p className="text-muted-foreground">{bt(mepClashReport.summary)}</p>
                )}
                {mepClashReport.clashes && mepClashReport.clashes.length > 0 ? (
                  <div className="space-y-2">
                    {mepClashReport.clashes.map((clash) => (
                      <div key={clash.id} className="border rounded-md p-2 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{bt(clash.title)}</span>
                          <Badge variant="outline">{mepClashPriorityLabel(clash.priority)}</Badge>
                          <span className="text-muted-foreground">{clash.disciplines.join(" · ")}</span>
                        </div>
                        <p className="text-muted-foreground">{bt(clash.description)}</p>
                        <p className="text-muted-foreground">
                          {t("Location", "位置")}: {bt(clash.location)}
                        </p>
                        {clash.clearanceMm != null && clash.requiredClearanceMm != null && (
                          <p className="text-muted-foreground">
                            {t("Clearance", "净距")}: {clash.clearanceMm} mm / {t("required", "需求")}{" "}
                            {clash.requiredClearanceMm} mm
                          </p>
                        )}
                        <p className="text-muted-foreground">→ {bt(clash.remediation)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {t("No clashes detected with current inputs.", "当前参数未检测到冲突。")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {bimModels.filter((model) => model.format === "ifc" && model.status === "ready").length > 0 ? (
            <>
              <div className="rounded-md border p-3 space-y-2">
                <Label className="text-xs">{t("BIM model for IFC clash", "IFC 碰撞 BIM 模型")}</Label>
                <select
                  className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                  value={selectedBimModelId}
                  onChange={(e) => setSelectedBimModelId(e.target.value)}
                >
                  {bimModels
                    .filter((model) => model.format === "ifc" && model.status === "ready")
                    .map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                </select>
              </div>
              {selectedBimModel && (
                <MepIfcClashPanel
                  projectId={project.id}
                  model={selectedBimModel}
                  createIssues={mepInput.createIssues}
                />
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-4 text-xs text-muted-foreground">
                {t(
                  "Upload a ready IFC model in BIM / CAD Viewer to run geometry clash detection.",
                  "请在 BIM / CAD 查看器上传并就绪 IFC 模型后运行几何碰撞检测。"
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "energy" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {t("Energy & ROI Agent", "能效与 ROI Agent")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">{t("Annual energy (kWh)", "年能耗 (kWh)")}</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder={t("Optional — auto-estimate if empty", "选填 — 留空则自动估算")}
                    value={energyInput.annualEnergyKwh}
                    onChange={(e) => setEnergyInput((s) => ({ ...s, annualEnergyKwh: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("Window U-value", "窗传热系数")}</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder={t("e.g. 3.2", "如 3.2")}
                    value={energyInput.windowUValue}
                    onChange={(e) => setEnergyInput((s) => ({ ...s, windowUValue: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("HVAC age (years)", "暖通年限 (年)")}</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    value={energyInput.hvacAgeYears}
                    onChange={(e) => setEnergyInput((s) => ({ ...s, hvacAgeYears: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">{t("Electricity price (¥/kWh)", "电价 (¥/kWh)")}</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    value={energyInput.electricityPricePerKwh}
                    onChange={(e) =>
                      setEnergyInput((s) => ({ ...s, electricityPricePerKwh: e.target.value }))
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={energyInput.wallInsulated}
                  onChange={(e) => setEnergyInput((s) => ({ ...s, wallInsulated: e.target.checked }))}
                />
                {t("Exterior wall insulated", "外墙已保温")}
              </label>
              <Button variant="copper" size="sm" onClick={runEnergy} disabled={energyLoading}>
                {energyLoading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                {t("Run Energy Analysis", "运行能效分析")}
              </Button>
            </CardContent>
          </Card>

          {energyAnalysis?.simulation && (
            <Card>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">EUI {energyAnalysis.simulation.benchmarkComparison.currentEui} kWh/m²·a</Badge>
                  <Badge variant="outline">{energyRatingLabel(energyAnalysis.simulation.rating)}</Badge>
                  <Badge variant="outline">
                    {t("Benchmark gap", "基准差距")}{" "}
                    {energyAnalysis.simulation.benchmarkComparison.gapPercent > 0 ? "+" : ""}
                    {energyAnalysis.simulation.benchmarkComparison.gapPercent}%
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {t("Estimated annual energy", "年能耗约")}{" "}
                  {energyAnalysis.simulation.estimatedAnnualKwh.toLocaleString()} kWh
                </p>
                <div>
                  <p className="font-medium mb-1">{t("Energy breakdown", "能耗构成")}</p>
                  <ul className="text-muted-foreground space-y-1">
                    {energyAnalysis.simulation.breakdown.map((b) => (
                      <li key={b.system}>
                        • {t(b.system, b.systemZh)}：{b.kwh.toLocaleString()} kWh（{b.sharePercent}%）
                      </li>
                    ))}
                  </ul>
                </div>
                {energyAnalysis.findings && energyAnalysis.findings.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">{t("Findings", "发现")}</p>
                    <ul className="text-muted-foreground space-y-1">
                      {energyAnalysis.findings.map((f, i) => (
                        <li key={i}>• {bt(f)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {energyAnalysis.recommendations && energyAnalysis.recommendations.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">{t("Recommendations", "建议")}</p>
                    <ul className="text-muted-foreground space-y-1">
                      {energyAnalysis.recommendations.map((r, i) => (
                        <li key={i}>• {bt(r)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {energyAnalysis.recommendedBundle && energyAnalysis.recommendedBundle.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">{t("Green retrofit measures", "绿色改造策略")}</p>
                    <ul className="space-y-1">
                      {energyAnalysis.recommendedBundle.map((m) => (
                        <li key={m.name} className="text-muted-foreground">
                          • {t(m.name, m.nameZh)} — {t("savings", "节能")} {m.estimatedSavingsPercent}% · ¥
                          {m.estimatedCostPerSqm}/m²
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {energyAnalysis.roi && (
                  <div className="border rounded-md p-2 bg-muted/30">
                    <p className="font-medium mb-1">{t("ROI analysis", "ROI 测算")}</p>
                    <p className="text-muted-foreground">
                      {t("Investment", "投资")} ¥{energyAnalysis.roi.totalInvestment.toLocaleString()} ·{" "}
                      {t("Annual savings", "年节省")} ¥
                      {energyAnalysis.roi.annualCostSavings.toLocaleString()}
                    </p>
                    <p className="text-muted-foreground">
                      {t("Payback", "回收期")} {energyAnalysis.roi.simplePaybackYears}{" "}
                      {t("years", "年")} · 10 {t("year ROI", "年 ROI")}{" "}
                      {energyAnalysis.roi.roiPercent10Year}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "cost" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("Cost Estimator Agent", "成本估算 Agent")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {t(
                  "Estimates based on historical case library and project GFA.",
                  "基于历史案例库与项目建筑面积的造价估算。"
                )}
              </p>
              <Button variant="copper" size="sm" onClick={runCost} disabled={costLoading}>
                {costLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                {t("Estimate Renovation Cost", "估算改造成本")}
              </Button>
            </CardContent>
          </Card>
          {costEstimate && (
            <Card><CardContent className="p-4 space-y-2 text-xs">
              <p className="text-lg font-semibold tabular-nums">¥{costEstimate.estimatedTotalCost?.toLocaleString()}</p>
              <p className="text-muted-foreground">
                ~¥{costEstimate.estimatedCostPerSqm?.toLocaleString()}/m²
                {costEstimate.estimatedCostPerSqmMin != null && costEstimate.estimatedCostPerSqmMax != null && (
                  <> ({t("range", "区间")} ¥{costEstimate.estimatedCostPerSqmMin.toLocaleString()}–{costEstimate.estimatedCostPerSqmMax.toLocaleString()})</>
                )}
                {" "}· {costLevelLabel(costEstimate.costLevel ?? "")} · {t("confidence", "置信度")}{" "}
                {(costEstimate.confidence ?? 0) * 100}%
              </p>
              {costEstimate.provenance?.dataSourceNote && (
                <DataSourceNote
                  note={costEstimate.provenance.dataSourceNote}
                  className="text-[10px] text-muted-foreground"
                />
              )}
              {costEstimate.benchmark && (
                <p className="text-muted-foreground">
                  {t("Benchmark", "基准")}: {costEstimate.benchmark.region} (n={costEstimate.benchmark.sampleSize}, {costEstimate.benchmark.updatedAt})
                </p>
              )}
              {costEstimate.referenceCases && costEstimate.referenceCases.length > 0 && (
                <p className="text-muted-foreground">
                  {t("Reference", "参考案例")}: {costEstimate.referenceCases.map((c) => `${c.title}${c.outcome === "failure" ? " ⚠" : ""}`).join("; ")}
                </p>
              )}
              {costEstimate.wbsItems && costEstimate.wbsItems.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  <p className="font-medium text-foreground">{t("WBS cost breakdown", "WBS 分项估算")}</p>
                  {costEstimate.wbsItems.map((row) => (
                    <div key={row.code} className="flex justify-between gap-2 text-muted-foreground">
                      <span>{row.code} {t(row.name, row.nameZh)} ({row.sharePercent}%)</span>
                      <span className="tabular-nums shrink-0">¥{row.totalCost.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent></Card>
          )}
        </div>
      )}

      {activeTab === "heritage" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {t("Heritage Conservation Agent", "遗产保护 Agent")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {t(
                  "Assess authenticity, intervention scope, and approval pathway for historic buildings.",
                  "评估历史建筑原真性、干预范围与审批路径。"
                )}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={heritageInput.hasProtectedFacade}
                    onChange={(e) =>
                      setHeritageInput((s) => ({ ...s, hasProtectedFacade: e.target.checked }))
                    }
                  />
                  {t("Protected facade fabric", "保护立面本体")}
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={heritageInput.hasHistoricInterior}
                    onChange={(e) =>
                      setHeritageInput((s) => ({ ...s, hasHistoricInterior: e.target.checked }))
                    }
                  />
                  {t("Historic interior features", "历史室内要素")}
                </label>
              </div>
              <div>
                <Label className="text-xs">{t("Intervention scope", "干预范围")}</Label>
                <select
                  className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                  value={heritageInput.interventionScope}
                  onChange={(e) =>
                    setHeritageInput((s) => ({
                      ...s,
                      interventionScope: e.target.value as typeof s.interventionScope,
                    }))
                  }
                >
                  <option value="facade_only">{t("Facade only", "仅立面")}</option>
                  <option value="partial_interior">{t("Partial interior", "局部室内")}</option>
                  <option value="full_adaptive_reuse">
                    {t("Full adaptive reuse", "整体活化利用")}
                  </option>
                </select>
              </div>
              <Button variant="copper" size="sm" onClick={runHeritage} disabled={heritageLoading}>
                {heritageLoading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                {t("Run Heritage Assessment", "运行遗产评估")}
              </Button>
            </CardContent>
          </Card>

          {heritageAssessment && (
            <Card>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {t("Level", "等级")}: {heritageLevelLabel(heritageAssessment.heritageLevel ?? "")}
                  </Badge>
                  <Badge variant="outline">
                    {t("Risk", "风险")}: {riskLevelLabel(heritageAssessment.overallRisk ?? "")}
                  </Badge>
                </div>
                {heritageAssessment.authenticityScores && heritageAssessment.authenticityScores.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-medium">{t("Authenticity scores", "原真性评分")}</p>
                    {heritageAssessment.authenticityScores.map((row) => (
                      <div key={row.factor} className="space-y-0.5">
                        <div className="flex justify-between gap-2 text-muted-foreground">
                          <span>{t(row.labelEn, row.labelZh)}</span>
                          <span className="tabular-nums shrink-0">{row.score}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/80">
                          {t(row.noteEn, row.noteZh)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {heritageAssessment.reversibleInterventions && (
                  <div>
                    <p className="font-medium mb-1">{t("Reversible interventions", "可逆干预建议")}</p>
                    <ul className="text-muted-foreground space-y-1">
                      {heritageAssessment.reversibleInterventions.map((item, i) => (
                        <li key={i}>• {bt(item)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {heritageAssessment.prohibitedActions && (
                  <div>
                    <p className="font-medium mb-1 text-destructive">{t("Prohibited actions", "禁止行为")}</p>
                    <ul className="text-muted-foreground space-y-1">
                      {heritageAssessment.prohibitedActions.map((item, i) => (
                        <li key={i}>• {bt(item)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {heritageAssessment.recommendations && (
                  <div>
                    <p className="font-medium mb-1">{t("Recommendations", "建议")}</p>
                    <ul className="text-muted-foreground space-y-1">
                      {heritageAssessment.recommendations.map((item, i) => (
                        <li key={i}>• {bt(item)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "elevator" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                {t("Elevator Feasibility Agent", "电梯可行性 Agent")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                {t(
                  "Deterministic rules first: find candidate shaft space from BIM, check dimensions, structure, and heritage constraints. AI design advice only when feasible.",
                  "护栏模式：先从 BIM 识别候选井道、校验尺寸/结构/文保约束，仅在可行时生成 AI 设计建议。"
                )}
              </p>
              <div>
                <Label className="text-xs">{t("Mock BIM scenario (no upload needed)", "Mock BIM 场景（无需上传）")}</Label>
                <select
                  className="mt-1 h-8 w-full rounded-md border bg-background px-2 text-xs"
                  value={elevatorMockScenario}
                  onChange={(e) =>
                    setElevatorMockScenario(e.target.value as ElevatorBimMockScenario)
                  }
                >
                  <option value="feasible">{t("Feasible — southeast storage", "可行 — 东南角储藏间")}</option>
                  <option value="heritage">{t("Heritage — same layout", "文保 — 同布局")}</option>
                  <option value="infeasible">{t("Infeasible — too small", "不可行 — 空间过小")}</option>
                  <option value="multi_candidate">{t("Multi-candidate ranking", "多候选排序")}</option>
                  <option value="empty">{t("Empty — no BIM", "空数据")}</option>
                </select>
              </div>
              <Button variant="copper" size="sm" onClick={runElevator} disabled={elevatorLoading}>
                {elevatorLoading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                {t("Run Elevator Feasibility", "运行电梯可行性判断")}
              </Button>
            </CardContent>
          </Card>
          {elevatorResult && <ElevatorFeasibilityPanel result={elevatorResult} />}
        </div>
      )}
    </div>
  );
}
