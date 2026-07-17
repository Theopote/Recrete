import { describe, it, expect, beforeEach } from "vitest";
import {
  archiveProject,
  deleteProjectPermanently,
  getProjectDeletionSummary,
  listProjectLifecycleAudits,
  resetProjectLifecycleMockStore,
} from "@/lib/db/project-lifecycle-store";
import { resetStore } from "@/lib/db/repository";

describe("project lifecycle (mock store)", () => {
  beforeEach(() => {
    resetStore();
    resetProjectLifecycleMockStore();
  });

  const actor = {
    performedById: "user-1",
    performedByName: "Test Admin",
  };

  it("archives an active project and records audit", async () => {
    const result = await archiveProject({
      projectId: "proj-demo",
      organizationId: "org-1",
      ...actor,
      reason: "Project completed",
    });

    expect(result?.status).toBe("archived");

    const summary = await getProjectDeletionSummary("proj-demo", "org-1");
    expect(summary?.status).toBe("archived");
    expect(summary?.canPermanentDelete).toBe(true);

    const audits = await listProjectLifecycleAudits("org-1");
    expect(audits[0]?.action).toBe("archived");
    expect(audits[0]?.reason).toBe("Project completed");
  });

  it("rejects archive when already archived", async () => {
    await archiveProject({
      projectId: "proj-2",
      organizationId: "org-1",
      ...actor,
    });

    await expect(
      archiveProject({
        projectId: "proj-2",
        organizationId: "org-1",
        ...actor,
      })
    ).rejects.toThrow(/already archived/i);
  });

  it("rejects delete without matching project code", async () => {
    await archiveProject({
      projectId: "proj-3",
      organizationId: "org-1",
      ...actor,
    });

    await expect(
      deleteProjectPermanently({
        projectId: "proj-3",
        organizationId: "org-1",
        confirmCode: "WRONG-CODE",
        ...actor,
      })
    ).rejects.toThrow(/confirmation/i);
  });

  it("permanently deletes archived project after code confirmation", async () => {
    await archiveProject({
      projectId: "proj-4",
      organizationId: "org-1",
      ...actor,
    });

    const audit = await deleteProjectPermanently({
      projectId: "proj-4",
      organizationId: "org-1",
      confirmCode: "RC-NJ-1965-004",
      ...actor,
    });

    expect(audit?.action).toBe("deleted");
    expect(audit?.projectId).toBeNull();

    const summary = await getProjectDeletionSummary("proj-4", "org-1");
    expect(summary).toBeNull();
  });

  it("blocks delete for active non-completed projects", async () => {
    await expect(
      deleteProjectPermanently({
        projectId: "proj-3",
        organizationId: "org-1",
        confirmCode: "RC-GZ-1998-003",
        ...actor,
      })
    ).rejects.toThrow(/归档|竣工/);
  });
});
