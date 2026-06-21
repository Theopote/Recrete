function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const MOCK_MODEL = "recrete-mock-v1";

export async function withMockDelay<T>(fn: () => T, ms = 800): Promise<T> {
  await delay(ms);
  return fn();
}

export function mockConfidence(base: number, variance = 0.05): number {
  return Math.min(0.99, Math.max(0.5, base + (Math.random() * variance * 2 - variance)));
}
