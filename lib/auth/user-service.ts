import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { shouldUseDatabase } from "@/lib/db/resolve";
import { mapUser } from "@/lib/db/mappers";
import { getDemoUsers, verifyDemoUser } from "@/lib/auth/demo-users";
import {
  createPasswordResetToken,
  hashResetToken,
  isResetTokenExpired,
  resetTokenExpiresAt,
} from "@/lib/auth/password-reset";
import type { User, UserRole } from "@/types";
import { generateId } from "@/lib/mock-data";

interface MockRegisteredUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

let mockRegisteredUsers: MockRegisteredUser[] = [];

interface MockResetRecord {
  tokenHash: string;
  email: string;
  expiresAt: Date;
  usedAt?: Date | null;
}

let mockResetTokens: MockResetRecord[] = [];

export function resetMockAuthStore() {
  mockRegisteredUsers = [];
  mockResetTokens = [];
}

async function findUserRecord(email: string) {
  const normalized = email.toLowerCase().trim();

  if (await shouldUseDatabase()) {
    return prisma.user.findUnique({ where: { email: normalized } });
  }

  const demoUsers = await getDemoUsers();
  const demo = demoUsers.find((u) => u.email.toLowerCase() === normalized);
  if (demo) return demo;

  return mockRegisteredUsers.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}): Promise<User> {
  const email = input.email.toLowerCase().trim();
  const existing = await findUserRecord(email);
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const role = input.role ?? "viewer";
  const now = new Date();

  if (await shouldUseDatabase()) {
    const created = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
        role,
      },
    });
    return mapUser(created);
  }

  const user: MockRegisteredUser = {
    id: generateId("user"),
    name: input.name.trim(),
    email,
    role,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };
  mockRegisteredUsers.push(user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (await shouldUseDatabase()) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) throw new Error("User not found");
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new Error("Current password is incorrect");
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return;
  }

  const demoUsers = await getDemoUsers();
  const demo = demoUsers.find((u) => u.id === userId);
  if (demo) {
    const valid = await bcrypt.compare(currentPassword, demo.passwordHash);
    if (!valid) throw new Error("Current password is incorrect");
    demo.passwordHash = await bcrypt.hash(newPassword, 10);
    return;
  }

  const mock = mockRegisteredUsers.find((u) => u.id === userId);
  if (!mock) throw new Error("User not found");
  const valid = await bcrypt.compare(currentPassword, mock.passwordHash);
  if (!valid) throw new Error("Current password is incorrect");
  mock.passwordHash = await bcrypt.hash(newPassword, 10);
  mock.updatedAt = new Date();
}

export async function requestPasswordReset(email: string): Promise<{
  token?: string;
  expiresAt?: Date;
}> {
  const normalized = email.toLowerCase().trim();
  const user = await findUserRecord(normalized);

  // Always return success shape to avoid email enumeration
  if (!user) return {};

  const token = createPasswordResetToken();
  const tokenHash = hashResetToken(token);
  const expiresAt = resetTokenExpiresAt();

  if (await shouldUseDatabase()) {
    const dbUser = await prisma.user.findUnique({ where: { email: normalized } });
    if (!dbUser) return {};

    await prisma.passwordResetToken.deleteMany({
      where: { userId: dbUser.id, usedAt: null },
    });
    await prisma.passwordResetToken.create({
      data: { userId: dbUser.id, tokenHash, expiresAt },
    });
  } else {
    mockResetTokens = mockResetTokens.filter((t) => t.email !== normalized || t.usedAt);
    mockResetTokens.push({ tokenHash, email: normalized, expiresAt });
  }

  return { token, expiresAt };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<void> {
  const tokenHash = hashResetToken(token);

  if (await shouldUseDatabase()) {
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!record || record.usedAt || isResetTokenExpired(record.expiresAt)) {
      throw new Error("Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return;
  }

  const record = mockResetTokens.find((t) => t.tokenHash === tokenHash && !t.usedAt);
  if (!record || isResetTokenExpired(record.expiresAt)) {
    throw new Error("Invalid or expired reset token");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const demoUsers = await getDemoUsers();
  const demo = demoUsers.find((u) => u.email === record.email);
  if (demo) {
    demo.passwordHash = passwordHash;
  } else {
    const mock = mockRegisteredUsers.find((u) => u.email === record.email);
    if (!mock) throw new Error("User not found");
    mock.passwordHash = passwordHash;
    mock.updatedAt = new Date();
  }
  record.usedAt = new Date();
}

export async function verifyCredentials(email: string, password: string) {
  const normalized = email.toLowerCase().trim();

  if (await shouldUseDatabase()) {
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user?.passwordHash) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return mapUser(user);
  }

  const demoUser = await verifyDemoUser(normalized, password);
  if (demoUser) {
    return {
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies User;
  }

  const mock = mockRegisteredUsers.find((u) => u.email === normalized);
  if (!mock) return null;
  const valid = await bcrypt.compare(password, mock.passwordHash);
  if (!valid) return null;
  return {
    id: mock.id,
    name: mock.name,
    email: mock.email,
    role: mock.role,
    avatarUrl: null,
    createdAt: mock.createdAt,
    updatedAt: mock.updatedAt,
  } satisfies User;
}
