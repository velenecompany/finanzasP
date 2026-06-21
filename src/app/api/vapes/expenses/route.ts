import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, vapeExpenses } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select().from(vapeExpenses).where(eq(vapeExpenses.userId, s.sub))
    .orderBy(desc(vapeExpenses.date)).limit(100);
  return NextResponse.json({ expenses: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = z.object({ concept: z.string().min(1), amount: z.number().positive(), date: z.string().optional() })
    .safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [row] = await db.insert(vapeExpenses).values({
    userId: s.sub, concept: p.data.concept, amount: p.data.amount.toFixed(2),
    date: p.data.date ? new Date(p.data.date) : new Date(),
  }).returning();
  return NextResponse.json({ expense: row }, { status: 201 });
}
