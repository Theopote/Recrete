import type { BimSpatialAnnotation } from "@/types/bim";
import { generateId } from "@/lib/mock-data";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

const SEED: BimSpatialAnnotation[] = [
  {
    id: "ann-1",
    projectId: "proj-demo",
    modelId: "bim-demo-ifc",
    roomId: "room-lobby",
    roomLabel: "Lobby / 门厅",
    category: "heritage",
    title: "南入口砖雕保护",
    content: "原政府办公楼南入口两侧砖雕需完整保留，施工脚手架不得接触立面。",
    authorId: "user-5",
    authorName: "Dr. Liu Ming",
    authorParty: "heritage_authority",
    position: { x: 12.5, y: 8.2 },
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "ann-2",
    projectId: "proj-demo",
    modelId: "bim-demo-ifc",
    roomId: "room-atrium",
    roomLabel: "Central Atrium / 中庭",
    category: "structure",
    title: "中庭挑空结构复核",
    content: "建议增设钢结构环梁连接二层连廊，结构顾问已确认可行。",
    authorId: "user-2",
    authorName: "Chen Hao",
    authorParty: "structure_consultant",
    position: { x: 28.0, y: 18.5 },
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
  },
  {
    id: "ann-3",
    projectId: "proj-demo",
    modelId: "bim-demo-ifc",
    roomId: "room-201",
    roomLabel: "Room 201 / 二层活动室",
    category: "program",
    title: "公共活动空间目标",
    content: "甲方要求此区域纳入 800㎡ 公共活动空间统计，建议与二层连廊合并计算。",
    authorId: "user-4",
    authorName: "Wang Fang",
    authorParty: "owner",
    position: { x: 35.2, y: 22.1 },
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
  },
];

let annotations = [...SEED];

export function resetSpatialAnnotations() {
  annotations = [...SEED];
}

export async function listSpatialAnnotations(
  projectId: string,
  modelId: string
): Promise<BimSpatialAnnotation[]> {
  return annotations
    .filter((a) => a.projectId === projectId && a.modelId === modelId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function createSpatialAnnotation(
  input: Omit<BimSpatialAnnotation, "id" | "createdAt" | "updatedAt">
): Promise<BimSpatialAnnotation> {
  const now = new Date();
  const record: BimSpatialAnnotation = {
    ...input,
    id: generateId("ann"),
    createdAt: now,
    updatedAt: now,
  };
  annotations.unshift(record);
  return record;
}

export async function updateSpatialAnnotation(
  annotationId: string,
  patch: Partial<Pick<BimSpatialAnnotation, "title" | "content" | "category" | "roomId" | "roomLabel" | "position">>
): Promise<BimSpatialAnnotation | null> {
  const index = annotations.findIndex((a) => a.id === annotationId);
  if (index < 0) return null;
  annotations[index] = {
    ...annotations[index],
    ...patch,
    updatedAt: new Date(),
  };
  return annotations[index];
}

export async function deleteSpatialAnnotation(annotationId: string): Promise<boolean> {
  const before = annotations.length;
  annotations = annotations.filter((a) => a.id !== annotationId);
  return annotations.length < before;
}
