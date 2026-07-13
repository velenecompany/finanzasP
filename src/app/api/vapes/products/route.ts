import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, vapeProducts, businesses } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

async function owns(userId: string, businessId: string) {
  const [b] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  return b && b.userId === userId;
}

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const bid = req.nextUrl.searchParams.get("businessId");
  if (!bid) return NextResponse.json({ products: [] });
  const rows = await db.select().from(vapeProducts).where(and(eq(vapeProducts.userId, s.sub), eq(vapeProducts.businessId, bid)));
  return NextResponse.json({ products: rows });
}

const schema = z.object({
  businessId: z.string().uuid(), name: z.string().min(1), brand: z.string().optional(), flavor: z.string().optional(),
  stock: z.number().int().min(0), unitCost: z.number().min(0), priceRetail: z.number().min(0), priceWholesale: z.number().min(0),
});

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  if (!(await owns(s.sub, p.data.businessId))) return NextResponse.json({ error: "Negocio inválido" }, { status: 403 });
  const d = p.data;
  const [row] = await db.insert(vapeProducts).values({
    userId: s.sub, businessId: d.businessId, name: d.name, brand: d.brand ?? null, flavor: d.flavor ?? null,
    stock: d.stock, unitCost: d.unitCost.toFixed(2), priceRetail: d.priceRetail.toFixed(2), priceWholesale: d.priceWholesale.toFixed(2),
  }).returning();
  return NextResponse.json({ product: row }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await db.delete(vapeProducts).where(and(eq(vapeProducts.id, id), eq(vapeProducts.userId, s.sub)));
  return NextResponse.json({ ok: true });
}
