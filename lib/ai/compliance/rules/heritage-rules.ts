import type { ComplianceRuleDefinition } from "../types";
import { hasHeritageConstraints } from "../scenario-resolver";

export const heritageRules: ComplianceRuleDefinition[] = [
  {
    id: "heritage-approval",
    codeId: "prc_heritage_law",
    codeRef: "文物保护法 2024",
    section: "Art. 21",
    category: "heritage",
    requirement: "Heritage renovation approval",
    requirementZh: "文物修缮审批",
    priority: "critical",
    scenarios: ["heritage_renovation", "historic_building"],
    applies: (ctx) => hasHeritageConstraints(ctx.project),
    evaluate: (ctx) => {
      const level = ctx.project.building?.heritageLevel ?? "none";
      return {
        status: "requires_verification",
        requiredValue: "Approval from cultural relics authority",
        note: `Heritage level "${level}" — renovation plan must be submitted for approval`,
        noteZh: `保护等级「${level}」— 修缮方案须报文物主管部门审批`,
        remediation: "Prepare heritage impact assessment and engage qualified heritage design team",
      };
    },
  },
  {
    id: "heritage-minimum-intervention",
    codeId: "gb50458",
    codeRef: "GB 50458-2017",
    section: "3.1.1",
    category: "heritage",
    requirement: "Minimum intervention principle",
    requirementZh: "最小干预原则",
    priority: "high",
    scenarios: ["heritage_renovation", "historic_building", "adaptive_reuse"],
    applies: (ctx) => hasHeritageConstraints(ctx.project),
    evaluate: () => ({
      status: "requires_verification",
      requiredValue: "Repair over replacement; preserve authentic fabric",
      note: "Heritage projects must document existing conditions before intervention",
      noteZh: "历史建筑修缮应优先修缮、保留原有构件与材料",
      remediation: "Document as-built conditions and prefer reversible interventions",
    }),
  },
  {
    id: "heritage-prohibited-alterations",
    codeId: "prc_heritage_law",
    codeRef: "文物保护法 2024",
    section: "Art. 30",
    category: "heritage",
    requirement: "Prohibited alterations to protected fabric",
    requirementZh: "禁止擅自改动保护要素",
    priority: "critical",
    scenarios: ["heritage_renovation", "historic_building"],
    applies: (ctx) => hasHeritageConstraints(ctx.project),
    evaluate: () => ({
      status: "requires_verification",
      requiredValue: "No unauthorized demolition or major alteration",
      note: "Verify scope does not affect protected heritage fabric or streetscape",
      noteZh: "核实改造范围不涉及擅自拆除或破坏历史风貌",
      remediation: "Obtain heritage authority clearance for any facade or structural changes",
    }),
  },
];
