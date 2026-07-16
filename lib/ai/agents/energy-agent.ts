import type { DiagnosisItem, ProjectWithRelations } from "@/types";
import { bi, type BilingualString } from "@/lib/i18n/bilingual";

export interface EnergyAnalysisInput {
  annualEnergyKwh?: number;
  windowUValue?: number;
  wallInsulated?: boolean;
  hvacSystemType?: "central" | "split" | "vrf" | "unknown";
  hvacAgeYears?: number;
  electricityPricePerKwh?: number;
}

export interface EnergySimulationResult {
  baselineEui: number;
  estimatedAnnualKwh: number;
  breakdown: Array<{ system: string; systemZh: string; kwh: number; sharePercent: number }>;
  benchmarkComparison: {
    label: string;
    currentEui: number;
    targetEui: number;
    gapPercent: number;
  };
  rating: "poor" | "average" | "good";
}

export interface GreenRetrofitMeasure {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  estimatedSavingsPercent: number;
  estimatedCostPerSqm: number;
  priority: "high" | "medium" | "low";
  category: "envelope" | "hvac" | "lighting" | "renewables";
}

export interface EnergyRoiResult {
  totalInvestment: number;
  annualEnergySavingsKwh: number;
  annualCostSavings: number;
  simplePaybackYears: number;
  roiPercent10Year: number;
  measures: Array<{
    measureId: string;
    name: string;
    nameZh: string;
    investment: number;
    annualSavings: number;
    paybackYears: number;
  }>;
  assumptions: string[];
}

export interface EnergyAnalysisResult {
  simulation: EnergySimulationResult;
  retrofitMeasures: GreenRetrofitMeasure[];
  recommendedBundle: GreenRetrofitMeasure[];
  roi: EnergyRoiResult;
  findings: BilingualString[];
  recommendations: BilingualString[];
}

function baselineEuiForProject(project: ProjectWithRelations): number {
  const buildingAge = new Date().getFullYear() - project.constructionYear;
  const type = project.buildingType.toLowerCase();
  const fn = project.currentFunction.toLowerCase();

  let base = 110;
  if (type.includes("residential") || fn.includes("住宅") || fn.includes("residential")) {
    base = 75;
  } else if (type.includes("industrial") || fn.includes("工业")) {
    base = 95;
  } else if (fn.includes("文化") || fn.includes("cultural") || fn.includes("public")) {
    base = 125;
  }

  const ageFactor = buildingAge > 30 ? 1.25 : buildingAge > 20 ? 1.15 : buildingAge > 10 ? 1.05 : 1;
  return Math.round(base * ageFactor);
}

function targetEuiForClimate(location: string): number {
  const cold = ["北京", "beijing", "西安", "xi'an", "哈尔滨", "harbin"];
  const hot = ["广州", "guangzhou", "深圳", "shenzhen", "海口", "haikou"];
  const loc = location.toLowerCase();
  if (cold.some((c) => loc.includes(c.toLowerCase()))) return 65;
  if (hot.some((c) => loc.includes(c.toLowerCase()))) return 70;
  return 68;
}

