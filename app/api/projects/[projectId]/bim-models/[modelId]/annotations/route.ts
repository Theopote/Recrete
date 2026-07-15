import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/options";
import { canPerformAction } from "@/lib/auth/permissions";
import {
  createSpatialAnnotation,
  listSpatialAnnotations,
} from "@/lib/bim/spatial-annotation-store";
import type { UserRole } from "@/types";

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
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, modelId } = await params;
  const annotations = await listSpatialAnnotations(projectId, modelId);
  return NextResponse.json({ annotations });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string; modelId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user.role as UserRole) ?? "viewer";
  if (!canPerformAction(role, "manage_collaboration") && !canPerformAction(role, "upload_documents")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { projectId, modelId } = await params;
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
    authorId: session.user.id ?? "unknown",
    authorName: session.user.name ?? "Unknown",
    authorParty: parsed.authorParty ?? null,
    position: parsed.position ?? null,
  });

  return NextResponse.json(annotation);
}
