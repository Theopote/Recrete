export type AIOperation =
  | "diagnosis_generate"
  | "strategy_generate"
  | "report_generate"
  | "copilot"
  | "ai_create"
  | "compliance"
  | "document_analyze";

export interface AIUsageSummary {
  dailyUsed: number;
  dailyLimit: number;
  monthlyUsed: number;
  monthlyLimit: number;
  remainingDaily: number;
  remainingMonthly: number;
}

export interface RecordAIUsageInput {
  organizationId: string;
  userId?: string;
  operation: AIOperation;
  provider: "mock" | "openai" | "anthropic";
  modelName?: string;
  success: boolean;
}
