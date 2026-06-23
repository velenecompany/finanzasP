import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db, capitalMovements, vapeSales, vapeExpenses } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

const biz = (v: string | null) => (v === "velene" ? "velene" : "vapes") as "vapes" | "velene";

/** Capital = inyecciones − retiros + utilidad de ventas − gastos */
async function computeCapital(userId: string, b: "vapes" | "velene") {
  const movs = await db.select().from(capitalMovements)
    .where(and(eq(capitalMovements.userId, userId), eq(capitalMovements.business, b)));
  const sales = await db.select().from(vapeSales)
    .where(and(eq(vapeSales.userId, userId), eq(vapeSales.business, b)));
  const exps = await db.select().from(vapeExpenses)
    .where(and(eq(vapeExpenses.userId, userId), eq(vapeExpenses.business, b)));
  const inj = movs.filter((m) => m.type === "injection").reduce((a, m) => a + Number(m.amount), 0);
  const wd = movs.filter((m) => m.type === "withdrawal").reduce((a, m) => a + Number(m.amount), 0);
  const profit = sales.reduce((a, s) => a + Number(s.profit), 0);
  const expense = exps.reduce((a, e) => a + Number(e.amount), 0);
  return { capital: inj - wd + profit - expense, injections: inj, withdrawals: wd, profit, expense, movements: movs };
}

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const b = biz(req.nextUrl.searchParams.get("business"));
  const data = await computeCapital(s.sub, b);
  const movements = [...data.movements].sort((a, b2) => +new Date(b2.date) - +new Date(a.date));
  return NextResponse.json({ ...data, movements });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = z.object({
    business: z.enum(["vapes", "velene"]), type: z.enum(["injection", "withdrawal"]),
    amount: z.number().positive(), note: z.string().optional(),
  }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [row] = await db.insert(capitalMovements).values({
    userId: s.sub, business: p.data.business, type: p.data.type,
    amount: p.data.amount.toFixed(2), note: p.data.note ?? null,
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
