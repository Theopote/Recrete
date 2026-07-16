"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/use-locale";
import { riskLevelLabels, riskLevelLabelsZh } from "@/lib/utils/labels";
import type { ProjectWithRelations } from "@/types";
import type { AIInsight } from "@/types/ai";
import { AlertTriangle, Loader2, ScanSearch } from "lucide-react";

interface DataConflictPanelProps {
  project: ProjectWithRelations;
}

export function DataConflictPanel({ project }: DataConflictPanelProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const conflicts = (project.insights ?? []).filter((i) => i.type === "data_conflict");

  const handleScan = async () => {
    setScanning(true);
    try {
      await fetch(`/api/projects/${project.id}/conflicts/detect`, { method: "POST" });
      router.refresh();
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card className="border-amber-500/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h4 className="text-xs font-semibold uppercase tracking-wide">{t("Data Conflicts", "数据冲突")}</h4>
            <Badge variant="outline" className="text-[10px]">{conflicts.length}</Badge>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleScan} disabled={scanning}>
            {scanning ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ScanSearch className="h-3 w-3 mr-1" />}
            {t("Scan conflicts", "扫描冲突")}
          </Button>
        </div>

        {conflicts.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t(
              "No data conflicts detected. Run a scan after uploading documents or updating diagnosis.",
              "未检测到数据冲突。上传文档或更新诊断后可运行扫描。"
            )}
          </p>
        ) : (
          <ul className="space-y-2">
            {conflicts.slice(0, 5).map((item) => (
              <ConflictItem key={item.id} insight={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ConflictItem({ insight }: { insight: AIInsight }) {
  const { label } = useLocale();
  return (
    <li className="text-xs border rounded-md p-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{insight.title}</span>
        <Badge variant="outline" className="text-[10px]">
          {label(riskLevelLabels, riskLevelLabelsZh, insight.priority)}
        </Badge>
      </div>
      <p className="text-muted-foreground">{insight.summary}</p>
      {insight.recommendation && (
        <p className="text-foreground/80">→ {insight.recommendation}</p>
      )}
    </li>
  );
}