const RETROFIT_CATALOG: GreenRetrofitMeasure[] = [
  {
    id: "window_upgrade",
    name: "High-performance window replacement",
    nameZh: "高性能门窗更换",
    description: "Replace single-glazed units with double or triple glazing to reduce envelope losses.",
    estimatedSavingsPercent: 12,
    estimatedCostPerSqm: 280,
    priority: "high",
    category: "envelope",
  },
  {
    id: "wall_insulation",
    name: "Exterior wall insulation (ETICS)",
    nameZh: "外墙外保温系统",
    description: "Add continuous insulation layer to reduce heating and cooling loads.",
    estimatedSavingsPercent: 18,
    estimatedCostPerSqm: 320,
    priority: "high",
    category: "envelope",
  },
  {
    id: "hvac_vrf",
    name: "VRF / high-efficiency HVAC replacement",
    nameZh: "VRF 高效暖通改造",
    description: "Replace aging central or split systems with variable refrigerant flow equipment.",
    estimatedSavingsPercent: 22,
    estimatedCostPerSqm: 450,
    priority: "high",
    category: "hvac",
  },
  {
    id: "led_lighting",
    name: "LED lighting with occupancy controls",
    nameZh: "LED 照明与感应控制",
    description: "Upgrade luminaires and add daylight/occupancy sensors in circulation and office zones.",
    estimatedSavingsPercent: 8,
    estimatedCostPerSqm: 85,
    priority: "medium",
    category: "lighting",
  },
  {
    id: "roof_pv",
    name: "Rooftop photovoltaic array",
    nameZh: "屋顶光伏发电",
    description: "Install PV to offset grid electricity; size based on available roof area.",
    estimatedSavingsPercent: 10,
    estimatedCostPerSqm: 220,
    priority: "medium",
    category: "renewables",
  },
];

export class EnergyAgent {
  simulateBuildingEnergy(
    project: ProjectWithRelations,
    input: EnergyAnalysisInput = {}
  ): EnergySimulationResult {
    const gfa = project.grossFloorArea;
    const baselineEui = baselineEuiForProject(project);
    const estimatedAnnualKwh = input.annualEnergyKwh ?? Math.round(baselineEui * gfa);

    let envelopeShare = 0.28;
    let hvacShare = 0.45;
    let lightingShare = 0.18;
    const plugShare = 0.09;

    if (input.windowUValue !== undefined && input.windowUValue > 3.0) {
      envelopeShare += 0.08;
      hvacShare += 0.05;
    }
    if (input.wallInsulated === false) {
      envelopeShare += 0.06;
      hvacShare += 0.04;
    }
    if (input.hvacAgeYears !== undefined && input.hvacAgeYears > 15) {
      hvacShare += 0.1;
      envelopeShare -= 0.05;
    }

    const breakdown = [
      { system: "HVAC", systemZh: "暖通空调", kwh: Math.round(estimatedAnnualKwh * hvacShare), sharePercent: Math.round(hvacShare * 100) },
      { system: "Envelope", systemZh: "围护结构", kwh: Math.round(estimatedAnnualKwh * envelopeShare), sharePercent: Math.round(envelopeShare * 100) },
      { system: "Lighting", systemZh: "照明", kwh: Math.round(estimatedAnnualKwh * lightingShare), sharePercent: Math.round(lightingShare * 100) },
      { system: "Plug loads", systemZh: "设备用电", kwh: Math.round(estimatedAnnualKwh * plugShare), sharePercent: Math.round(plugShare * 100) },
    ];

    const currentEui = estimatedAnnualKwh / gfa;
    const targetEui = targetEuiForClimate(project.location);
    const gapPercent = Math.round(((currentEui - targetEui) / targetEui) * 100);

    let rating: EnergySimulationResult["rating"] = "average";
    if (currentEui > targetEui * 1.25) rating = "poor";
    else if (currentEui <= targetEui * 1.05) rating = "good";

    return {
      baselineEui,
      estimatedAnnualKwh,
      breakdown,
      benchmarkComparison: {
        label: "Local climate benchmark (GB 50189 reference)",
        currentEui: Math.round(currentEui * 10) / 10,
        targetEui,
        gapPercent,
      },
      rating,
    };
  }

