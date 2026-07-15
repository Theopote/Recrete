import "server-only";

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { getProjectById } from "@/lib/db/repository";
import type { ProjectWithRelations, UserRole } from "@/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

export type SessionResult =
  | { user: AuthUser }
  | { error: NextResponse };

export type ProjectAccessResult =
  | { user: AuthUser; project: ProjectWithRelations }
  | { error: NextResponse };

export async function getSessionOrThrow(): Promise<SessionResult> {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user?.organizationId;

  if (!session?.user?.id || !organizationId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name ?? "User",
      email: session.user.email ?? "",
      role: (session.user.role as UserRole) ?? "viewer",
      organizationId,
    },
  };
}

export async function requireProjectAccess(projectId: string): Promise<ProjectAccessResult> {
  const sessionResult = await getSessionOrThrow();
  if ("error" in sessionResult) {
    return sessionResult;
  }

  const project = await getProjectById(projectId, sessionResult.user.organizationId);
  if (!project) {
    return {
      error: NextResponse.json({ error: "Project not found" }, { status: 404 }),
    };
  }

  return { user: sessionResult.user, project };
}
