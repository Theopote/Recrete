import { z } from "zod";

export const COST_RECORD_OUTCOMES = ["success", "partial", "failure"] as const;

export const projectCostRecordSchema = z.object({
  strategyType: z.string().optional(),
  actualCostPerSqm: z.coerce.number().positive("Unit cost must be positive"),
  actualTotalCost: z.coerce.number().positive("Total cost must be positive"),
  durationMonths: z.coerce.number().int().positive().optional(),
  outcome: z.enum(COST_RECORD_OUTCOMES).default("success"),
  notes: z.string().optional(),
  markCompleted: z.boolean().optional(),
});

export type ProjectCostRecordFormValues = z.infer<typeof projectCostRecordSchema>;

export const projectCostRecordUpdateSchema = projectCostRecordSchema.partial();
