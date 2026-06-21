"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
        <Field label="目标功能 · Target function">
          <input
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            value={params.targetFunction ?? targetFunction ?? ""}
            onChange={(e) => update("targetFunction", e.target.value)}
            placeholder="e.g. 社区文化中心"
          />
        </Field>
        <Field label="总面积 · Area (m²)">
          <input
            type="number"
            min={1}
            className="h-8 w-full rounded-md border bg-background px-2 text-xs"
            value={params.grossFloorArea ?? projectArea ?? ""}
            onChange={(e) => update("grossFloorArea", Number(e.target.value))}
          />
        </Field>
        <Field label="预算 · Budget">
          <Select
            className="h-8 text-xs"
            value={params.budgetLevel ?? projectBudget ?? "medium"}
            onChange={(e) => update("budgetLevel", e.target.value)}
          >
            <option value="low">Low · 有限</option>
            <option value="medium">Medium · 中等</option>
            <option value="high">High · 较高</option>
            <option value="premium">Premium · 充裕</option>
          </Select>
        </Field>
        <Field label="Design ambition">
          <Select
            className="h-8 text-xs"
            value={params.designAmbition}
            onChange={(e) => update("designAmbition", e.target.value)}
          >
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
            <option value="ambitious">Ambitious</option>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-3 pb-3">
        <Field label="Preservation">
          <Select
            className="h-8 text-xs"
            value={params.preservationLevel}
            onChange={(e) => update("preservationLevel", e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </Field>
        <Field label="Construction">
          <Select
            className="h-8 text-xs"
            value={params.constructionIntensity}
            onChange={(e) => update("constructionIntensity", e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </Field>
        <Field label="Schedule">
          <Select
            className="h-8 text-xs"
            value={params.scheduleRequirement}
            onChange={(e) => update("scheduleRequirement", e.target.value)}
          >
            <option value="flexible">Flexible</option>
            <option value="moderate">Moderate</option>
            <option value="urgent">Urgent</option>
          </Select>
        </Field>
        <Field label="Risk tolerance">
          <Select
            className="h-8 text-xs"
            value={params.riskTolerance}
            onChange={(e) => update("riskTolerance", e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
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
