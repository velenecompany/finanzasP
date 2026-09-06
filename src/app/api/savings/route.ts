import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db, savingsMovements } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select().from(savingsMovements)
    .where(eq(savingsMovements.userId, s.sub)).orderBy(desc(savingsMovements.date));
  const total = rows.reduce((a, m) => a + (m.type === "deposit" ? Number(m.amount) : -Number(m.amount)), 0);
  return NextResponse.json({ total, movements: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = z.object({ type: z.enum(["deposit", "withdrawal"]), amount: z.number().positive(), note: z.string().optional() })
    .safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [row] = await db.insert(savingsMovements).values({
    userId: s.sub, type: p.data.type, amount: p.data.amount.toFixed(2), note: p.data.note ?? null,
  }).returning();
  return NextResponse.json({ movement: row }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await db.delete(savingsMovements).where(and(eq(savingsMovements.id, id), eq(savingsMovements.userId, s.sub)));
  return NextResponse.json({ ok: true });
}
