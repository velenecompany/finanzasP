import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, alerts } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select().from(alerts)
    .where(and(eq(alerts.userId, s.sub), eq(alerts.dismissed, false)))
    .orderBy(desc(alerts.createdAt));
  return NextResponse.json({ alerts: rows });
}

export async function PATCH(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await db.update(alerts).set({ dismissed: true }).where(and(eq(alerts.id, id), eq(alerts.userId, s.sub)));
  return NextResponse.json({ ok: true });
}
