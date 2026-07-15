import "server-only";

import { NextResponse } from "next/server";
import { requireProjectAction } from "@/lib/auth/session";
import { resolveApiAction } from "@/lib/auth/rbac";
import type { ProjectAction } from "@/lib/auth/permissions";

export async function guardApiRequest(
  method: string,
  pathname: string,
  explicitAction?: ProjectAction
) {
  const action = explicitAction ?? resolveApiAction(method, pathname);
  if (!action) return { user: null, error: null };

  const result = await requireProjectAction(action);
  return result;
}

export async function guardOrRespond(method: string, pathname: string) {
  const { error } = await guardApiRequest(method, pathname);
  if (error) return error;
  return null;
}

export function forbiddenResponse(message = "Insufficient permissions") {
  return NextResponse.json({ error: message }, { status: 403 });
}
