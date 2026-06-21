import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, creditCards, creditCardTransactions } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = z.object({
    cardId: z.string().uuid(), type: z.enum(["charge", "payment"]),
    amount: z.number().positive(), description: z.string().optional(),
  }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const d = parsed.data;
  const [card] = await db.select().from(creditCards).where(eq(creditCards.id, d.cardId));
  if (!card || card.userId !== s.sub) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const [tx] = await db.insert(creditCardTransactions).values({
    cardId: d.cardId, type: d.type, amount: d.amount.toFixed(2), description: d.description ?? null,
  }).returning();
  const delta = d.type === "charge" ? d.amount : -d.amount;
  const nextBalance = Math.max(0, Number(card.currentBalance) + delta).toFixed(2);
  await db.update(creditCards).set({ currentBalance: nextBalance }).where(eq(creditCards.id, card.id));
  return NextResponse.json({ transaction: tx }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const cardId = req.nextUrl.searchParams.get("cardId");
  if (!cardId) return NextResponse.json({ transactions: [] });
  const rows = await db.select().from(creditCardTransactions)
    .where(eq(creditCardTransactions.cardId, cardId)).orderBy(desc(creditCardTransactions.date)).limit(30);
  return NextResponse.json({ transactions: rows });
}

export async function DELETE(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const [tx] = await db.select().from(creditCardTransactions).where(eq(creditCardTransactions.id, id));
  if (!tx) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const [card] = await db.select().from(creditCards).where(eq(creditCards.id, tx.cardId));
  if (!card || card.userId !== s.sub) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  // revertir el efecto en el saldo
  const delta = tx.type === "charge" ? -Number(tx.amount) : Number(tx.amount);
  const nextBalance = Math.max(0, Number(card.currentBalance) + delta).toFixed(2);
  await db.update(creditCards).set({ currentBalance: nextBalance }).where(eq(creditCards.id, card.id));
  await db.delete(creditCardTransactions).where(eq(creditCardTransactions.id, id));
  return NextResponse.json({ ok: true });
}
