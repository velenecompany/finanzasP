import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db, vapeExpenses, businesses } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const bid = req.nextUrl.searchParams.get("businessId");
  if (!bid) return NextResponse.json({ expenses: [] });
  const rows = await db.select().from(vapeExpenses)
    .where(and(eq(vapeExpenses.userId, s.sub), eq(vapeExpenses.businessId, bid)))
    .orderBy(desc(vapeExpenses.date)).limit(100);
  return NextResponse.json({ expenses: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = z.object({ businessId: z.string().uuid(), concept: z.string().min(1), amount: z.number().positive() })
    .safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [row] = await db.insert(vapeExpenses).values({
    userId: s.sub, businessId: p.data.businessId, concept: p.data.concept, amount: p.data.amount.toFixed(2),
  }).returning();
  return NextResponse.json({ expense: row }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await db.delete(vapeExpenses).where(and(eq(vapeExpenses.id, id), eq(vapeExpenses.userId, s.sub)));
  return NextResponse.json({ ok: true });
}
