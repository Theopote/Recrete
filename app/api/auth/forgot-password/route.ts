import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth/user-service";
import { forgotPasswordSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.parse(body);
    const result = await requestPasswordReset(parsed.email);

    const response: Record<string, unknown> = {
      message: "If an account exists for this email, a reset link has been issued.",
    };

    // Dev convenience: expose token when no email provider is configured
    if (process.env.NODE_ENV !== "production" && result.token) {
      response.devResetToken = result.token;
      response.devResetUrl = `/reset-password?token=${result.token}`;
      response.devExpiresAt = result.expiresAt?.toISOString();
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 400 }
    );
  }
}
