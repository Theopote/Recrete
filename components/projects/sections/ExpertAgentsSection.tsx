"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ProjectWithRelations } from "@/types";
import { Building2, ShieldCheck, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpertAgentsSectionProps {
  project: ProjectWithRelations;
}

export function ExpertAgentsSection({ project }: ExpertAgentsSectionProps) {
  const [activeTab, setActiveTab] = useState<"structural" | "compliance">("structural");
  const [structuralLoading, setStructuralLoading] = useState(false);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [structuralResult, setStructuralResult] = useState<Record<string, unknown> | null>(null);
  const [complianceResult, setComplianceResult] = useState<Record<string, unknown> | null>(null);

  const [structuralInput, setStructuralInput] = useState({
    carbonationDepth: "",
    existingLoad: "",
    targetLoad: "",
  });

  const [complianceInput, setComplianceInput] = useState({
    ceilingHeight: "",
    stairWidth: "",
    fireCompartmentArea: "",
    hasAccessibleEntrance: false,
    windowUValue: "",
  });

  const runStructural = async () => {
    setStructuralLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/experts/structural`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carbonationDepth: structuralInput.carbonationDepth
            ? Number(structuralInput.carbonationDepth)
            : undefined,
          existingLoad: structuralInput.existingLoad
            ? Number(structuralInput.existingLoad)
            : undefined,
          targetLoad: structuralInput.targetLoad ? Number(structuralInput.targetLoad) : undefined,
        }),
      });
      if (res.ok) setStructuralResult(await res.json());
    } finally {
      setStructuralLoading(false);
    }
  };

  const runCompliance = async () => {
    setComplianceLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/experts/compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ceilingHeight: complianceInput.ceilingHeight
            ? Number(complianceInput.ceilingHeight)
            : undefined,
          stairWidth: complianceInput.stairWidth
            ? Number(complianceInput.stairWidth)
            : undefined,
          fireCompartmentArea: complianceInput.fireCompartmentArea
            ? Number(complianceInput.fireCompartmentArea)
            : undefined,
          hasAccessibleEntrance: complianceInput.hasAccessibleEntrance,
          windowUValue: complianceInput.windowUValue
            ? Number(complianceInput.windowUValue)
            : undefined,
        }),
      });
      if (res.ok) setComplianceResult(await res.json());
    } finally {
      setComplianceLoading(false);
    }
  };

  const assessment = structuralResult?.assessment as {
    safetyRating?: string;
    findings?: string[];
    recommendations?: string[];
    risks?: Array<{ issue: string; severity: string; recommendation: string }>;
  } | undefined;

  const report = complianceResult?.report as {
    overallCompliance?: string;
    checks?: Array<{
      requirement: string;
      status: string;
      code: string;
      priority: string;
      note: string;
    }>;
    criticalIssues?: string[];
    recommendations?: string[];
  } | undefined;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Expert Agent Matrix"
        titleZh="专家 Agent 矩阵"
        description="Run structural and compliance expert agents with optional site measurements."
        descriptionZh="运行结构与合规专家 Agent，可输入现场测量数据辅助评估。"
      />

      <div className="flex gap-2">
        <Button
          variant={activeTab === "structural" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("structural")}
        >
          <Building2 className="h-3.5 w-3.5" /> Structural
        </Button>
        <Button
          variant={activeTab === "compliance" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("compliance")}
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Compliance
        </Button>
      </div>

      {activeTab === "structural" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Structural Engineer Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Carbonation depth (mm)</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder="e.g. 18"
                    value={structuralInput.carbonationDepth}
                    onChange={(e) =>
                      setStructuralInput((s) => ({ ...s, carbonationDepth: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Existing load (kg/m²)</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder="e.g. 350"
                    value={structuralInput.existingLoad}
                    onChange={(e) =>
                      setStructuralInput((s) => ({ ...s, existingLoad: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Target load (kg/m²)</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    placeholder="e.g. 500"
                    value={structuralInput.targetLoad}
                    onChange={(e) =>
                      setStructuralInput((s) => ({ ...s, targetLoad: e.target.value }))
                    }
                  />
                </div>
              </div>
              <Button variant="copper" size="sm" onClick={runStructural} disabled={structuralLoading}>
                {structuralLoading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                Run Structural Assessment
              </Button>
            </CardContent>
          </Card>

          {assessment && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Safety rating</span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {assessment.safetyRating}
                  </Badge>
                </div>
                {assessment.findings && assessment.findings.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Findings</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {assessment.findings.map((f) => (
                        <li key={f}>• {f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {assessment.risks && assessment.risks.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Risks</p>
                    <ul className="text-xs space-y-2">
                      {assessment.risks.map((r) => (
                        <li key={r.issue}>
                          <span className="font-medium">{r.issue}</span>{" "}
                          <Badge variant="outline" className="text-[10px] ml-1">
                            {r.severity}
                          </Badge>
                          <p className="text-muted-foreground mt-0.5">{r.recommendation}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "compliance" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Compliance Review Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Ceiling height (m)</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    value={complianceInput.ceilingHeight}
                    onChange={(e) =>
                      setComplianceInput((s) => ({ ...s, ceilingHeight: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Stair width (m)</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    value={complianceInput.stairWidth}
                    onChange={(e) =>
                      setComplianceInput((s) => ({ ...s, stairWidth: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Fire compartment area (m²)</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    value={complianceInput.fireCompartmentArea}
                    onChange={(e) =>
                      setComplianceInput((s) => ({ ...s, fireCompartmentArea: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Window U-value</Label>
                  <Input
                    className="h-8 text-xs mt-1"
                    value={complianceInput.windowUValue}
                    onChange={(e) =>
                      setComplianceInput((s) => ({ ...s, windowUValue: e.target.value }))
                    }
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={complianceInput.hasAccessibleEntrance}
                  onChange={(e) =>
                    setComplianceInput((s) => ({
                      ...s,
                      hasAccessibleEntrance: e.target.checked,
                    }))
                  }
                />
                Accessible entrance provided
              </label>
              <Button variant="copper" size="sm" onClick={runCompliance} disabled={complianceLoading}>
                {complianceLoading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                )}
                Run Compliance Check
              </Button>
            </CardContent>
          </Card>

          {report && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Overall</span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {report.overallCompliance}
                  </Badge>
                </div>
                {report.checks && (
                  <div className="space-y-2">
                    {report.checks.map((c) => (
                      <div key={c.requirement} className="text-xs border rounded-md p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{c.requirement}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {c.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">{c.code} — {c.note}</p>
                      </div>
                    ))}
                  </div>
                )}
                {report.criticalIssues && report.criticalIssues.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-destructive mb-1">Critical issues</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {report.criticalIssues.map((i) => (
                        <li key={i}>• {i}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
