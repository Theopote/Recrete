import bcrypt from "bcryptjs";
import type { UserRole } from "@/types";

export const DEMO_PASSWORD = "recrete2026";
export const DEFAULT_ORGANIZATION_ID = "org-1";
export const SECOND_ORGANIZATION_ID = "org-2";

export interface DemoUser {
  id: string;
  organizationId: string;
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
    {
      id: "user-1",
      organizationId: DEFAULT_ORGANIZATION_ID,
      name: "Lin Wei",
      email: "lin.wei@recrete.io",
      role: "architect",
      passwordHash: hash,
    },
    {
      id: "user-2",
      organizationId: DEFAULT_ORGANIZATION_ID,
      name: "Chen Hao",
      email: "chen.hao@recrete.io",
      role: "engineer",
      passwordHash: hash,
    },
    {
      id: "user-3",
      organizationId: DEFAULT_ORGANIZATION_ID,
      name: "Zhang Mei",
      email: "zhang.mei@recrete.io",
      role: "project_manager",
      passwordHash: hash,
    },
    {
      id: "user-4",
      organizationId: DEFAULT_ORGANIZATION_ID,
      name: "Wang Fang",
      email: "wang.fang@xian.gov.cn",
      role: "owner",
      passwordHash: hash,
    },
    {
      id: "user-5",
      organizationId: DEFAULT_ORGANIZATION_ID,
      name: "Dr. Liu Ming",
      email: "liu.ming@heritage.cn",
      role: "consultant",
      passwordHash: hash,
    },
    {
      id: "user-6",
      organizationId: SECOND_ORGANIZATION_ID,
      name: "Test Other",
      email: "test.other@recrete.io",
      role: "architect",
      passwordHash: hash,
    },
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
