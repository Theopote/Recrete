import { describe, it, expect, beforeEach } from "vitest";
import {
  createSpatialAnnotation,
  listSpatialAnnotations,
  resetSpatialAnnotations,
} from "@/lib/bim/spatial-annotation-store";

describe("spatial-annotation-store", () => {
  beforeEach(() => {
    resetSpatialAnnotations();
  });

  it("lists seed annotations for demo project", async () => {
    const list = await listSpatialAnnotations("proj-demo", "bim-demo-ifc");
    expect(list.length).toBeGreaterThanOrEqual(3);
    expect(list.some((a) => a.category === "heritage")).toBe(true);
  });

  it("creates a new annotation linked to a room", async () => {
    const created = await createSpatialAnnotation({
      projectId: "proj-demo",
      modelId: "bim-test",
      roomId: "room-101",
      roomLabel: "Room 101",
      category: "structure",
      title: "Beam crack",
      content: "Visible crack on north beam.",
      authorId: "user-2",
      authorName: "Chen Hao",
      authorParty: "structure_consultant",
      position: { x: 10, y: 20 },
    });

    const list = await listSpatialAnnotations("proj-demo", "bim-test");
    expect(list[0].id).toBe(created.id);
    expect(list[0].title).toBe("Beam crack");
  });
});
