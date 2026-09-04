import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db, inventoryPurchases, businesses, vapeProducts } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const bid = req.nextUrl.searchParams.get("businessId");
  if (!bid) return NextResponse.json({ purchases: [] });
  const rows = await db.select().from(inventoryPurchases)
    .where(and(eq(inventoryPurchases.userId, s.sub), eq(inventoryPurchases.businessId, bid)))
    .orderBy(desc(inventoryPurchases.date));
  const prods = await db.select().from(vapeProducts).where(and(eq(vapeProducts.userId, s.sub), eq(vapeProducts.businessId, bid)));
  const purchases = rows.map((p) => {
    const linked = prods.filter((x) => x.purchaseId === p.id);
    const invertido = linked.reduce((a, x) => a + Number(x.investedAmount ?? 0), 0);
    return {
      id: p.id, amount: Number(p.amount), note: p.note, date: p.date,
      invertido, restante: Number(p.amount) - invertido,
      productos: linked.map((x) => ({ name: (x.brand ? x.brand + " " : "") + x.name, invested: Number(x.investedAmount ?? 0) })),
    };
  });
  return NextResponse.json({ purchases });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = z.object({ businessId: z.string().uuid(), amount: z.number().positive(), note: z.string().optional() })
    .safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [b] = await db.select().from(businesses).where(eq(businesses.id, p.data.businessId));
  if (!b || b.userId !== s.sub) return NextResponse.json({ error: "Negocio inválido" }, { status: 403 });
  const [row] = await db.insert(inventoryPurchases).values({
    userId: s.sub, businessId: p.data.businessId, amount: p.data.amount.toFixed(2), note: p.data.note ?? null,
  }).returning();
  return NextResponse.json({ purchase: row }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await db.delete(inventoryPurchases).where(and(eq(inventoryPurchases.id, id), eq(inventoryPurchases.userId, s.sub)));
  return NextResponse.json({ ok: true });
}
