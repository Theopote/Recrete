import { NextResponse } from "next/server";
import { resetMaterialPrices } from "@/lib/db/material-prices";
import { requireSession } from "@/lib/auth/session";

export async function POST() {
  try {
    await requireSession();
    const items = await resetMaterialPrices();
    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
