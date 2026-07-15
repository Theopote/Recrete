import { describe, it, expect, beforeEach } from "vitest";
import {
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  verifyCredentials,
  resetMockAuthStore,
} from "@/lib/auth/user-service";

describe("user-service (mock mode)", () => {
  beforeEach(() => {
    resetMockAuthStore();
  });

  it("registers and authenticates a new viewer account", async () => {
    const user = await registerUser({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });
    expect(user.role).toBe("viewer");

    const authed = await verifyCredentials("test@example.com", "password123");
    expect(authed?.email).toBe("test@example.com");
  });

  it("rejects duplicate registration", async () => {
    await registerUser({
      name: "A",
      email: "dup@example.com",
      password: "password123",
    });
    await expect(
      registerUser({ name: "B", email: "dup@example.com", password: "password456" })
    ).rejects.toThrow(/already exists/);
  });

  it("resets password with token in mock mode", async () => {
    await registerUser({
      name: "Reset Me",
      email: "reset@example.com",
      password: "oldpassword1",
    });

    const { token } = await requestPasswordReset("reset@example.com");
    expect(token).toBeTruthy();

    await resetPasswordWithToken(token!, "newpassword2");
    const authed = await verifyCredentials("reset@example.com", "newpassword2");
    expect(authed?.email).toBe("reset@example.com");

    const old = await verifyCredentials("reset@example.com", "oldpassword1");
    expect(old).toBeNull();
  });
});
