import { NextResponse } from "next/server";
import { search } from "@/lib/db/repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = await search(q);
  return NextResponse.json({ results });
}
