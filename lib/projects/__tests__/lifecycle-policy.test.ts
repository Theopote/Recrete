import { describe, it, expect } from "vitest";
import { canPermanentlyDeleteProject } from "@/lib/projects/lifecycle-policy";

describe("lifecycle-policy", () => {
  it("allows delete for archived and completed", () => {
    expect(canPermanentlyDeleteProject("archived")).toBe(true);
    expect(canPermanentlyDeleteProject("completed")).toBe(true);
  });

  it("blocks delete for in-progress statuses", () => {
    expect(canPermanentlyDeleteProject("diagnosis")).toBe(false);
    expect(canPermanentlyDeleteProject("strategy")).toBe(false);
  });
});
