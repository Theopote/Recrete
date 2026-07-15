import { NextResponse } from "next/server";
import { changeUserPassword } from "@/lib/auth/user-service";
import { requireSession } from "@/lib/auth/session";
import { changePasswordSchema } from "@/lib/validators/auth";

export async function PATCH(request: Request) {
  const { user, error } = await requireSession();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = changePasswordSchema.parse(body);
    await changeUserPassword(user!.id, parsed.currentPassword, parsed.newPassword);
    return NextResponse.json({ message: "Password updated successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Password change failed";
    const status = message.includes("incorrect") ? 400 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
