import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, debts } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select().from(debts).where(eq(debts.userId, s.sub));
  return NextResponse.json({ debts: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = z.object({
    creditor: z.string().min(1), totalAmount: z.number().positive(),
    interestRate: z.number().min(0).default(0), dueDate: z.string().optional(),
  }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const d = parsed.data;
  const [row] = await db.insert(debts).values({
    userId: s.sub, creditor: d.creditor, totalAmount: d.totalAmount.toFixed(2),
    remaining: d.totalAmount.toFixed(2), interestRate: d.interestRate.toFixed(2),
    dueDate: d.dueDate ? new Date(d.dueDate) : null,
  }).returning();
  return NextResponse.json({ debt: row }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = z.object({ id: z.string().uuid(), payment: z.number().positive() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [d] = await db.select().from(debts).where(eq(debts.id, parsed.data.id));
  if (!d || d.userId !== s.sub) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const next = Math.max(0, Number(d.remaining) - parsed.data.payment).toFixed(2);
  const [row] = await db.update(debts).set({ remaining: next }).where(eq(debts.id, d.id)).returning();
  return NextResponse.json({ debt: row });
}
