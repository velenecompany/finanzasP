import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, creditCards } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select().from(creditCards).where(eq(creditCards.userId, s.sub));
  return NextResponse.json({ cards: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = z.object({
    name: z.string().min(1), creditLimit: z.number().positive(),
    cutoffDay: z.number().min(1).max(31).optional(), paymentDay: z.number().min(1).max(31).optional(),
  }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const d = parsed.data;
  const [row] = await db.insert(creditCards).values({
    userId: s.sub, name: d.name, creditLimit: d.creditLimit.toFixed(2),
    cutoffDay: d.cutoffDay ?? null, paymentDay: d.paymentDay ?? null,
  }).returning();
  return NextResponse.json({ card: row }, { status: 201 });
}
