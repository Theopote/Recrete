import { z } from "zod";

export const trialFeedbackKindSchema = z.enum([
  "stuck",
  "unclear_copy",
  "ai_quality",
  "general",
]);

export const trialFeedbackStepSchema = z.enum([
  "login",
  "create_project",
  "upload_document",
  "document_analysis",
  "diagnosis",
  "generate_strategies",
  "strategy_review",
  "reports",
  "other",
]);

export const trialFeedbackSchema = z.object({
  kind: trialFeedbackKindSchema,
  step: trialFeedbackStepSchema.optional(),
  pagePath: z.string().max(500).optional(),
  projectId: z.string().max(100).optional(),
  aiValueRating: z.number().int().min(1).max(5).optional(),
  isBlocker: z.boolean().optional(),
  confusingText: z.string().max(2000).optional(),
  notes: z.string().min(1).max(4000),
});

export type TrialFeedbackInput = z.infer<typeof trialFeedbackSchema>;
