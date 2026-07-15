import "server-only";

import { extractJsonArray } from "@/lib/ai/langchain/pipeline-utils";
import { normalizeAIError } from "@/lib/ai/errors";
import { resolveModel, type AIModelScenario } from "@/lib/ai/model-router";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  scenario?: AIModelScenario;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

const REQUEST_TIMEOUT_MS = Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 60_000);
const MAX_RETRIES = 2;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function isRetryableFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    error.name === "AbortError" ||
    error.name === "TimeoutError" ||
    msg.includes("network") ||
    msg.includes("fetch failed") ||
    msg.includes("econnreset")
  );
}

async function fetchChatCompletion(
  messages: ChatMessage[],
  options: ChatOptions
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw normalizeAIError(new Error("OPENAI_API_KEY is not configured"));
  }

  const model = options.model ?? resolveModel(options.scenario ?? "fast");
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.4,
          max_tokens: options.maxTokens,
          ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (attempt < MAX_RETRIES && isRetryableStatus(response.status)) {
          await delay(500 * (attempt + 1));
          continue;
        }
        throw new Error(`OpenAI API error: ${response.status} ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content ?? "";
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES && isRetryableFetchError(error)) {
        await delay(500 * (attempt + 1));
        continue;
      }
      throw normalizeAIError(error);
    }
  }

  throw normalizeAIError(lastError);
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  return fetchChatCompletion(messages, options);
}

export async function chatJsonArray<T>(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<T[]> {
  const content = await chatCompletion(messages, { ...options, jsonMode: true });
  const parsed = extractJsonArray<T>(content);
  if (parsed) return parsed;

  try {
    const obj = JSON.parse(content) as {
      items?: T[];
      diagnosis?: T[];
      strategies?: T[];
    };
    if (Array.isArray(obj)) return obj;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.diagnosis)) return obj.diagnosis;
    if (Array.isArray(obj.strategies)) return obj.strategies;
  } catch {
    // fall through
  }

  throw normalizeAIError(new Error("Failed to parse JSON array from model response"));
}