  generateGreenRetrofitMeasures(
    project: ProjectWithRelations,
    simulation: EnergySimulationResult,
    input: EnergyAnalysisInput = {}
  ): GreenRetrofitMeasure[] {
    const measures: GreenRetrofitMeasure[] = [];

    if (simulation.rating !== "good" || (input.windowUValue !== undefined && input.windowUValue > 2.8)) {
      measures.push(RETROFIT_CATALOG.find((m) => m.id === "window_upgrade")!);
    }
    if (input.wallInsulated === false || simulation.benchmarkComparison.gapPercent > 20) {
      measures.push(RETROFIT_CATALOG.find((m) => m.id === "wall_insulation")!);
    }
    const hvacAge = input.hvacAgeYears ?? new Date().getFullYear() - project.constructionYear - 5;
    if (hvacAge > 12 || input.hvacSystemType === "central") {
      measures.push(RETROFIT_CATALOG.find((m) => m.id === "hvac_vrf")!);
    }
    measures.push(RETROFIT_CATALOG.find((m) => m.id === "led_lighting")!);
    if (project.grossFloorArea > 3000 && project.floorCount >= 3) {
      measures.push(RETROFIT_CATALOG.find((m) => m.id === "roof_pv")!);
    }

    const seen = new Set<string>();
    return measures.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }

  calculateEnergyRoi(
    project: ProjectWithRelations,
    simulation: EnergySimulationResult,
    measures: GreenRetrofitMeasure[],
    input: EnergyAnalysisInput = {}
  ): EnergyRoiResult {
    const gfa = project.grossFloorArea;
    const price = input.electricityPricePerKwh ?? 0.85;
    const baselineKwh = simulation.estimatedAnnualKwh;

    const measureResults = measures.map((measure) => {
      const investment = Math.round(measure.estimatedCostPerSqm * gfa);
      const annualSavings = Math.round(baselineKwh * (measure.estimatedSavingsPercent / 100) * price);
      const paybackYears =
        annualSavings > 0 ? Math.round((investment / annualSavings) * 10) / 10 : 99;
      return {
        measureId: measure.id,
        name: measure.name,
        nameZh: measure.nameZh,
        investment,
        annualSavings,
        paybackYears,
      };
    });

    const totalInvestment = measureResults.reduce((s, m) => s + m.investment, 0);
    const annualEnergySavingsKwh = measures.reduce(
      (s, m, i) => s + Math.round(baselineKwh * (m.estimatedSavingsPercent / 100)),
      0
    );
    const annualCostSavings = Math.round(annualEnergySavingsKwh * price);
    const simplePaybackYears =
      annualCostSavings > 0
        ? Math.round((totalInvestment / annualCostSavings) * 10) / 10
        : 99;
    const roiPercent10Year =
      totalInvestment > 0
        ? Math.round(((annualCostSavings * 10 - totalInvestment) / totalInvestment) * 100)
        : 0;

    return {
      totalInvestment,
      annualEnergySavingsKwh,
      annualCostSavings,
      simplePaybackYears,
      roiPercent10Year,
      measures: measureResults,
      assumptions: [
        `Electricity price ¥${price}/kWh (commercial average)`,
        `GFA ${gfa.toLocaleString()} m²`,
        "Savings modeled as non-overlapping upper-bound estimates; detailed engineering required",
        `Baseline annual consumption ${baselineKwh.toLocaleString()} kWh`,
      ],
    };
  }

