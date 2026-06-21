#!/usr/bin/env tsx
/**
 * Sync in-memory knowledge corpus to Pinecone.
 * Usage: PINECONE_API_KEY=... npm run knowledge:sync
 */
import { getKnowledgeIndexForSync } from "../lib/ai/knowledge/embedding-search";
import {
  isPineconeConfigured,
  upsertKnowledgeDocuments,
  getPineconeIndexStats,
} from "../lib/ai/knowledge/pinecone-store";

async function main() {
  if (!isPineconeConfigured()) {
    console.error(
      "PINECONE_API_KEY not set. Create index:",
      process.env.PINECONE_INDEX ?? "recrete-knowledge"
    );
    process.exit(1);
  }

  const docs = getKnowledgeIndexForSync();
  console.log(`Upserting ${docs.length} documents…`);
  const count = await upsertKnowledgeDocuments(docs);
  console.log(`Upserted ${count} vectors.`);

  const stats = await getPineconeIndexStats();
  console.log("Index stats:", JSON.stringify(stats, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
