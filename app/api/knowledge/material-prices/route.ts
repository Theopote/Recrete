import { NextResponse } from "next/server";
import { listMaterialPrices, createMaterialPrice } from "@/lib/db/material-prices";
import { materialPriceSchema } from "@/lib/validators/material-price";
import { requireSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") ?? undefined;

  const items = await listMaterialPrices({ region: region || undefined });
  return NextResponse.json({ items, count: items.length });
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json();
    const parsed = materialPriceSchema.parse(body);
    const item = await createMaterialPrice(parsed);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