  analyzeEnergyPerformance(
    project: ProjectWithRelations,
    input: EnergyAnalysisInput = {}
  ): EnergyAnalysisResult {
    const simulation = this.simulateBuildingEnergy(project, input);
    const retrofitMeasures = this.generateGreenRetrofitMeasures(project, simulation, input);
    const recommendedBundle = retrofitMeasures.filter((m) => m.priority === "high").slice(0, 3);
    if (recommendedBundle.length === 0) {
      recommendedBundle.push(...retrofitMeasures.slice(0, 2));
    }
    const roi = this.calculateEnergyRoi(
      project,
      simulation,
      recommendedBundle.length > 0 ? recommendedBundle : retrofitMeasures.slice(0, 2),
      input
    );

    const findings: BilingualString[] = [
      bi(
        `Estimated EUI ${simulation.benchmarkComparison.currentEui} kWh/m²·a (${simulation.rating})`,
        `估算 EUI ${simulation.benchmarkComparison.currentEui} kWh/m²·a（${simulation.rating}）`
      ),
      bi(
        `Annual consumption ~${simulation.estimatedAnnualKwh.toLocaleString()} kWh`,
        `年能耗约 ${simulation.estimatedAnnualKwh.toLocaleString()} kWh`
      ),
      bi(
        `Gap vs climate benchmark: ${simulation.benchmarkComparison.gapPercent > 0 ? "+" : ""}${simulation.benchmarkComparison.gapPercent}%`,
        `与气候区基准差距：${simulation.benchmarkComparison.gapPercent > 0 ? "+" : ""}${simulation.benchmarkComparison.gapPercent}%`
      ),
    ];

    if (simulation.rating === "poor") {
      findings.push(
        bi(
          "Building performs significantly below current energy code expectations.",
          "建筑能效明显低于现行节能规范要求。"
        )
      );
    }

    const recommendations: BilingualString[] = [
      ...recommendedBundle.map((m) =>
        bi(
          `Prioritize ${m.name} — est. ${m.estimatedSavingsPercent}% energy reduction`,
          `优先实施 ${m.nameZh} — 预计节能 ${m.estimatedSavingsPercent}%`
        )
      ),
      bi(
        `Bundle payback ~${roi.simplePaybackYears} years; 10-year ROI ${roi.roiPercent10Year}%`,
        `组合方案回收期约 ${roi.simplePaybackYears} 年；10 年 ROI ${roi.roiPercent10Year}%`
      ),
      bi(
        "Commission formal energy audit and dynamic simulation (e.g. EnergyPlus) before design decisions.",
        "方案决策前建议委托正式能耗审计与动态模拟（如 EnergyPlus）。"
      ),
    ];

    return {
      simulation,
      retrofitMeasures,
      recommendedBundle,
      roi,
      findings,
      recommendations,
    };
  }

  generateEnergyDiagnosis(
    project: ProjectWithRelations,
    input: EnergyAnalysisInput = {}
  ): Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[] {
    const analysis = this.analyzeEnergyPerformance(project, input);
    const buildingAge = new Date().getFullYear() - project.constructionYear;

    const items: Omit<DiagnosisItem, "id" | "projectId" | "createdAt" | "updatedAt">[] = [
      {
        title: "Building energy performance baseline assessment",
        category: "energy",
        severity: analysis.simulation.rating === "poor" ? "high" : "medium",
        status: "identified",
        description: `Estimated EUI ${analysis.simulation.benchmarkComparison.currentEui} kWh/m²·a vs target ${analysis.simulation.benchmarkComparison.targetEui}. Annual ~${analysis.simulation.estimatedAnnualKwh.toLocaleString()} kWh.`,
        evidence: `Building age ${buildingAge} years; climate benchmark for ${project.location}`,
        recommendation:
          analysis.recommendations[0]?.en ??
          "Run energy expert agent with meter data for refined simulation.",
        relatedLocation: "Whole building",
      },
    ];

    if (analysis.simulation.rating === "poor") {
      items.push({
        title: "Green retrofit bundle recommended",
        category: "energy",
        severity: "medium",
        status: "identified",
        description: `${analysis.recommendedBundle.length} high-priority measures identified. Simple payback ~${analysis.roi.simplePaybackYears} years.`,
        evidence: analysis.recommendedBundle.map((m) => m.nameZh).join("; "),
        recommendation: `Invest ~¥${analysis.roi.totalInvestment.toLocaleString()} for ¥${analysis.roi.annualCostSavings.toLocaleString()}/year savings.`,
        relatedLocation: "Envelope, MEP plant, roof",
      });
    }

    if (input.windowUValue !== undefined && input.windowUValue > 2.8) {
      items.push({
        title: "Window thermal performance below code",
        category: "energy",
        severity: "medium",
        status: "identified",
        description: `Window U-value ${input.windowUValue} W/(m²·K) exceeds typical retrofit target ≤ 2.5.`,
        evidence: "GB 50189 envelope requirements",
        recommendation: "Replace with double or triple glazing as part of envelope-first strategy.",
        relatedLocation: "Building facade",
      });
    }

    return items;
  }
}

