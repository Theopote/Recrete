/**
 * Unified Vision API provider supporting OpenAI GPT-4o and Anthropic Claude Vision
 */

export type VisionProviderName = "openai" | "anthropic";

export interface VisionRequestOptions {
  prompt: string;
  imageData: string;
  detail?: "low" | "high" | "auto";
  maxTokens?: number;
  temperature?: number;
}

export interface VisionProviderConfig {
  provider?: VisionProviderName;
  apiKey?: string;
  model?: string;
}

function resolveProvider(config?: VisionProviderConfig): {
  provider: VisionProviderName;
  apiKey: string;
  model: string;
} {
  const provider =
    config?.provider ??
    (process.env.VISION_PROVIDER as VisionProviderName | undefined) ??
    (process.env.ANTHROPIC_API_KEY ? "anthropic" : "openai");

  if (provider === "anthropic") {
    return {
      provider,
      apiKey: config?.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "",
      model: config?.model ?? process.env.ANTHROPIC_VISION_MODEL ?? "claude-sonnet-4-20250514",
    };
  }

  return {
    provider: "openai",
    apiKey: config?.apiKey ?? process.env.OPENAI_API_KEY ?? "",
    model: config?.model ?? process.env.OPENAI_VISION_MODEL ?? "gpt-4o",
  };
}

function normalizeImageUrl(imageData: string): string {
  if (imageData.startsWith("data:")) return imageData;
  return `data:image/jpeg;base64,${imageData}`;
}

function extractBase64(imageData: string): { mediaType: string; data: string } {
  if (imageData.startsWith("data:")) {
    const match = imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { mediaType: match[1], data: match[2] };
    }
  }
  return { mediaType: "image/jpeg", data: imageData };
}

async function callOpenAI(
  config: ReturnType<typeof resolveProvider>,
  options: VisionRequestOptions
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: options.prompt },
            {
              type: "image_url",
              image_url: {
                url: normalizeImageUrl(options.imageData),
                detail: options.detail ?? "high",
              },
            },
          ],
        },
      ],
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Vision API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "{}";
}

async function callAnthropic(
  config: ReturnType<typeof resolveProvider>,
  options: VisionRequestOptions
): Promise<string> {
  const { mediaType, data } = extractBase64(options.imageData);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.2,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data },
            },
            { type: "text", text: options.prompt },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic Vision API error: ${response.status}`);
  }

  const result = await response.json();
  const textBlock = result.content?.find((b: { type: string }) => b.type === "text");
  return textBlock?.text ?? "{}";
}

export class VisionProvider {
  private config: ReturnType<typeof resolveProvider>;

  constructor(options?: VisionProviderConfig) {
    this.config = resolveProvider(options);
  }

  get isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  get providerName(): VisionProviderName {
    return this.config.provider;
  }

  get modelName(): string {
    return this.config.model;
  }

  async analyzeImage(options: VisionRequestOptions): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error("Vision API key not configured");
    }

    if (this.config.provider === "anthropic") {
      return callAnthropic(this.config, options);
    }
    return callOpenAI(this.config, options);
  }
}

export const visionProvider = new VisionProvider();

export function parseVisionJson<T>(content: string, fallback: T): T {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonStr) as T;
  } catch {
    return fallback;
  }
}
