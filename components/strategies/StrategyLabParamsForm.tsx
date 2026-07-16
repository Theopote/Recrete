"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useLocale } from "@/lib/i18n/use-locale";
import type { StrategyLabParams } from "@/types/ai";

interface StrategyLabParamsFormProps {
  onChange: (params: Partial<StrategyLabParams>) => void;
  projectArea?: number;
  projectBudget?: string;
  targetFunction?: string;
}

export function StrategyLabParamsForm({
  onChange,
  projectArea,
  projectBudget,
  targetFunction,
}: StrategyLabParamsFormProps) {
  const { t } = useLocale();
  const [params, setParams] = useState<Partial<StrategyLabParams>>({
    designAmbition: "balanced",
    preservationLevel: "medium",
    constructionIntensity: "medium",
    scheduleRequirement: "moderate",
    riskTolerance: "medium",
    grossFloorArea: projectArea,
    budgetLevel: projectBudget,
    targetFunction,
  });

  const update = (key: keyof StrategyLabParams, value: string | number) => {
    const next = { ...params, [key]: value };
    setParams(next);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg border bg-muted/30">
        <Field label={t("Target function", "目标功能")}>
          <input
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            value={params.targetFunction ?? targetFunction ?? ""}
            onChange={(e) => update("targetFunction", e.target.value)}
            placeholder={t("e.g. Community cultural center", "例如：社区文化中心")}
          />
        </Field>
        <Field label={t("Area (m²)", "总面积 (m²)")}>
          <input
            type="number"
            min={1}
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            value={params.grossFloorArea ?? projectArea ?? ""}
            onChange={(e) => update("grossFloorArea", Number(e.target.value))}
          />
        </Field>
        <Field label={t("Budget", "预算")}>
          <Select
            className="h-8 text-xs"
            value={params.budgetLevel ?? projectBudget ?? "medium"}
            onChange={(e) => update("budgetLevel", e.target.value)}
          >
            <option value="low">{t("Low", "有限")}</option>
            <option value="medium">{t("Medium", "中等")}</option>
            <option value="high">{t("High", "较高")}</option>
            <option value="premium">{t("Premium", "充裕")}</option>
          </Select>
        </Field>
        <Field label={t("Design ambition", "设计野心")}>
          <Select
            className="h-8 text-xs"
            value={params.designAmbition}
            onChange={(e) => update("designAmbition", e.target.value)}
          >
            <option value="conservative">{t("Conservative", "保守")}</option>
            <option value="balanced">{t("Balanced", "均衡")}</option>
            <option value="ambitious">{t("Ambitious", "进取")}</option>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-3 pb-3">
        <Field label={t("Preservation", "保护程度")}>
          <Select
            className="h-8 text-xs"
            value={params.preservationLevel}
            onChange={(e) => update("preservationLevel", e.target.value)}
          >
            <option value="low">{t("Low", "低")}</option>
            <option value="medium">{t("Medium", "中")}</option>
            <option value="high">{t("High", "高")}</option>
          </Select>
        </Field>
        <Field label={t("Construction", "施工强度")}>
          <Select
            className="h-8 text-xs"
            value={params.constructionIntensity}
            onChange={(e) => update("constructionIntensity", e.target.value)}
          >
            <option value="low">{t("Low", "低")}</option>
            <option value="medium">{t("Medium", "中")}</option>
            <option value="high">{t("High", "高")}</option>
          </Select>
        </Field>
        <Field label={t("Schedule", "工期要求")}>
          <Select
            className="h-8 text-xs"
            value={params.scheduleRequirement}
            onChange={(e) => update("scheduleRequirement", e.target.value)}
          >
            <option value="flexible">{t("Flexible", "灵活")}</option>
            <option value="moderate">{t("Moderate", "适中")}</option>
            <option value="urgent">{t("Urgent", "紧急")}</option>
          </Select>
        </Field>
        <Field label={t("Risk tolerance", "风险承受")}>
          <Select
            className="h-8 text-xs"
            value={params.riskTolerance}
            onChange={(e) => update("riskTolerance", e.target.value)}
          >
            <option value="low">{t("Low", "低")}</option>
            <option value="medium">{t("Medium", "中")}</option>
            <option value="high">{t("High", "高")}</option>
          </Select>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
