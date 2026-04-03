/**
 * Ingestion — reads markdown docs, chunks them, embeds with OpenAI,
 * and upserts into Supabase pgvector.
 *
 * Called via: POST /api/ingest  (requires x-ingest-secret header)
 */
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import { join } from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DOCS = [
  { name: "resume",     file: "resume.md" },
  { name: "projects",   file: "projects.md" },
  { name: "philosophy", file: "philosophy.md" },
  { name: "faq",        file: "faq.md" },
];

/** Split text into overlapping chunks */
function chunkText(text: string, size = 800, overlap = 120): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start += size - overlap;
  }
  return chunks.filter((c) => c.length > 40);
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

export async function ingestDocs(): Promise<{ count: number; message: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Wipe existing embeddings (idempotent re-ingest)
  await supabase.from("documents").delete().neq("id", 0);

  const allChunks: { content: string; metadata: Record<string, string> }[] = [];

  for (const { name, file } of DOCS) {
    const filePath = join(process.cwd(), "src/lib/langchain/docs", file);
    const content = await readFile(filePath, "utf-8");
    const chunks = chunkText(content);
    for (const chunk of chunks) {
      allChunks.push({ content: chunk, metadata: { source: name, file } });
    }
  }

  // Embed in batches of 20 (OpenAI limit is much higher but keep it safe)
  const BATCH = 20;
  let inserted = 0;

  for (let i = 0; i < allChunks.length; i += BATCH) {
    const batch = allChunks.slice(i, i + BATCH);
    const embeddings = await embedBatch(batch.map((c) => c.content));

    const rows = batch.map((c, j) => ({
      content: c.content,
      metadata: c.metadata,
      embedding: embeddings[j],
    }));

    const { error } = await supabase.from("documents").insert(rows);
    if (error) throw new Error(`Supabase insert error: ${error.message}`);
    inserted += rows.length;
  }

  return {
    count: inserted,
    message: `Ingested ${inserted} chunks from ${DOCS.length} documents.`,
  };
}
