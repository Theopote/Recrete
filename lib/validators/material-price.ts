import { z } from "zod";

export const MATERIAL_REGIONS = ["西北", "华东", "华北", "西南", "华南", "全国"] as const;

export const materialPriceSchema = z.object({
  material: z.string().min(1, "Material name required"),
  materialZh: z.string().min(1, "中文名称必填"),
  unit: z.string().min(1, "Unit required"),
  pricePerUnit: z.coerce.number().positive("Price must be positive"),
  region: z.enum(MATERIAL_REGIONS),
  trendPercent: z.coerce.number().min(-50).max(50),
});

export type MaterialPriceFormValues = z.infer<typeof materialPriceSchema>;

export const materialPriceUpdateSchema = materialPriceSchema.partial();
