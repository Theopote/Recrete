"use client";

import { useState } from "react";
import { ReportEditor } from "@/components/reports/ReportEditor";
import { ReportTemplatePicker } from "@/components/reports/ReportTemplatePicker";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { reportTypeLabels, reportTypeLabelsZh } from "@/lib/utils/labels";
import { pickLocaleText } from "@/lib/i18n/locale";
import { useUIStore } from "@/lib/stores/ui-store";
import type { ProjectWithRelations, Report, ReportType } from "@/types";
import { FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { REPORT_TEMPLATE_CATALOG } from "@/lib/ai/report-templates";
import { reportTypeNeedsStrategy } from "@/lib/ai/strategy-conditioned-report";
import { AIErrorBanner } from "@/components/ai/AIErrorBanner";
import { parseAIErrorResponse } from "@/lib/ai/client-messages";
import { RoleGate } from "@/components/auth/RoleGate";
import { formatDate } from "@/lib/utils";

interface ReportsSectionClientProps {
  project: ProjectWithRelations;
}

export function ReportsSectionClient({ project: initialProject }: ReportsSectionClientProps) {
  const locale = useUIStore((s) => s.locale);
  const [reports, setReports] = useState(initialProject.reports ?? []);
  const [selectedReport, setSelectedReport] = useState<Report | null>(reports[0] ?? null);
  const [reportType, setReportType] = useState<ReportType>("existing_condition_report");
  const strategies = initialProject.strategies ?? [];
  const defaultStrategyId =
    strategies.find((s) => s.recommendationReason)?.id ?? strategies[0]?.id ?? "";
  const [strategyId, setStrategyId] = useState(defaultStrategyId);
  const needsStrategy = reportTypeNeedsStrategy(reportType);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<{ message: string; retryable: boolean } | null>(null);

  const reportLabel = (type: ReportType) =>
    pickLocaleText(locale, reportTypeLabels[type], reportTypeLabelsZh[type]);

  const selectedTemplate = REPORT_TEMPLATE_CATALOG.find((t) => t.type === reportType);
  const selectedTemplateTitle = selectedTemplate
    ? pickLocaleText(locale, selectedTemplate.titleEn, selectedTemplate.titleZh)
    : reportLabel(reportType);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/projects/${initialProject.id}/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          ...(needsStrategy && strategyId ? { strategyId } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const parsed = parseReport(data);
        setReports((prev) => [parsed, ...prev]);
        setSelectedReport(parsed);
      } else {
        setAiError(parseAIErrorResponse(data));
      }
    } catch {
      setAiError({
        message: pickLocaleText(locale, "Network error. Please try again.", "网络异常，请稍后重试。"),
        retryable: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContentSave = (content: string) => {
    if (!selectedReport) return;
    const updated = { ...selectedReport, content };
    setSelectedReport(updated);
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports"
        titleZh="报告中心"
        description="Generate structured Markdown reports from project data"
        descriptionZh="基于项目数据生成结构化 Markdown 报告"
        action={
          <RoleGate action="publish_report">
            <Button variant="copper" size="sm" onClick={handleGenerate} disabled={isGenerating || (needsStrategy && !strategyId)}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {isGenerating
                ? pickLocaleText(locale, "Generating...", "生成中...")
                : pickLocaleText(locale, "Generate Report", "生成报告")}
            </Button>
          </RoleGate>
        }
      />

      <div className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {pickLocaleText(locale, "Report Template", "报告模板")}
        </h3>
        <ReportTemplatePicker value={reportType} onChange={setReportType} />
        {needsStrategy && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {pickLocaleText(locale, "Selected Strategy", "选定改造方案")}
            </h3>
            {strategies.length > 0 ? (
              <select
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value)}
                className="w-full max-w-md rounded-md border bg-background px-3 py-2 text-sm"
              >
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.recommendationReason ? " ★" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {pickLocaleText(
                  locale,
                  "Generate renovation strategies first to produce a strategy-conditioned report.",
                  "请先生成改造策略，再生成方案条件化报告。"
                )}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground">
              {pickLocaleText(
                locale,
                "Report will reference the selected strategy and compliance remediation items.",
                "报告将引用所选方案及合规整改项。"
              )}
            </p>
          </div>
        )}
        <div
          className="flex items-start gap-2 rounded-md border border-copper/30 bg-copper/5 px-3 py-2"
          aria-live="polite"
        >
          <CheckCircle2 className="h-4 w-4 text-copper shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            {locale === "zh" ? (
              <>
                当前模板：<span className="font-medium text-foreground">{selectedTemplateTitle}</span>
                。点击右上角「生成报告」，将基于项目数据生成新报告。
              </>
            ) : (
              <>
                Current template:{" "}
                <span className="font-medium text-foreground">{selectedTemplateTitle}</span>. Click{" "}
                <span className="font-medium text-foreground">Generate Report</span> to create a
                new report from project data.
              </>
            )}
          </p>
        </div>
      </div>

      {aiError && (
        <AIErrorBanner
          message={aiError.message}
          retryable={aiError.retryable}
          onRetry={handleGenerate}
          onDismiss={() => setAiError(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            {pickLocaleText(locale, "Report Archive", "报告归档")}
          </h3>
          {reports.length > 0 ? (
            reports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => setSelectedReport(report)}
                className={`w-full text-left rounded-md border p-3 transition-colors cursor-pointer ${
                  selectedReport?.id === report.id
                    ? "border-copper bg-copper/5 ring-1 ring-copper/30"
                    : "hover:border-copper/30"
                }`}
              >
                <p className="text-xs font-medium truncate">{report.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {reportLabel(report.type)} · {formatDate(report.createdAt)}
                </p>
              </button>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              {pickLocaleText(locale, "No reports generated yet", "尚未生成报告")}
            </p>
          )}
        </div>

        <div className="lg:col-span-3">
          {selectedReport ? (
            <ReportEditor
              title={selectedReport.title}
              content={selectedReport.content}
              projectName={initialProject.name}
              reportId={selectedReport.id}
              projectId={initialProject.id}
              onSave={handleContentSave}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title={pickLocaleText(locale, "No report selected", "未选择报告")}
              description={pickLocaleText(
                locale,
                "Generate a report or select one from the archive to view.",
                "生成报告或从归档中选择一份查看。"
              )}
              action={{
                label: pickLocaleText(locale, "Generate Report", "生成报告"),
                onClick: handleGenerate,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function parseReport(r: Report): Report {
  return {
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}
