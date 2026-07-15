import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth/user-service";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { sendPasswordResetEmail, isEmailConfigured } from "@/lib/email/mailer";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.parse(body);
    const result = await requestPasswordReset(parsed.email);

    const response: Record<string, unknown> = {
      message: "If an account exists for this email, a reset link has been sent.",
    };

    if (result.token) {
      const resetUrl = `${getBaseUrl()}/reset-password?token=${result.token}`;
      const emailResult = await sendPasswordResetEmail(parsed.email, resetUrl);

      if (emailResult.devMode) {
        response.devResetUrl = `/reset-password?token=${result.token}`;
        response.devExpiresAt = result.expiresAt?.toISOString();
        response.message =
          "If an account exists for this email, a reset link has been issued. (SMTP not configured — see dev link below.)";
      } else if (emailResult.sent) {
        response.emailSent = true;
      }
    }

    // Never leak whether email exists in production
    if (process.env.NODE_ENV === "production" && !isEmailConfigured()) {
      console.warn("[auth] Password reset requested but SMTP is not configured");
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 400 }
    );
  }
}