export const energyAgent = new EnergyAgent();

export function analyzeEnergyPerformance(
  project: ProjectWithRelations,
  input?: EnergyAnalysisInput
) {
  return energyAgent.analyzeEnergyPerformance(project, input);
}

export function simulateBuildingEnergy(
  project: ProjectWithRelations,
  input?: EnergyAnalysisInput
) {
  return energyAgent.simulateBuildingEnergy(project, input);
}

export function generateEnergyDiagnosis(
  project: ProjectWithRelations,
  input?: EnergyAnalysisInput
) {
  return energyAgent.generateEnergyDiagnosis(project, input);
}

/** Markdown section for diagnosis / condition reports and PDF export */
export function formatEnergyAnalysisMarkdown(analysis: EnergyAnalysisResult): string {
  const { simulation, recommendedBundle, roi } = analysis;
  const bench = simulation.benchmarkComparison;

  const breakdownRows = simulation.breakdown
    .map(
      (b) =>
        `| ${b.systemZh} (${b.system}) | ${b.kwh.toLocaleString()} kWh | ${b.sharePercent}% |`
    )
    .join("\n");

  const measureRows = recommendedBundle
    .map(
      (m) =>
        `| ${m.nameZh} | ${m.estimatedSavingsPercent}% | ¥${m.estimatedCostPerSqm.toLocaleString()}/m² | ${m.priority} |`
    )
    .join("\n");

  const roiMeasureRows = roi.measures
    .map(
      (m) =>
        `| ${m.nameZh} | ¥${m.investment.toLocaleString()} | ¥${m.annualSavings.toLocaleString()}/年 | ${m.paybackYears} 年 |`
    )
    .join("\n");

  return `## Energy Performance Analysis · 能效分析

### Baseline Simulation · 能耗基准

| Metric | Value |
|--------|-------|
| Estimated annual consumption | ${simulation.estimatedAnnualKwh.toLocaleString()} kWh |
| EUI (current) | ${bench.currentEui} kWh/m²·a |
| EUI (climate benchmark) | ${bench.targetEui} kWh/m²·a |
| Gap vs benchmark | ${bench.gapPercent > 0 ? "+" : ""}${bench.gapPercent}% |
| Performance rating | ${simulation.rating} |

### Consumption Breakdown · 分项能耗

| System | Annual (kWh) | Share |
|--------|--------------|-------|
${breakdownRows}

### Green Retrofit Strategy · 绿色改造策略

| Measure | Est. savings | Unit cost | Priority |
|---------|--------------|-----------|----------|
${measureRows || "| — | — | — | — |"}

### ROI Analysis · 投资回报

| Item | Value |
|------|-------|
| Total investment (recommended bundle) | ¥${roi.totalInvestment.toLocaleString()} |
| Annual energy savings | ${roi.annualEnergySavingsKwh.toLocaleString()} kWh |
| Annual cost savings | ¥${roi.annualCostSavings.toLocaleString()} |
| Simple payback period | ${roi.simplePaybackYears} years |
| 10-year ROI | ${roi.roiPercent10Year}% |

#### Measure-level ROI · 措施级 ROI

| Measure | Investment | Annual savings | Payback |
|---------|------------|----------------|---------|
${roiMeasureRows || "| — | — | — | — |"}

**Assumptions:** ${roi.assumptions.join(" · ")}

**Recommendations:**
${analysis.recommendations.map((r) => `- ${r}`).join("\n")}`;
}

export function appendEnergySectionToReport(
  content: string,
  analysis: EnergyAnalysisResult
): string {
  const section = formatEnergyAnalysisMarkdown(analysis);
  const footer = `\n---\n*Generated by Recrete AI`;
  if (content.includes(footer)) {
    return content.replace(footer, `\n\n${section}${footer}`);
  }
  return `${content}\n\n${section}`;
}
