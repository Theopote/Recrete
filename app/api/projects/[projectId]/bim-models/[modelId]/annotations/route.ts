import { NextResponse } from "next/server";
import { z } from "zod";
import { canPerformAction } from "@/lib/auth/permissions";
import { requireProjectAccess } from "@/lib/auth/authorize";
import {
  createSpatialAnnotation,
  listSpatialAnnotations,
} from "@/lib/bim/spatial-annotation-store";

const createSchema = z.object({
  roomId: z.string().optional().nullable(),
  roomLabel: z.string().optional().nullable(),
  category: z.enum(["structure", "heritage", "mep", "program", "fire_safety", "note"]),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  position: z.object({ x: z.number(), y: z.number() }).optional().nullable(),
  authorParty: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> }
) {
  const { projectId, modelId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;

  const annotations = await listSpatialAnnotations(projectId, modelId);
  return NextResponse.json({ annotations });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> }
) {
  const { projectId, modelId } = await params;
  const access = await requireProjectAccess(projectId);
  if ("error" in access) return access.error;
  const { user } = access;

  if (!canPerformAction(user.role, "manage_collaboration") && !canPerformAction(user.role, "upload_documents")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.parse(body);

  const annotation = await createSpatialAnnotation({
    projectId,
    modelId,
    roomId: parsed.roomId ?? null,
    roomLabel: parsed.roomLabel ?? null,
    category: parsed.category,
    title: parsed.title,
    content: parsed.content,
    authorId: user.id,
    authorName: user.name,
    authorParty: parsed.authorParty ?? null,
    position: parsed.position ?? null,
  });

  return NextResponse.json(annotation);
}
