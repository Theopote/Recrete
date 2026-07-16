"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { SectionHeader } from "@/components/app/SectionHeader";
import { MaterialPriceFormDialog } from "@/components/knowledge/MaterialPriceFormDialog";
import { useLocale } from "@/lib/i18n/use-locale";
import { MATERIAL_REGIONS } from "@/lib/validators/material-price";
import type { MaterialPriceIndex } from "@/lib/ai/knowledge/cost-benchmarks";
import { cn } from "@/lib/utils";
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

function TrendBadge({ trend }: { trend: number }) {
  if (Math.abs(trend) < 0.05) {
    return (
      <Badge variant="outline" className="text-[10px] gap-0.5">
        <Minus className="h-3 w-3" />
        0%
      </Badge>
    );
  }
  const up = trend > 0;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] gap-0.5",
        up ? "text-red-700 border-red-200 bg-red-50/50" : "text-sage border-sage/30 bg-sage/10"
      )}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {up ? "+" : ""}
      {trend.toFixed(1)}%
    </Badge>
  );
}

export function MaterialPriceAdminPanel() {
  const { t } = useLocale();
  const [items, setItems] = useState<MaterialPriceIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialPriceIndex | null>(null);
  const [resetting, setResetting] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const qs = regionFilter !== "all" ? `?region=${encodeURIComponent(regionFilter)}` : "";
      const res = await fetch(`/api/knowledge/material-prices${qs}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [regionFilter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const stats = useMemo(() => {
    const byRegion = new Map<string, number>();
    for (const item of items) {
      byRegion.set(item.region, (byRegion.get(item.region) ?? 0) + 1);
    }
    const avgTrend =
      items.length > 0
        ? items.reduce((s, i) => s + i.trendPercent, 0) / items.length
        : 0;
    return { byRegion, avgTrend, count: items.length };
  }, [items]);

  const handleDelete = async (id: string) => {
    if (!confirm(t("Delete this material price record?", "确定删除该材料价格记录？"))) return;
    const res = await fetch(`/api/knowledge/material-prices/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const handleReset = async () => {
    if (!confirm(t("Reset all material prices to default seed data?", "确定将所有材料价格重置为默认种子数据？"))) return;
    setResetting(true);
    try {
      const res = await fetch("/api/knowledge/material-prices/reset", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Material Price Index"
        titleZh="材料价格指数"
        description="Manage regional material unit prices used by AI cost estimation"
        descriptionZh="管理区域材料单价，供 AI 成本估算与造价指数校准使用"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={resetting}>
              {resetting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              {t("Reset Defaults", "重置默认")}
            </Button>
            <Button
              variant="copper"
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t("Add Material", "新增材料")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("Records", "记录数")}</p>
            <p className="text-2xl font-semibold tabular-nums">{stats.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("Avg Trend", "平均环比")}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {stats.avgTrend >= 0 ? "+" : ""}
              {stats.avgTrend.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
              {t("By Region", "按区域")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[...stats.byRegion.entries()].map(([region, count]) => (
                <Badge key={region} variant="outline" className="text-[10px]">
                  {region} · {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-muted-foreground flex items-center gap-2">
          {t("Filter region", "筛选区域")}
          <Select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="h-8 w-32 text-xs"
          >
            <option value="all">{t("All", "全部")}</option>
            {MATERIAL_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </label>
        <Button variant="ghost" size="sm" onClick={loadItems} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("Refresh", "刷新")}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("Material", "材料")}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("Region", "区域")}</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("Price", "单价")}</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t("Trend", "环比")}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("Updated", "更新")}</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("Actions", "操作")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                  {t("Loading…", "加载中…")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t("No material prices found", "暂无材料价格记录")}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.materialZh}</p>
                    <p className="text-[10px] text-muted-foreground">{item.material}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px]">
                      {item.region}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    ¥{item.pricePerUnit.toLocaleString()}
                    <span className="text-muted-foreground font-normal"> / {item.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <TrendBadge trend={item.trendPercent} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.updatedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditing(item);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {t(
          "Changes apply immediately to AI cost estimation via regional material price multiplier.",
          "修改后将即时影响成本估算中的材料价格指数系数。"
        )}
      </p>

      <MaterialPriceFormDialog
        open={dialogOpen}
        item={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        onSaved={(saved) => {
          setItems((prev) => {
            const exists = prev.some((i) => i.id === saved.id);
            if (exists) return prev.map((i) => (i.id === saved.id ? saved : i));
            return [saved, ...prev];
          });
          loadItems();
        }}
      />
    </div>
  );
}
