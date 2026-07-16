import "server-only";

import { isRealAIEnabled } from "@/lib/ai/model-router";
import { normalizeAIError } from "@/lib/ai/errors";

export function shouldFallbackToVisionMock(): boolean {
  return !isRealAIEnabled();
}

export function rethrowVisionError(error: unknown): never {
  throw normalizeAIError(error);
}
