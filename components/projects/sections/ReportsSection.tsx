"use client";

import { useState } from "react";
import { ReportEditor } from "@/components/reports/ReportEditor";
import { SectionHeader } from "@/components/app/SectionHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { reportTypeLabels } from "@/lib/utils/labels";
import type { ProjectWithRelations, Report, ReportType } from "@/types";
import { FileText, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ReportsSectionProps {
  project: ProjectWithRelations;
}

export function ReportsSection({ project: initialProject }: ReportsSectionProps) {
  const [reports, setReports] = useState(initialProject.reports ?? []);
  const [selectedReport, setSelectedReport] = useState<Report | null>(reports[0] ?? null);
  const [reportType, setReportType] = useState<ReportType>("existing_condition_report");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/projects/${initialProject.id}/reports/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType }),
      });
      if (res.ok) {
        const report = await res.json();
        setReports((prev) => [report, ...prev]);
        setSelectedReport(report);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Reports"
        description="Generate structured Markdown reports from project data"
        action={
          <div className="flex gap-2">
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-56 h-8 text-xs"
            >
              {Object.entries(reportTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
            <Button variant="copper" size="sm" onClick={handleGenerate} disabled={isGenerating}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {isGenerating ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Report Archive
          </h3>
          {reports.length > 0 ? (
            reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`w-full text-left rounded-md border p-3 transition-colors ${
                  selectedReport?.id === report.id
                    ? "border-copper bg-copper/5"
                    : "hover:border-copper/30"
                }`}
              >
                <p className="text-xs font-medium truncate">{report.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {reportTypeLabels[report.type]} · {formatDate(report.createdAt)}
                </p>
              </button>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No reports generated yet</p>
          )}
        </div>

        <div className="lg:col-span-3">
          {selectedReport ? (
            <ReportEditor
              title={selectedReport.title}
              content={selectedReport.content}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="No report selected"
              description="Generate a report or select one from the archive to view."
              action={{ label: "Generate Report", onClick: handleGenerate }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
