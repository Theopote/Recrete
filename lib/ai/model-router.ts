import "server-only";

/**
 * Scenario-based model routing for Recrete AI layer.
 * Maps business capabilities to model tiers (fast / reasoning / vision / embedding).
 */
export type AIModelScenario =
  | "fast"
  | "reasoning"
  | "vision"
  | "embedding"
  | "compliance"
  | "copilot";

const SCENARIO_ENV: Record<AIModelScenario, string> = {
  fast: "OPENAI_MODEL_FAST",
  reasoning: "OPENAI_MODEL_REASONING",
  vision: "OPENAI_MODEL_VISION",
  embedding: "OPENAI_EMBEDDING_MODEL",
  compliance: "OPENAI_MODEL_COMPLIANCE",
  copilot: "OPENAI_MODEL_COPILOT",
};

const SCENARIO_DEFAULTS: Record<AIModelScenario, string> = {
  fast: "gpt-4o-mini",
  reasoning: "gpt-4o",
  vision: "gpt-4o",
  embedding: "text-embedding-3-small",
  compliance: "gpt-4o-mini",
  copilot: "gpt-4o-mini",
};

/** Legacy fallback — applies when scenario-specific env is unset. */
const LEGACY_MODEL = () => process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export function resolveModel(scenario: AIModelScenario): string {
  const envKey = SCENARIO_ENV[scenario];
  const fromEnv = process.env[envKey as keyof NodeJS.ProcessEnv];
  if (fromEnv) return fromEnv;

  if (scenario === "fast" || scenario === "compliance" || scenario === "copilot") {
    return LEGACY_MODEL();
  }

  return SCENARIO_DEFAULTS[scenario];
}

export function resolveVisionModel(provider: "openai" | "anthropic"): string {
  if (provider === "anthropic") {
    return (
      process.env.ANTHROPIC_VISION_MODEL ??
      process.env.OPENAI_MODEL_VISION ??
      "claude-sonnet-4-20250514"
    );
  }
  return process.env.OPENAI_VISION_MODEL ?? resolveModel("vision");
}

export function isOpenAIConfigured(): boolean {
  return process.env.AI_SERVICE === "openai" && Boolean(process.env.OPENAI_API_KEY);
}

export function modelLabel(scenario: AIModelScenario, suffix?: string): string {
  const base = resolveModel(scenario);
  return suffix ? `${base}:${suffix}` : base;
}
