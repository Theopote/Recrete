import bcrypt from "bcryptjs";
import type { UserRole } from "@/types";

export const DEMO_PASSWORD = "recrete2026";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
}

let cachedUsers: DemoUser[] | null = null;

export async function getDemoUsers(): Promise<DemoUser[]> {
  if (cachedUsers) return cachedUsers;
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  cachedUsers = [
    { id: "user-1", name: "Lin Wei", email: "lin.wei@recrete.io", role: "architect", passwordHash: hash },
    { id: "user-2", name: "Chen Hao", email: "chen.hao@recrete.io", role: "engineer", passwordHash: hash },
    { id: "user-3", name: "Zhang Mei", email: "zhang.mei@recrete.io", role: "project_manager", passwordHash: hash },
  ];
  return cachedUsers;
}

export async function verifyDemoUser(email: string, password: string) {
  const users = await getDemoUsers();
  const user = users.find((u) => u.email === email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return user;
}
