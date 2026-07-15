import { describe, it, expect, beforeEach } from "vitest";
import { getProjects, getProjectById } from "@/lib/db/mock-repository";
import { resetStore } from "@/lib/db/mock-repository";

describe("tenant isolation (mock store)", () => {
  beforeEach(() => {
    resetStore();
  });

  it("org-1 only sees org-1 projects", async () => {
    const projects = await getProjects("org-1");
    expect(projects.every((p) => p.organizationId === "org-1")).toBe(true);
    expect(projects.some((p) => p.id === "proj-demo")).toBe(true);
    expect(projects.some((p) => p.id === "proj-org2")).toBe(false);
  });

  it("org-2 only sees org-2 projects", async () => {
    const projects = await getProjects("org-2");
    expect(projects).toHaveLength(1);
    expect(projects[0].id).toBe("proj-org2");
  });

  it("org-2 cannot access org-1 project by id", async () => {
    const project = await getProjectById("proj-demo", "org-2");
    expect(project).toBeNull();
  });

  it("org-1 cannot access org-2 project by id", async () => {
    const project = await getProjectById("proj-org2", "org-1");
    expect(project).toBeNull();
  });
});
