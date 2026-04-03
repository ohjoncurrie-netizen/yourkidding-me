import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

async function embed(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return res.data[0].embedding;
}

export async function retrieveContext(question: string): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const embedding = await embed(question);

    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_count: 4,
      filter: {},
    });

    if (error || !data?.length) return "";

    return (data as { content: string }[])
      .map((d) => d.content)
      .join("\n\n---\n\n");
  } catch {
    return "";
  }
}
