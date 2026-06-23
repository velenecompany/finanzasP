import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, vapeProducts } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

const biz = (v: string | null) => (v === "velene" ? "velene" : "vapes") as "vapes" | "velene";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const b = biz(req.nextUrl.searchParams.get("business"));
  const rows = await db.select().from(vapeProducts)
    .where(and(eq(vapeProducts.userId, s.sub), eq(vapeProducts.business, b)));
  return NextResponse.json({ products: rows });
}

const schema = z.object({
  name: z.string().min(1), brand: z.string().optional(), flavor: z.string().optional(),
  stock: z.number().int().min(0), unitCost: z.number().min(0),
  priceRetail: z.number().min(0), priceWholesale: z.number().min(0),
  business: z.enum(["vapes", "velene"]).default("vapes"),
});

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const d = p.data;
  const [row] = await db.insert(vapeProducts).values({
    userId: s.sub, business: d.business, name: d.name, brand: d.brand ?? null, flavor: d.flavor ?? null,
    stock: d.stock, unitCost: d.unitCost.toFixed(2),
    priceRetail: d.priceRetail.toFixed(2), priceWholesale: d.priceWholesale.toFixed(2),
  }).returning();
  return NextResponse.json({ product: row }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = z.object({ id: z.string().uuid(), addStock: z.number().int() }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [prod] = await db.select().from(vapeProducts).where(eq(vapeProducts.id, p.data.id));
  if (!prod || prod.userId !== s.sub) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const [row] = await db.update(vapeProducts).set({ stock: Math.max(0, prod.stock + p.data.addStock) })
    .where(eq(vapeProducts.id, prod.id)).returning();
  return NextResponse.json({ product: row });
}

export async function DELETE(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await db.delete(vapeProducts).where(and(eq(vapeProducts.id, id), eq(vapeProducts.userId, s.sub)));
  return NextResponse.json({ ok: true });
}
