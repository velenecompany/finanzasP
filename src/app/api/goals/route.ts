import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, financialGoals } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select().from(financialGoals).where(eq(financialGoals.userId, s.sub));
  return NextResponse.json({ goals: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = z.object({
    name: z.string().min(1), targetAmount: z.number().positive(),
    targetDate: z.string().optional(), priority: z.number().min(1).max(3).default(2),
  }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const d = parsed.data;
  const [row] = await db.insert(financialGoals).values({
    userId: s.sub, name: d.name, targetAmount: d.targetAmount.toFixed(2),
    targetDate: d.targetDate ? new Date(d.targetDate) : null, priority: d.priority,
  }).returning();
  return NextResponse.json({ goal: row }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = z.object({ id: z.string().uuid(), addAmount: z.number() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [g] = await db.select().from(financialGoals).where(eq(financialGoals.id, parsed.data.id));
  if (!g || g.userId !== s.sub) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const next = (Number(g.currentAmount) + parsed.data.addAmount).toFixed(2);
  const [row] = await db.update(financialGoals).set({ currentAmount: next })
    .where(eq(financialGoals.id, g.id)).returning();
  return NextResponse.json({ goal: row });
}
