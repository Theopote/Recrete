/** OpenAI availability checks — safe to import from smoke scripts (no server-only). */

export function getAIServiceMode(): "mock" | "openai" {
  if (process.env.AI_SERVICE === "mock") return "mock";
  if (process.env.OPENAI_API_KEY) {
    const svc = process.env.AI_SERVICE;
    if (!svc || svc === "openai" || svc === "auto") return "openai";
  }
  if (process.env.AI_SERVICE === "openai" && process.env.OPENAI_API_KEY) {
    return "openai";
  }
  return "mock";
}

export function isOpenAIConfigured(): boolean {
  return getAIServiceMode() === "openai";
}

export function isRealAIEnabled(): boolean {
  return isOpenAIConfigured();
}
