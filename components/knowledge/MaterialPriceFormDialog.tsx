"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  MATERIAL_REGIONS,
  materialPriceSchema,
  type MaterialPriceFormValues,
} from "@/lib/validators/material-price";
import type { MaterialPriceIndex } from "@/lib/ai/knowledge/cost-benchmarks";
import { X } from "lucide-react";

interface MaterialPriceFormDialogProps {
  item?: MaterialPriceIndex | null;
  open: boolean;
  onClose: () => void;
  onSaved: (item: MaterialPriceIndex) => void;
}

const COMMON_UNITS = ["m²", "m³", "t", "kg", "m", "kW", "套", "项"];

export function MaterialPriceFormDialog({
  item,
  open,
  onClose,
  onSaved,
}: MaterialPriceFormDialogProps) {
  const isEdit = !!item;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MaterialPriceFormValues>({
    resolver: zodResolver(materialPriceSchema),
    defaultValues: {
      region: "全国",
      trendPercent: 0,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        item
          ? {
              material: item.material,
              materialZh: item.materialZh,
              unit: item.unit,
              pricePerUnit: item.pricePerUnit,
              region: item.region as MaterialPriceFormValues["region"],
              trendPercent: item.trendPercent,
            }
          : {
              material: "",
              materialZh: "",
              unit: "m²",
              pricePerUnit: 0,
              region: "全国",
              trendPercent: 0,
            }
      );
    }
  }, [open, item, reset]);

  if (!open) return null;

  const onSubmit = async (data: MaterialPriceFormValues) => {
    const url = isEdit
      ? `/api/knowledge/material-prices/${item!.id}`
      : "/api/knowledge/material-prices";
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const saved = (await res.json()) as MaterialPriceIndex;
      onSaved(saved);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-medium">
            {isEdit ? "Edit Material Price · 编辑材料价格" : "Add Material Price · 新增材料价格"}
          </h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-3">
          <Field label="Material (EN)" error={errors.material?.message}>
            <Input {...register("material")} className="h-8 text-xs" placeholder="Ready-mix concrete C30" />
          </Field>

          <Field label="材料名称 (ZH)" error={errors.materialZh?.message}>
            <Input {...register("materialZh")} className="h-8 text-xs" placeholder="商品混凝土 C30" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit · 单位" error={errors.unit?.message}>
              <Select {...register("unit")} className="h-8 text-xs">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Region · 区域" error={errors.region?.message}>
              <Select {...register("region")} className="h-8 text-xs">
                {MATERIAL_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (¥) · 单价" error={errors.pricePerUnit?.message}>
              <Input
                type="number"
                step="0.01"
                {...register("pricePerUnit")}
                className="h-8 text-xs"
              />
            </Field>
            <Field label="Trend (%) · 环比" error={errors.trendPercent?.message}>
              <Input
                type="number"
                step="0.1"
                {...register("trendPercent")}
                className="h-8 text-xs"
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="copper" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Save" : "Add"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
