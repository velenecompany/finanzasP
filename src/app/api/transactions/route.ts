import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db, transactions, settings } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { mergePrefs, DEFAULT_PREFS } from "@/lib/settings";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  category: z.string().max(120).optional(),
  description: z.string().optional(),
  date: z.string().optional(),
});

// Ajusta el efectivo personal: +ingreso / −egreso (delta ya con signo)
async function adjustCash(userId: string, delta: number) {
  const [row] = await db.select().from(settings).where(eq(settings.userId, userId));
  const prefs = row ? mergePrefs(row.prefs) : DEFAULT_PREFS;
  const next = { ...prefs, personalCash: Math.max(0, Number(prefs.personalCash) + delta) };
  await db.insert(settings).values({ userId, prefs: next })
    .onConflictDoUpdate({ target: settings.userId, set: { prefs: next } });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select().from(transactions)
    .where(eq(transactions.userId, session.sub)).orderBy(desc(transactions.date));
  return NextResponse.json({ transactions: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const { type, amount, category, description, date } = parsed.data;
  const [row] = await db.insert(transactions).values({
    userId: session.sub, type, amount: amount.toFixed(2),
    categoryName: category?.trim() || null,
    description: description ?? null, date: date ? new Date(date) : new Date(),
  }).returning();
  // El movimiento mueve el efectivo personal (los negocios NO se tocan)
  await adjustCash(session.sub, type === "income" ? amount : -amount);
  return NextResponse.json({ transaction: row }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  // Leer el movimiento para revertir su efecto en el efectivo
  const [tx] = await db.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, session.sub)));
  if (!tx) return NextResponse.json({ ok: true });
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, session.sub)));
  await adjustCash(session.sub, tx.type === "income" ? -Number(tx.amount) : Number(tx.amount));
  return NextResponse.json({ ok: true });
}
