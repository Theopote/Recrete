import { describe, it, expect } from "vitest";
import {
  canAccessAppRoute,
  canAccessProjectSection,
  resolveApiAction,
  getVisibleProjectSections,
} from "@/lib/auth/rbac";

describe("rbac", () => {
  it("allows architects to access project creation", () => {
    expect(canAccessAppRoute("architect", "/projects/new")).toBe(true);
    expect(canAccessAppRoute("viewer", "/projects/new")).toBe(false);
  });

  it("hides knowledge admin routes from viewers", () => {
    expect(canAccessAppRoute("viewer", "/knowledge/material-prices")).toBe(false);
    expect(canAccessAppRoute("project_manager", "/knowledge/material-prices")).toBe(true);
  });

  it("hides expert-agents and collaboration from viewers", () => {
    const viewerSections = getVisibleProjectSections("viewer");
    expect(viewerSections).not.toContain("expert-agents");
    expect(viewerSections).not.toContain("collaboration");
    expect(canAccessProjectSection("owner", "collaboration")).toBe(true);
  });

  it("maps API paths to actions", () => {
    expect(resolveApiAction("POST", "/api/projects/proj-1/strategies/generate")).toBe(
      "create_strategy"
    );
    expect(resolveApiAction("POST", "/api/projects/proj-1/issues")).toBe("manage_issues");
  });
});
