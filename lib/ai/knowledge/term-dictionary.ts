/**
 * Bilingual architectural terminology dictionary (中英文建筑术语)
 */

export interface ArchitecturalTerm {
  id: string;
  en: string;
  zh: string;
  category: "structure" | "mep" | "fire" | "facade" | "survey" | "heritage" | "general";
  aliases?: string[];
}

export const architecturalTerms: ArchitecturalTerm[] = [
  { id: "frame", en: "Reinforced Concrete Frame", zh: "钢筋混凝土框架", category: "structure", aliases: ["RC frame", "框架结构"] },
  { id: "carbonation", en: "Concrete Carbonation", zh: "混凝土碳化", category: "structure", aliases: ["碳化深度"] },
  { id: "spalling", en: "Concrete Spalling", zh: "混凝土剥落", category: "structure", aliases: ["delamination", "剥落"] },
  { id: "rebar", en: "Reinforcing Bar / Rebar", zh: "钢筋", category: "structure", aliases: ["reinforcement", "露筋"] },
  { id: "crack", en: "Structural Crack", zh: "结构裂缝", category: "structure", aliases: ["开裂", "裂缝"] },
  { id: "settlement", en: "Foundation Settlement", zh: "地基沉降", category: "structure" },
  { id: "live_load", en: "Live Load", zh: "活荷载", category: "structure", aliases: ["楼面活荷载"] },
  { id: "fire_compartment", en: "Fire Compartment", zh: "防火分区", category: "fire" },
  { id: "egress", en: "Means of Egress", zh: "安全疏散", category: "fire", aliases: ["疏散"] },
  { id: "sprinkler", en: "Sprinkler System", zh: "喷淋系统", category: "fire", aliases: ["自动喷水灭火系统"] },
  { id: "u_value", en: "Thermal Transmittance (U-value)", zh: "传热系数", category: "general", aliases: ["U值"] },
  { id: "facade", en: "Building Facade / Envelope", zh: "建筑外立面", category: "facade", aliases: ["curtain wall", "幕墙"] },
  { id: "waterproofing", en: "Waterproofing", zh: "防水", category: "facade", aliases: ["渗漏", "leakage"] },
  { id: "mep", en: "Mechanical, Electrical & Plumbing", zh: "机电设备", category: "mep", aliases: ["MEP"] },
  { id: "riser", en: "Vertical Riser / Shaft", zh: "竖井", category: "mep", aliases: ["管井"] },
  { id: "floor_plan", en: "Floor Plan", zh: "平面图", category: "survey" },
  { id: "elevation", en: "Elevation Drawing", zh: "立面图", category: "survey" },
  { id: "section", en: "Section Drawing", zh: "剖面图", category: "survey" },
  { id: "as_built", en: "As-Built Drawing", zh: "竣工图", category: "survey", aliases: ["existing drawings"] },
  { id: "heritage", en: "Historic Building Conservation", zh: "历史建筑保护", category: "heritage", aliases: ["文物保护"] },
  { id: "adaptive_reuse", en: "Adaptive Reuse", zh: "适应性再利用", category: "heritage" },
  { id: "inspection", en: "Condition Inspection Report", zh: "检测报告", category: "survey", aliases: ["assessment report", "评估报告"] },
  { id: "corrosion", en: "Corrosion / Rust", zh: "锈蚀", category: "structure", aliases: ["rust"] },
  { id: "efflorescence", en: "Efflorescence", zh: "泛碱", category: "facade" },
  { id: "bearing_capacity", en: "Bearing Capacity", zh: "承载力", category: "structure" },
];

export function searchTerms(keyword: string): ArchitecturalTerm[] {
  const q = keyword.toLowerCase().trim();
  if (!q) return [];

  return architecturalTerms.filter(
    (term) =>
      term.en.toLowerCase().includes(q) ||
      term.zh.includes(keyword) ||
      term.aliases?.some((a) => a.toLowerCase().includes(q) || a.includes(keyword))
  );
}

export function translateTerm(term: string, targetLang: "zh" | "en"): string | null {
  const lower = term.toLowerCase().trim();
  for (const entry of architecturalTerms) {
    if (
      entry.en.toLowerCase() === lower ||
      entry.zh === term ||
      entry.aliases?.some((a) => a.toLowerCase() === lower || a === term)
    ) {
      return targetLang === "zh" ? entry.zh : entry.en;
    }
  }
  return null;
}

/**
 * Normalize bilingual text by appending standard translations for known terms.
 */
export function normalizeBilingualText(text: string): string {
  let result = text;
  for (const term of architecturalTerms) {
    const hasEn = result.toLowerCase().includes(term.en.toLowerCase());
    const hasZh = result.includes(term.zh);
    if (hasEn && !hasZh) {
      result = result.replace(new RegExp(term.en, "gi"), `${term.en} (${term.zh})`);
    } else if (hasZh && !hasEn) {
      result = result.replace(term.zh, `${term.zh} (${term.en})`);
    }
  }
  return result;
}
