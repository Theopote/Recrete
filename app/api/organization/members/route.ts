import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth/authorize";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await getSessionOrThrow();
  if ("error" in session) return session.error;

  const [organization, members] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { id: true, name: true, description: true },
    }),
    prisma.user.findMany({
      where: { organizationId: session.user.organizationId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    organization,
    members: members.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
  });
}
