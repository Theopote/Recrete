import crypto from "crypto";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function getSecret() {
  return process.env.NEXTAUTH_SECRET ?? "recrete-dev-secret-change-in-production";
}

export function hashResetToken(token: string) {
  return crypto.createHmac("sha256", getSecret()).update(token).digest("hex");
}

export function createPasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function resetTokenExpiresAt() {
  return new Date(Date.now() + RESET_TTL_MS);
}

export function isResetTokenExpired(expiresAt: Date) {
  return expiresAt.getTime() < Date.now();
}
