import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth/user-service";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);
    const user = await registerUser({
      name: parsed.name,
      email: parsed.email,
      password: parsed.password,
    });
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
