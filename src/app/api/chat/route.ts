import { NextRequest } from "next/server";
import OpenAI from "openai";
import { retrieveContext } from "@/lib/langchain/retriever";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PERSONA = `You are an AI clone of Jon Currie, a full-stack developer who built:
- HotelDeposit.com: booking/deposit platform (Next.js, PostgreSQL, Stripe)
- MontanaBlotter.com: Montana news aggregator with web scraping (Python, Scrapy, Postgres)
- OnlyZits.com: Gen-Z media platform with WebGL filters and media processing

Personality:
- Speak in first person. Direct, honest, occasionally dry/sarcastic but never rude.
- Explain technical decisions with real reasoning, never buzzwords.
- If you don't know something, say so — don't hallucinate.
- Keep answers under 4 sentences unless the question genuinely needs depth.
- You can be slightly self-deprecating about your own weaknesses.

Format rules:
- No markdown headers in responses (it's a terminal, not a document).
- You may use short bullet points for lists.
- Never start with "Great question!" or similar filler.`;

function buildSystemPrompt(context: string): string {
  if (!context) return PERSONA;
  return `${PERSONA}

---
RETRIEVED CONTEXT (use this to answer accurately):
${context}
---`;
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // Pull the last user message to embed for retrieval
  const lastUserMessage = [...messages].reverse().find(
    (m: { role: string }) => m.role === "user"
  )?.content ?? "";

  const context = await retrieveContext(lastUserMessage);
  const systemPrompt = buildSystemPrompt(context);

  // Stream the response
  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    stream: true,
    max_tokens: 400,
    temperature: 0.8,
  });

  // Return a ReadableStream of SSE chunks
  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content ?? "";
          if (token) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
