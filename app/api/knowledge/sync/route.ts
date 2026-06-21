import { NextResponse } from "next/server";
import { getKnowledgeIndexForSync } from "@/lib/ai/knowledge/embedding-search";
import {
  isPineconeConfigured,
  upsertKnowledgeDocuments,
  getPineconeIndexStats,
} from "@/lib/ai/knowledge/pinecone-store";

export async function POST() {
  if (!isPineconeConfigured()) {
    return NextResponse.json(
      { error: "PINECONE_API_KEY not configured" },
      { status: 503 }
    );
  }

  try {
    const docs = getKnowledgeIndexForSync();
    const upserted = await upsertKnowledgeDocuments(docs);
    const stats = await getPineconeIndexStats();
    return NextResponse.json({ upserted, stats });
  } catch (error) {
    console.error("Knowledge sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
