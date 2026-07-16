"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { runIfcMepClashFromUrl } from "@/lib/bim/run-ifc-mep-clash";
import { useLocale } from "@/lib/i18n/use-locale";
import type { BilingualString } from "@/lib/i18n/bilingual";
import type { MepClashReport } from "@/lib/ai/agents/mep-agent";
import type { BimModel } from "@/types/bim";
import { Loader2, Sparkles } from "lucide-react";

const IfcClashHighlightViewer = dynamic(
  () => import("@/components/bim/IfcClashHighlightViewer").then((m) => m.IfcClashHighlightViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center rounded-md border bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

interface MepIfcClashPanelProps {
  projectId: string;
  model: BimModel;
  createIssues?: boolean;
  onComplete?: (result: {
    clashReport: MepClashReport;
    issueStats?: { created: number; skipped: number };
  }) => void;
}

export function MepIfcClashPanel({
  projectId,
  model,
  createIssues = true,
  onComplete,
}: MepIfcClashPanelProps) {
  const { locale, t, bt } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clashReport, setClashReport] = useState<MepClashReport | null>(null);
  const [issueStats, setIssueStats] = useState<{ created: number; skipped: number } | null>(null);
  const [selectedClashId, setSelectedClashId] = useState<string | null>(null);

  const highlightExpressIds = useMemo(() => {
    if (!clashReport || !selectedClashId) return [];
    const clash = clashReport.clashes.find((item) => item.id === selectedClashId);
    if (!clash) return [];
    const ids = [clash.elementA?.expressId, clash.elementB?.expressId].filter(
      (id): id is number => typeof id === "number"
    );
    return ids;
  }, [clashReport, selectedClashId]);

  const mepClashPriorityLabel = (priority: string) => {
    if (priority === "critical") return t("Critical", "严重");
    if (priority === "high") return t("High", "高");
    if (priority === "medium") return t("Medium", "中");
    if (priority === "low") return t("Low", "低");
    return priority;
  };

  const runIfcClash = async () => {
    if (!model.fileUrl) return;
    setLoading(true);
    setError(null);
    setSelectedClashId(null);

    try {
      const result = await runIfcMepClashFromUrl(model.fileUrl, model.id, {
        clearanceMm: 25,
        maxClashes: 80,
        maxElements: 400,
      });

      const response = await fetch(
        `/api/projects/${projectId}/bim-models/${model.id}/mep-clashes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clashReport: result.clashReport,
            elements: result.elements,
            createIssues,
            locale,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(t("Failed to persist IFC clash results", "IFC 碰撞结果保存失败"));
      }

      const payload = (await response.json()) as {
        clashReport: MepClashReport;
        issueStats?: { created: number; skipped: number };
      };

      setClashReport(payload.clashReport);
      setIssueStats(payload.issueStats ?? null);
      onComplete?.({
        clashReport: payload.clashReport,
        issueStats: payload.issueStats,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("IFC clash detection failed", "IFC 碰撞检测失败"));
    } finally {
      setLoading(false);
    }
  };

  const summary = clashReport?.summary as BilingualString | string | undefined;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{t("IFC pipeline clash detection", "IFC 管线碰撞检测")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <p className="text-muted-foreground">
          {t(
            "Scan IFC MEP/structure elements with AABB geometry clash (client-side web-ifc).",
            "使用 web-ifc 在浏览器扫描机电/结构构件并执行 AABB 几何碰撞。"
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="copper" size="sm" onClick={runIfcClash} disabled={loading || model.status !== "ready"}>
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            )}
            {t("Run IFC clash scan", "运行 IFC 碰撞扫描")}
          </Button>
          {model.metadata?.mepClashSummary && (
            <Badge variant="outline">
              {t("Last scan", "上次扫描")}: {model.metadata.mepClashSummary.clashCount}{" "}
              {t("clash(es)", "处冲突")}
            </Badge>
          )}
        </div>

        {error && <p className="text-destructive">{error}</p>}

        {clashReport && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={clashReport.clashCount ? "destructive" : "outline"}>
                {clashReport.clashCount} {t("clash(es)", "处冲突")}
              </Badge>
              {clashReport.criticalCount > 0 && (
                <Badge variant="destructive">
                  {clashReport.criticalCount} {t("high/critical", "高/严重")}
                </Badge>
              )}
              {issueStats && issueStats.created > 0 && (
                <Badge variant="secondary">
                  {t("Issues created", "已创建问题")}: {issueStats.created}
                </Badge>
              )}
              {issueStats && issueStats.skipped > 0 && (
                <span className="text-muted-foreground">
                  {t("Skipped (duplicate)", "跳过（重复）")}: {issueStats.skipped}
                </span>
              )}
            </div>

            {summary && <p className="text-muted-foreground">{bt(summary)}</p>}

            {clashReport.clashes.length > 0 ? (
              <div className="space-y-2">
                {clashReport.clashes.map((clash) => (
                  <button
                    key={clash.id}
                    type="button"
                    onClick={() => setSelectedClashId(clash.id)}
                    className={`w-full rounded-md border p-2 text-left transition-colors ${
                      selectedClashId === clash.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{bt(clash.title)}</span>
                      <Badge variant="outline">{mepClashPriorityLabel(clash.priority)}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{bt(clash.description)}</p>
                    <p className="text-muted-foreground mt-1">→ {bt(clash.remediation)}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                {t("No IFC geometry clashes detected.", "未检测到 IFC 几何碰撞。")}
              </p>
            )}

            {highlightExpressIds.length > 0 && model.fileUrl && (
              <div className="space-y-2 pt-2 border-t">
                <p className="font-medium text-foreground">
                  {t("3D clash highlight", "三维碰撞高亮")}
                </p>
                <IfcClashHighlightViewer
                  modelUrl={model.fileUrl}
                  highlightExpressIds={highlightExpressIds}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
