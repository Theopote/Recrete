"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/use-locale";
import type { StrategyVersion } from "@/types/ai";
import type { StrategyFieldDiff } from "@/lib/utils/strategy-diff";
import { History } from "lucide-react";

interface StrategyVersionHistoryProps {
  projectId: string;
  strategyId: string;
}

export function StrategyVersionHistory({ projectId, strategyId }: StrategyVersionHistoryProps) {
  const { t } = useLocale();
  const [versions, setVersions] = useState<StrategyVersion[]>([]);
  const [diffs, setDiffs] = useState<StrategyFieldDiff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/strategies/${strategyId}/versions`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const list = (data.versions as StrategyVersion[]).map((v) => ({
          ...v,
          createdAt: new Date(v.createdAt),
          snapshot: {
            ...v.snapshot,
            createdAt: new Date(v.snapshot.createdAt),
            updatedAt: new Date(v.snapshot.updatedAt),
          },
        }));
        setVersions(list);

        if (list.length >= 2) {
          const compareRes = await fetch(
            `/api/projects/${projectId}/strategies/${strategyId}/versions/compare?from=${list[1].id}&to=${list[0].id}`
          );
          if (compareRes.ok) {
            const compareData = await compareRes.json();
            if (!cancelled) setDiffs(compareData.diffs ?? []);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, strategyId]);

  if (loading) {
    return <p className="text-[10px] text-muted-foreground">{t("Loading version history…", "加载版本历史…")}</p>;
  }

  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
        <History className="h-3 w-3" /> {t("Version history", "版本历史")}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {versions.slice(0, 4).map((v) => (
          <Badge key={v.id} variant="outline" className="text-[10px] font-normal">
            {v.label}
            {v.instruction ? ` · ${t("iterated", "已迭代")}` : ""}
          </Badge>
        ))}
      </div>
      {versions[0]?.changeSummary && (
        <p className="text-[10px] text-muted-foreground">
          {t("Latest", "最新")}: {versions[0].changeSummary}
        </p>
      )}
      {diffs.length > 0 && (
        <ul className="space-y-1">
          {diffs.slice(0, 4).map((d) => (
            <li key={d.field} className="text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground">{d.field}</span> {t("changed", "已变更")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
