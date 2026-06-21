import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db, transactions } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive(),
  category: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, session.sub))
    .orderBy(desc(transactions.date));
  return NextResponse.json({ transactions: rows });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { type, amount, description, date } = parsed.data;
  const [row] = await db
    .insert(transactions)
    .values({
      userId: session.sub,
      type,
      amount: amount.toFixed(2),
      description: description ?? null,
      date: date ? new Date(date) : new Date(),
    })
    .returning();

  return NextResponse.json({ transaction: row }, { status: 201 });
}
