"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/app/SectionHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ProjectWithRelations } from "@/types";
import { Building2, ShieldCheck, Loader2, Sparkles, Flame, Zap, Coins } from "lucide-react";

type ExpertTab = "structural" | "compliance" | "fire" | "mep" | "cost";

interface ExpertAgentsSectionProps {
  project: ProjectWithRelations;
}

export function ExpertAgentsSection({ project }: ExpertAgentsSectionProps) {
  const [activeTab, setActiveTab] = useState<ExpertTab>("structural");
  const [structuralLoading, setStructuralLoading] = useState(false);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [structuralResult, setStructuralResult] = useState<Record<string, unknown> | null>(null);
  const [complianceResult, setComplianceResult] = useState<Record<string, unknown> | null>(null);
  const [fireLoading, setFireLoading] = useState(false);
  const [mepLoading, setMepLoading] = useState(false);
  const [costLoading, setCostLoading] = useState(false);
  const [fireResult, setFireResult] = useState<Record<string, unknown> | null>(null);
  const [mepResult, setMepResult] = useState<Record<string, unknown> | null>(null);
  const [costResult, setCostResult] = useState<Record<string, unknown> | null>(null);

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

  const [fireInput, setFireInput] = useState({
    stairWidth: "",
    travelDistance: "",
    floorArea: "",
    occupantLoad: "",
    hasSprinkler: false,
  });

  const [mepInput, setMepInput] = useState({
    electricalCapacityKva: "",
    hvacAgeYears: "",
    requiredElectricalKva: "",
    plumbingCondition: "fair" as "good" | "fair" | "poor",
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

  const runFire = async () => {
    setFireLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/experts/fire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stairWidth: fireInput.stairWidth ? Number(fireInput.stairWidth) : undefined,
          travelDistance: fireInput.travelDistance ? Number(fireInput.travelDistance) : undefined,
          floorArea: fireInput.floorArea ? Number(fireInput.floorArea) : undefined,
          occupantLoad: fireInput.occupantLoad ? Number(fireInput.occupantLoad) : undefined,
          hasSprinkler: fireInput.hasSprinkler,
        }),
      });
      if (res.ok) setFireResult(await res.json());
    } finally {
      setFireLoading(false);
    }
  };

  const runMep = async () => {
    setMepLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/experts/mep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          electricalCapacityKva: mepInput.electricalCapacityKva
            ? Number(mepInput.electricalCapacityKva)
            : undefined,
          hvacAgeYears: mepInput.hvacAgeYears ? Number(mepInput.hvacAgeYears) : undefined,
          requiredElectricalKva: mepInput.requiredElectricalKva
            ? Number(mepInput.requiredElectricalKva)
            : undefined,
          plumbingCondition: mepInput.plumbingCondition,
        }),
      });
      if (res.ok) setMepResult(await res.json());
    } finally {
      setMepLoading(false);
    }
  };

  const runCost = async () => {
    setCostLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/experts/cost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) setCostResult(await res.json());
    } finally {
      setCostLoading(false);
    }
  };

  const fireAnalysis = fireResult?.analysis as {
    egressRating?: string;
    compartmentRating?: string;
    findings?: string[];
    recommendations?: string[];
  } | undefined;

  const mepAnalysis = mepResult?.analysis as {
    overallRating?: string;
    findings?: string[];
    recommendations?: string[];
    estimatedUpgradeScope?: string[];
  } | undefined;

  const costEstimate = costResult?.estimate as {
    estimatedCostPerSqm?: number;
    estimatedTotalCost?: number;
    costLevel?: string;
    confidence?: number;
    referenceCases?: Array<{ title: string; costPerSqm?: number }>;
    breakdown?: Array<{ item: string; sharePercent: number }>;
  } | undefined;

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
        <Button
          variant={activeTab === "fire" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("fire")}
        >
          <Flame className="h-3.5 w-3.5" /> Fire
        </Button>
        <Button
          variant={activeTab === "mep" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("mep")}
        >
          <Zap className="h-3.5 w-3.5" /> MEP
        </Button>
        <Button
          variant={activeTab === "cost" ? "default" : "outline"}
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setActiveTab("cost")}
        >
          <Coins className="h-3.5 w-3.5" /> Cost
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

      {activeTab === "fire" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Fire Protection Agent</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Stair width (m)</Label>
                  <Input className="h-8 text-xs mt-1" value={fireInput.stairWidth} onChange={(e) => setFireInput((s) => ({ ...s, stairWidth: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Travel distance (m)</Label>
                  <Input className="h-8 text-xs mt-1" value={fireInput.travelDistance} onChange={(e) => setFireInput((s) => ({ ...s, travelDistance: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Floor area (m²)</Label>
                  <Input className="h-8 text-xs mt-1" value={fireInput.floorArea} onChange={(e) => setFireInput((s) => ({ ...s, floorArea: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Occupant load</Label>
                  <Input className="h-8 text-xs mt-1" value={fireInput.occupantLoad} onChange={(e) => setFireInput((s) => ({ ...s, occupantLoad: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={fireInput.hasSprinkler} onChange={(e) => setFireInput((s) => ({ ...s, hasSprinkler: e.target.checked }))} />
                Sprinkler system present
              </label>
              <Button variant="copper" size="sm" onClick={runFire} disabled={fireLoading}>
                {fireLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                Run Fire Analysis
              </Button>
            </CardContent>
          </Card>
          {fireAnalysis && (
            <Card><CardContent className="p-4 space-y-2 text-xs">
              <div className="flex gap-2"><Badge variant="outline">Egress: {fireAnalysis.egressRating}</Badge><Badge variant="outline">Compartment: {fireAnalysis.compartmentRating}</Badge></div>
              <ul className="text-muted-foreground space-y-1">{fireAnalysis.findings?.map((f) => <li key={f}>• {f}</li>)}</ul>
            </CardContent></Card>
          )}
        </div>
      )}

      {activeTab === "mep" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">MEP Expert Agent</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Electrical capacity (kVA)</Label>
                  <Input className="h-8 text-xs mt-1" value={mepInput.electricalCapacityKva} onChange={(e) => setMepInput((s) => ({ ...s, electricalCapacityKva: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Required kVA</Label>
                  <Input className="h-8 text-xs mt-1" value={mepInput.requiredElectricalKva} onChange={(e) => setMepInput((s) => ({ ...s, requiredElectricalKva: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">HVAC age (years)</Label>
                  <Input className="h-8 text-xs mt-1" value={mepInput.hvacAgeYears} onChange={(e) => setMepInput((s) => ({ ...s, hvacAgeYears: e.target.value }))} />
                </div>
              </div>
              <Button variant="copper" size="sm" onClick={runMep} disabled={mepLoading}>
                {mepLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                Run MEP Assessment
              </Button>
            </CardContent>
          </Card>
          {mepAnalysis && (
            <Card><CardContent className="p-4 space-y-2 text-xs">
              <Badge variant="outline">{mepAnalysis.overallRating}</Badge>
              <ul className="text-muted-foreground space-y-1">{mepAnalysis.findings?.map((f) => <li key={f}>• {f}</li>)}</ul>
            </CardContent></Card>
          )}
        </div>
      )}

      {activeTab === "cost" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Cost Estimator Agent</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">Estimates based on historical case library and project GFA.</p>
              <Button variant="copper" size="sm" onClick={runCost} disabled={costLoading}>
                {costLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                Estimate Renovation Cost
              </Button>
            </CardContent>
          </Card>
          {costEstimate && (
            <Card><CardContent className="p-4 space-y-2 text-xs">
              <p className="text-lg font-semibold tabular-nums">¥{costEstimate.estimatedTotalCost?.toLocaleString()}</p>
              <p className="text-muted-foreground">~¥{costEstimate.estimatedCostPerSqm?.toLocaleString()}/sqm · {costEstimate.costLevel} · confidence {(costEstimate.confidence ?? 0) * 100}%</p>
              {costEstimate.referenceCases && costEstimate.referenceCases.length > 0 && (
                <p className="text-muted-foreground">Reference: {costEstimate.referenceCases.map((c) => c.title).join("; ")}</p>
              )}
            </CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}
