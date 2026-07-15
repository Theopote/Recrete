import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { getRolePermissions } from "@/lib/auth/permissions";

export async function GET() {
  const { user, error } = await requireSession();
  if (error) return error;

  return NextResponse.json({
    id: user!.id,
    name: user!.name,
    email: user!.email,
    role: user!.role,
    permissions: getRolePermissions(user!.role),
  });
}
