import { NextResponse } from "next/server";
import {
  getMaterialPriceById,
  updateMaterialPrice,
  deleteMaterialPrice,
} from "@/lib/db/material-prices";
import { materialPriceUpdateSchema } from "@/lib/validators/material-price";
import { requireSession } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await getMaterialPriceById(id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const body = await request.json();
    const parsed = materialPriceUpdateSchema.parse(body);
    const item = await updateMaterialPrice(id, parsed);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    const { id } = await params;
    const ok = await deleteMaterialPrice(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
