import "server-only";

import { extractJsonArray } from "@/lib/ai/langchain/pipeline-utils";
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

export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = options.model ?? resolveModel(options.scenario ?? "fast");
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

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
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "";
}

export async function chatJsonArray<T>(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<T[]> {
  const content = await chatCompletion(messages, { ...options, jsonMode: true });
  const parsed = extractJsonArray<T>(content);
  if (parsed) return parsed;

  try {
    const obj = JSON.parse(content) as { items?: T[]; diagnosis?: T[]; strategies?: T[] };
    if (Array.isArray(obj)) return obj;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.diagnosis)) return obj.diagnosis;
    if (Array.isArray(obj.strategies)) return obj.strategies;
  } catch {
    // fall through
  }

  throw new Error("Failed to parse JSON array from model response");
}
