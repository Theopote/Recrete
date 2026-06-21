import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  code: z.string().min(3, "Project code is required"),
  location: z.string().min(2, "Location is required"),
  buildingType: z.string().min(2, "Building type is required"),
  originalFunction: z.string().min(2, "Original function is required"),
  currentFunction: z.string().min(2, "Current function is required"),
  targetFunction: z.string().min(2, "Target function is required"),
  constructionYear: z.coerce
    .number()
    .min(1800, "Invalid year")
    .max(new Date().getFullYear(), "Year cannot be in the future"),
  structureType: z.string().min(2, "Structure type is required"),
  floorCount: z.coerce.number().min(1, "At least 1 floor required"),
  grossFloorArea: z.coerce.number().min(1, "Floor area is required"),
  renovationGoal: z.string().min(10, "Please describe the renovation goal"),
  budgetLevel: z.enum(["low", "medium", "high", "premium"]),
  description: z.string().optional(),
  buildingName: z.string().optional(),
  address: z.string().optional(),
  basementCount: z.coerce.number().min(0).optional(),
  currentCondition: z.string().optional(),
  heritageLevel: z
    .enum(["none", "local", "provincial", "national", "world"])
    .optional(),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export const documentUploadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum([
    "old_drawings",
    "survey_photos",
    "structure_documents",
    "mep_documents",
    "historical_documents",
    "cost_documents",
    "reports",
    "others",
  ]),
  description: z.string().optional(),
});

export type DocumentUploadFormValues = z.infer<typeof documentUploadSchema>;

export const siteIssueSchema = z.object({
  title: z.string().min(2, "Title is required"),
  category: z.enum([
    "crack",
    "leakage",
    "spalling",
    "corrosion",
    "structure_exposure",
    "mep_conflict",
    "facade_damage",
    "fire_safety",
    "accessibility",
    "drawing_mismatch",
    "other",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  location: z.string().optional(),
  description: z.string().min(5, "Description is required"),
  dueDate: z.string().optional(),
});

export type SiteIssueFormValues = z.infer<typeof siteIssueSchema>;

export const diagnosisItemSchema = z.object({
  title: z.string().min(2, "Title is required"),
  category: z.enum([
    "architecture",
    "structure",
    "facade",
    "mep",
    "fire_safety",
    "accessibility",
    "energy",
    "heritage",
    "operation",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["identified", "under_review", "confirmed", "resolved"]),
  description: z.string().min(5, "Description is required"),
  evidence: z.string().optional(),
  recommendation: z.string().optional(),
  relatedLocation: z.string().optional(),
});

export type DiagnosisItemFormValues = z.infer<typeof diagnosisItemSchema>;

export const strategySchema = z.object({
  name: z.string().min(2, "Strategy name is required"),
  type: z.enum([
    "light_renewal",
    "medium_renovation",
    "deep_recreation",
    "adaptive_reuse",
    "facade_upgrade",
    "energy_retrofit",
    "safety_upgrade",
  ]),
  summary: z.string().min(10, "Summary is required"),
  designGoal: z.string().min(5, "Design goal is required"),
  spatialStrategy: z.string().min(5, "Required"),
  structuralStrategy: z.string().min(5, "Required"),
  facadeStrategy: z.string().min(5, "Required"),
  mepStrategy: z.string().min(5, "Required"),
  costLevel: z.enum(["low", "medium", "high"]),
  scheduleLevel: z.enum(["low", "medium", "high"]),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  pros: z.string().min(1, "At least one pro required"),
  cons: z.string().min(1, "At least one con required"),
  recommendationReason: z.string().optional(),
});

export type StrategyFormValues = z.infer<typeof strategySchema>;
