"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/use-locale";
import type { ComplianceMeasurements } from "@/lib/ai/compliance/types";
import { mergeMeasurements, MEASUREMENT_FIELD_LABELS } from "@/lib/ai/compliance/measurements";
import type { ProjectSiteMeasurementsResponse } from "@/types/site-measurements";
import type { DrawingMeasurementProvenance } from "@/types/drawing-measurements";
import { ClipboardList, History, Loader2, Save, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteMeasurementsFormProps {
  projectId: string;
}

type FormState = {
  ceilingHeight: string;
  stairWidth: string;
  fireCompartmentArea: string;
  hasAccessibleEntrance: boolean;
  windowUValue: string;
  carbonationDepth: string;
  coverThickness: string;
  existingLoadKN: string;
  targetLoadKN: string;
  travelDistance: string;
  hasSprinkler: boolean;
  notes: string;
};

const EMPTY_FORM: FormState = {
  ceilingHeight: "",
  stairWidth: "",
  fireCompartmentArea: "",
  hasAccessibleEntrance: false,
  windowUValue: "",
  carbonationDepth: "",
  coverThickness: "",
  existingLoadKN: "",
  targetLoadKN: "",
  travelDistance: "",
  hasSprinkler: false,
  notes: "",
};

function measurementsToForm(measurements: ComplianceMeasurements, notes?: string | null): FormState {
  return {
    ceilingHeight: measurements.ceilingHeight?.toString() ?? "",
    stairWidth: measurements.stairWidth?.toString() ?? "",
    fireCompartmentArea: measurements.fireCompartmentArea?.toString() ?? "",
    hasAccessibleEntrance: measurements.hasAccessibleEntrance ?? false,
    windowUValue: measurements.windowUValue?.toString() ?? "",
    carbonationDepth: measurements.carbonationDepth?.toString() ?? "",
    coverThickness: measurements.coverThickness?.toString() ?? "",
    existingLoadKN: measurements.existingLoadKN?.toString() ?? "",
    targetLoadKN: measurements.targetLoadKN?.toString() ?? "",
    travelDistance: measurements.travelDistance?.toString() ?? "",
    hasSprinkler: measurements.hasSprinkler ?? false,
    notes: notes ?? "",
  };
}

function formToPayload(form: FormState): Record<string, unknown> {
  return {
    ceilingHeight: form.ceilingHeight || null,
    stairWidth: form.stairWidth || null,
    fireCompartmentArea: form.fireCompartmentArea || null,
    hasAccessibleEntrance: form.hasAccessibleEntrance,
    windowUValue: form.windowUValue || null,
    carbonationDepth: form.carbonationDepth || null,
    coverThickness: form.coverThickness || null,
    existingLoadKN: form.existingLoadKN || null,
    targetLoadKN: form.targetLoadKN || null,
    travelDistance: form.travelDistance || null,
    hasSprinkler: form.hasSprinkler,
    notes: form.notes || null,
    replace: true,
  };
}

const FIELD_GROUPS: {
  id: string;
  titleEn: string;
  titleZh: string;
  fields: {
    key: keyof FormState;
    labelEn: string;
    labelZh: string;
    unit?: string;
    type?: "number" | "checkbox";
  }[];
}[] = [
  {
    id: "general",
    titleEn: "General",
    titleZh: "通用",
    fields: [
      { key: "ceilingHeight", labelEn: "Ceiling height", labelZh: "房间净高", unit: "m" },
    ],
  },
  {
    id: "fire",
    titleEn: "Fire & Egress",
    titleZh: "防火疏散",
    fields: [
      { key: "stairWidth", labelEn: "Stair clear width", labelZh: "疏散楼梯净宽", unit: "m" },
      {
        key: "fireCompartmentArea",
        labelEn: "Fire compartment area",
        labelZh: "防火分区面积",
        unit: "m²",
      },
      {
        key: "travelDistance",
        labelEn: "Max travel distance",
        labelZh: "疏散走道至出口距离",
        unit: "m",
      },
      { key: "hasSprinkler", labelEn: "Sprinkler system", labelZh: "设有喷淋系统", type: "checkbox" },
    ],
  },
  {
    id: "structure",
    titleEn: "Structure",
    titleZh: "结构",
    fields: [
      {
        key: "carbonationDepth",
        labelEn: "Carbonation depth",
        labelZh: "混凝土碳化深度",
        unit: "mm",
      },
      {
        key: "coverThickness",
        labelEn: "Cover thickness",
        labelZh: "保护层厚度",
        unit: "mm",
      },
      {
        key: "existingLoadKN",
        labelEn: "Existing live load",
        labelZh: "现有楼面活荷载",
        unit: "kN/m²",
      },
      {
        key: "targetLoadKN",
        labelEn: "Target live load",
        labelZh: "目标活荷载",
        unit: "kN/m²",
      },
    ],
  },
  {
    id: "accessibility",
    titleEn: "Accessibility",
    titleZh: "无障碍",
    fields: [
      {
        key: "hasAccessibleEntrance",
        labelEn: "Accessible entrance",
        labelZh: "设有无障碍入口",
        type: "checkbox",
      },
    ],
  },
  {
    id: "energy",
    titleEn: "Energy",
    titleZh: "节能",
    fields: [
      {
        key: "windowUValue",
        labelEn: "Window U-value",
        labelZh: "外窗传热系数",
        unit: "W/(m²·K)",
      },
    ],
  },
];

export function SiteMeasurementsForm({ projectId }: SiteMeasurementsFormProps) {
  const { t } = useLocale();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [completeness, setCompleteness] = useState({ filled: 0, total: 11, ratio: 0 });
  const [historyFallback, setHistoryFallback] = useState<ComplianceMeasurements>({});
  const [historyRunCreatedAt, setHistoryRunCreatedAt] = useState<Date | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [lastExtraction, setLastExtraction] = useState<DrawingMeasurementProvenance[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const historyFieldCount = useMemo(
    () => Object.keys(historyFallback).length,
    [historyFallback]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/site-measurements`);
      if (!res.ok) throw new Error("Failed to load measurements");
      const data = (await res.json()) as ProjectSiteMeasurementsResponse;
      setForm(measurementsToForm(data.measurements, data.notes));
      setCompleteness(data.completeness);
      setHistoryFallback(data.historyFallback ?? {});
      setHistoryRunCreatedAt(
        data.historyRunCreatedAt ? new Date(data.historyRunCreatedAt) : null
      );
      setSavedAt(data.updatedAt ? new Date(data.updatedAt) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/site-measurements`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      const data = (await res.json()) as ProjectSiteMeasurementsResponse;
      setCompleteness(data.completeness);
      setHistoryFallback(data.historyFallback ?? {});
      setSavedAt(new Date(data.updatedAt));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const completenessPct = useMemo(
    () => Math.round(completeness.ratio * 100),
    [completeness.ratio]
  );

  const importFromHistory = () => {
    setForm((prev) =>
      measurementsToForm(
        mergeMeasurements(historyFallback, formToMeasurements(prev)),
        prev.notes
      )
    );
    setHistoryFallback({});
  };

  function formToMeasurements(formState: FormState): ComplianceMeasurements {
    const payload = formToPayload(formState);
    const result: ComplianceMeasurements = {};
    if (payload.ceilingHeight != null) result.ceilingHeight = Number(payload.ceilingHeight);
    if (payload.stairWidth != null) result.stairWidth = Number(payload.stairWidth);
    if (payload.fireCompartmentArea != null) {
      result.fireCompartmentArea = Number(payload.fireCompartmentArea);
    }
    if (payload.windowUValue != null) result.windowUValue = Number(payload.windowUValue);
    if (payload.carbonationDepth != null) result.carbonationDepth = Number(payload.carbonationDepth);
    if (payload.coverThickness != null) result.coverThickness = Number(payload.coverThickness);
    if (payload.existingLoadKN != null) result.existingLoadKN = Number(payload.existingLoadKN);
    if (payload.targetLoadKN != null) result.targetLoadKN = Number(payload.targetLoadKN);
    if (payload.travelDistance != null) result.travelDistance = Number(payload.travelDistance);
    result.hasAccessibleEntrance = formState.hasAccessibleEntrance;
    result.hasSprinkler = formState.hasSprinkler;
    return result;
  }

  const extractFromDrawings = async () => {
    setExtracting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/site-measurements/extract-from-drawings`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Extraction failed");
      }
      const data = (await res.json()) as {
        record: ProjectSiteMeasurementsResponse;
        extraction: { provenance: DrawingMeasurementProvenance[] };
      };
      setForm(measurementsToForm(data.record.measurements, data.record.notes));
      setCompleteness(data.record.completeness);
      setHistoryFallback(data.record.historyFallback ?? {});
      setSavedAt(new Date(data.record.updatedAt));
      setLastExtraction(data.extraction.provenance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="border-copper/20">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-copper" />
              {t("Site Measurements", "现场测量数据")}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                "Enter field survey values used by compliance checks and expert agents. Values can also be extracted automatically when drawings are analyzed.",
                "录入现场测量值，供合规检查与专家 Agent 使用。上传图纸分析后也会自动提取并合并。"
              )}
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-xs font-medium",
                completeness.filled === completeness.total
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              )}
            >
              {t(
                `${completeness.filled}/${completeness.total} fields (${completenessPct}%)`,
                `已填 ${completeness.filled}/${completeness.total} 项（${completenessPct}%）`
              )}
            </p>
            {savedAt && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("Last saved", "上次保存")}: {savedAt.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("Loading measurements…", "加载测量数据…")}
          </div>
        ) : (
          <>
            {historyFieldCount > 0 && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs space-y-2">
                <p className="font-medium flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" />
                  {t(
                    `${historyFieldCount} fields available from last compliance run`,
                    `上次合规检查有 ${historyFieldCount} 项可回填`
                  )}
                </p>
                {historyRunCreatedAt && (
                  <p className="text-muted-foreground">
                    {t("Run date", "运行时间")}: {historyRunCreatedAt.toLocaleString()}
                  </p>
                )}
                <p className="text-muted-foreground">
                  {Object.keys(historyFallback)
                    .map((key) => {
                      const label =
                        MEASUREMENT_FIELD_LABELS[
                          key as keyof typeof MEASUREMENT_FIELD_LABELS
                        ];
                      return label ? t(label.en, label.zh) : key;
                    })
                    .join(" · ")}
                </p>
                <Button variant="outline" size="sm" onClick={importFromHistory}>
                  {t("Import into form", "导入到表单")}
                </Button>
              </div>
            )}

            {lastExtraction && lastExtraction.length > 0 && (
              <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs space-y-2">
                <p className="font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t(
                    `Extracted ${lastExtraction.length} fields from drawings`,
                    `已从图纸提取 ${lastExtraction.length} 项`
                  )}
                </p>
                <ul className="text-muted-foreground space-y-1">
                  {lastExtraction.map((item) => {
                    const label =
                      MEASUREMENT_FIELD_LABELS[
                        item.field as keyof typeof MEASUREMENT_FIELD_LABELS
                      ];
                    return (
                      <li key={item.field}>
                        • {label ? t(label.en, label.zh) : item.field}:{" "}
                        {String(item.value)} ({item.source}, {Math.round(item.confidence * 100)}%)
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {FIELD_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  {t(group.titleEn, group.titleZh)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.fields.map((field) =>
                    field.type === "checkbox" ? (
                      <label
                        key={field.key}
                        className="flex items-center gap-2 text-xs rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/40"
                      >
                        <input
                          type="checkbox"
                          checked={form[field.key] as boolean}
                          onChange={(e) => updateField(field.key, e.target.checked as FormState[typeof field.key])}
                        />
                        {t(field.labelEn, field.labelZh)}
                      </label>
                    ) : (
                      <div key={field.key}>
                        <Label className="text-xs">
                          {t(field.labelEn, field.labelZh)}
                          {field.unit ? ` (${field.unit})` : ""}
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          className="h-8 text-xs mt-1"
                          value={form[field.key] as string}
                          onChange={(e) =>
                            updateField(field.key, e.target.value as FormState[typeof field.key])
                          }
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}

            <div>
              <Label className="text-xs">{t("Notes", "备注")}</Label>
              <textarea
                className="mt-1 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder={t(
                  "Survey source, test method, or location references…",
                  "测量来源、检测方法或位置说明…"
                )}
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="copper" size="sm" onClick={save} disabled={saving || extracting}>
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                {t("Save Measurements", "保存测量数据")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={extractFromDrawings}
                disabled={loading || saving || extracting}
              >
                {extracting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                {t("Extract from Drawings", "从图纸提取")}
              </Button>
              <Button variant="ghost" size="sm" onClick={load} disabled={loading || saving || extracting}>
                {t("Reload", "重新加载")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
