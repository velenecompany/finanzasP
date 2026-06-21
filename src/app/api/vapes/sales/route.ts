import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db, vapeProducts, vapeSales } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select({
    id: vapeSales.id, quantity: vapeSales.quantity, unitPrice: vapeSales.unitPrice,
    profit: vapeSales.profit, saleType: vapeSales.saleType, date: vapeSales.date,
    productName: vapeProducts.name, flavor: vapeProducts.flavor,
  }).from(vapeSales)
    .leftJoin(vapeProducts, eq(vapeSales.productId, vapeProducts.id))
    .where(eq(vapeSales.userId, s.sub)).orderBy(desc(vapeSales.date)).limit(100);
  return NextResponse.json({ sales: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = z.object({
    productId: z.string().uuid(), quantity: z.number().int().positive(),
    saleType: z.enum(["menudeo", "mayoreo"]),
  }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [prod] = await db.select().from(vapeProducts).where(eq(vapeProducts.id, p.data.productId));
  if (!prod || prod.userId !== s.sub) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  if (prod.stock < p.data.quantity)
    return NextResponse.json({ error: `Stock insuficiente (disponible: ${prod.stock})` }, { status: 400 });

  const unitPrice = p.data.saleType === "menudeo" ? Number(prod.priceRetail) : Number(prod.priceWholesale);
  const profit = (unitPrice - Number(prod.unitCost)) * p.data.quantity;

  const [sale] = await db.insert(vapeSales).values({
    userId: s.sub, productId: prod.id, quantity: p.data.quantity,
    unitPrice: unitPrice.toFixed(2), profit: profit.toFixed(2), saleType: p.data.saleType,
  }).returning();
  await db.update(vapeProducts).set({ stock: prod.stock - p.data.quantity }).where(eq(vapeProducts.id, prod.id));
  return NextResponse.json({ sale }, { status: 201 });
}
