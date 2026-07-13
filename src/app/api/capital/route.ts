import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, capitalMovements, vapeSales, vapeExpenses, businesses } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

async function computeCapital(userId: string, bid: string) {
  const movs = await db.select().from(capitalMovements).where(and(eq(capitalMovements.userId, userId), eq(capitalMovements.businessId, bid)));
  const sales = await db.select().from(vapeSales).where(and(eq(vapeSales.userId, userId), eq(vapeSales.businessId, bid)));
  const exps = await db.select().from(vapeExpenses).where(and(eq(vapeExpenses.userId, userId), eq(vapeExpenses.businessId, bid)));
  const inj = movs.filter((m) => m.type === "injection").reduce((a, m) => a + Number(m.amount), 0);
  const wd = movs.filter((m) => m.type === "withdrawal").reduce((a, m) => a + Number(m.amount), 0);
  const profit = sales.reduce((a, x) => a + Number(x.profit), 0);
  const expense = exps.reduce((a, e) => a + Number(e.amount), 0);
  return { capital: inj - wd + profit - expense, injections: inj, withdrawals: wd, profit, expense, movements: movs };
}

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const bid = req.nextUrl.searchParams.get("businessId");
  if (!bid) return NextResponse.json({ capital: 0, injections: 0, withdrawals: 0, profit: 0, expense: 0, movements: [] });
  const data = await computeCapital(s.sub, bid);
  const movements = [...data.movements].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  return NextResponse.json({ ...data, movements });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = z.object({ businessId: z.string().uuid(), type: z.enum(["injection", "withdrawal"]), amount: z.number().positive(), note: z.string().optional() })
    .safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [b] = await db.select().from(businesses).where(eq(businesses.id, p.data.businessId));
  if (!b || b.userId !== s.sub) return NextResponse.json({ error: "Negocio inválido" }, { status: 403 });
  const [row] = await db.insert(capitalMovements).values({
    userId: s.sub, businessId: p.data.businessId, type: p.data.type, amount: p.data.amount.toFixed(2), note: p.data.note ?? null,
  }).returning();
  return NextResponse.json({ movement: row }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await db.delete(capitalMovements).where(and(eq(capitalMovements.id, id), eq(capitalMovements.userId, s.sub)));
  return NextResponse.json({ ok: true });
}
