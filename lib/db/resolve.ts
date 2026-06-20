import { prisma } from "@/lib/db/prisma";

let dbAvailable: boolean | null = null;

export function isDatabaseEnabled(): boolean {
  return process.env.USE_DATABASE === "true";
}

export async function shouldUseDatabase(): Promise<boolean> {
  if (!isDatabaseEnabled()) return false;
  if (dbAvailable !== null) return dbAvailable;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
  } catch {
    dbAvailable = false;
  }
  return dbAvailable;
}

export function resetDatabaseCache(): void {
  dbAvailable = null;
}
