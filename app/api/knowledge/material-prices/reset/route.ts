import { NextResponse } from "next/server";
import { resetMaterialPrices } from "@/lib/db/material-prices";
import { requireProjectAction } from "@/lib/auth/session";

export async function POST() {
  const { error } = await requireProjectAction("manage_members");
  if (error) return error;

  try {
    const items = await resetMaterialPrices();
    return NextResponse.json({ items, count: items.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reset failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
