import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, budgets, categories, transactions } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);

  const rows = await db.select({
    id: budgets.id, limit: budgets.limit, categoryId: budgets.categoryId,
    categoryName: categories.name, color: categories.color,
  }).from(budgets)
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .where(eq(budgets.userId, s.sub));

  const spent = await db.select({
    categoryId: transactions.categoryId,
    total: sql<string>`sum(${transactions.amount})`,
  }).from(transactions)
    .where(and(eq(transactions.userId, s.sub), eq(transactions.type, "expense"), gte(transactions.date, start)))
    .groupBy(transactions.categoryId);

  const spentMap = new Map(spent.map((r) => [r.categoryId, Number(r.total)]));
  return NextResponse.json({
    budgets: rows.map((b) => ({ ...b, limit: Number(b.limit), spent: spentMap.get(b.categoryId) ?? 0 })),
  });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = z.object({ categoryId: z.string().uuid(), limit: z.number().positive() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [row] = await db.insert(budgets).values({
    userId: s.sub, categoryId: parsed.data.categoryId, limit: parsed.data.limit.toFixed(2),
  }).returning();
  return NextResponse.json({ budget: row }, { status: 201 });
}
