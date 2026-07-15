import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSessionOrThrow, requireProjectAccess } from "@/lib/auth/authorize";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/db/repository", () => ({
  getProjectById: vi.fn(),
}));

import { getServerSession } from "next-auth";
import { getProjectById } from "@/lib/db/repository";

describe("authorize", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
    vi.mocked(getProjectById).mockReset();
  });

  it("returns 401 when session is missing", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const result = await getSessionOrThrow();
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(401);
    }
  });

  it("returns user when session has organizationId", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "user-1",
        name: "Demo",
        email: "demo@recrete.io",
        role: "admin",
        organizationId: "org-1",
      },
    } as never);

    const result = await getSessionOrThrow();
    expect("user" in result).toBe(true);
    if ("user" in result) {
      expect(result.user.organizationId).toBe("org-1");
    }
  });

  it("returns 404 when project is outside tenant", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "user-1",
        name: "Demo",
        email: "demo@recrete.io",
        role: "admin",
        organizationId: "org-1",
      },
    } as never);
    vi.mocked(getProjectById).mockResolvedValue(null);

    const result = await requireProjectAccess("proj-other");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(404);
    }
  });
});
