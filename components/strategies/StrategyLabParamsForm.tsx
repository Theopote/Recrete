"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { StrategyLabParams } from "@/types/ai";

interface StrategyLabParamsFormProps {
  onChange: (params: Partial<StrategyLabParams>) => void;
}

export function StrategyLabParamsForm({ onChange }: StrategyLabParamsFormProps) {
  const [params, setParams] = useState<Partial<StrategyLabParams>>({
    designAmbition: "balanced",
    preservationLevel: "medium",
    constructionIntensity: "medium",
    scheduleRequirement: "moderate",
    riskTolerance: "medium",
  });

  const update = (key: keyof StrategyLabParams, value: string) => {
    const next = { ...params, [key]: value };
    setParams(next);
    onChange(next);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 rounded-lg border bg-muted/30">
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
