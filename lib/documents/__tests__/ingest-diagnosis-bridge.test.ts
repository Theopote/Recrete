import { describe, it, expect } from "vitest";
import {
  formatIngestCompletionMessage,
  parseIngestCompletionMessage,
} from "@/lib/documents/ingest-diagnosis-bridge";

describe("ingest diagnosis bridge", () => {
  it("formats and parses completion messages", () => {
    const message = formatIngestCompletionMessage("Fire Code.pdf", "report", 3);
    expect(message).toContain("3 evidence");
    expect(message).toContain("suggest_diagnosis");

    const parsed = parseIngestCompletionMessage(message);
    expect(parsed.evidenceCount).toBe(3);
    expect(parsed.suggestDiagnosis).toBe(true);
  });

  it("returns false when no evidence created", () => {
    const message = formatIngestCompletionMessage("Empty.pdf", "report", 0);
    const parsed = parseIngestCompletionMessage(message);
    expect(parsed.suggestDiagnosis).toBe(false);
  });
});
