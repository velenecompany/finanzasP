import { NextRequest, NextResponse } from "next/server";
import { desc, eq, asc } from "drizzle-orm";
import { db, aiChatSessions, aiChatMessages } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const sessionId = req.nextUrl.searchParams.get("id");
  if (sessionId) {
    const [sess] = await db.select().from(aiChatSessions).where(eq(aiChatSessions.id, sessionId));
    if (!sess || sess.userId !== s.sub) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    const msgs = await db.select().from(aiChatMessages)
      .where(eq(aiChatMessages.sessionId, sessionId)).orderBy(asc(aiChatMessages.createdAt));
    return NextResponse.json({ messages: msgs });
  }
  const rows = await db.select().from(aiChatSessions)
    .where(eq(aiChatSessions.userId, s.sub)).orderBy(desc(aiChatSessions.createdAt));
  return NextResponse.json({ sessions: rows });
}

export async function POST() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const [row] = await db.insert(aiChatSessions).values({ userId: s.sub }).returning();
  return NextResponse.json({ session: row }, { status: 201 });
}
