import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth/user-service";
import { resetPasswordSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.parse(body);
    await resetPasswordWithToken(parsed.token, parsed.password);
    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset failed";
    const status = message.includes("Invalid or expired") ? 400 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
