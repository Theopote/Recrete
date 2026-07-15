import { prisma } from "@/lib/db/prisma";

let dbAvailable: boolean | null = null;

export function isDatabaseEnabled(): boolean {
  return process.env.USE_DATABASE === "true";
}

export function assertDatabaseModeForProduction() {
  if (process.env.NODE_ENV === "production" && !isDatabaseEnabled()) {
    console.warn(
      "[Recrete] USE_DATABASE is not true in production — data will not persist across restarts. Set USE_DATABASE=true and DATABASE_URL for firm trials."
    );
  }
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
