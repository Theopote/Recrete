import "server-only";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { canPerformAction, type ProjectAction } from "@/lib/auth/permissions";
import type { UserRole } from "@/types";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    organizationId: session.user.organizationId,
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    role: (session.user.role as UserRole) ?? "viewer",
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}

export async function requireSession() {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, error: null };
}

export async function requireProjectAction(action: ProjectAction) {
  const result = await requireSession();
  if (result.error) return result;
  if (!canPerformAction(result.user!.role, action)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }
  return result;
}

export async function requireRoles(...roles: UserRole[]) {
  const result = await requireSession();
  if (result.error) return result;
  if (!roles.includes(result.user!.role)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Insufficient permissions" }, { status: 403 }),
    };
  }
  return result;
}
