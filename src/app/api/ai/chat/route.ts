export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, aiChatSessions, aiChatMessages } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { SYSTEM_PROMPT, GROQ_MODEL } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return new Response("No autorizado", { status: 401 });
  const { sessionId, message } = await req.json();
  if (!process.env.GROQ_API_KEY)
    return new Response("Falta GROQ_API_KEY", { status: 500 });

  const history = sessionId
    ? await db.select().from(aiChatMessages).where(eq(aiChatMessages.sessionId, sessionId))
    : [];

  if (sessionId) {
    await db.insert(aiChatMessages).values({ sessionId, role: "user", content: message });
    if (history.length === 0)
      await db.update(aiChatSessions).set({ title: message.slice(0, 60) }).where(eq(aiChatSessions.id, sessionId));
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, stream: true, temperature: 0.6 }),
  });

  if (!groqRes.ok || !groqRes.body) {
    const t = await groqRes.text();
    return new Response("Error con Groq: " + t, { status: 500 });
  }

  let full = "";
  const stream = new ReadableStream({
    async start(controller) {
      const reader = groqRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const data = t.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content;
            if (delta) { full += delta; controller.enqueue(new TextEncoder().encode(delta)); }
          } catch {}
        }
      }
      if (sessionId && full)
        await db.insert(aiChatMessages).values({ sessionId, role: "assistant", content: full });
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}