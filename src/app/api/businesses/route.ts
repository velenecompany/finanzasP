import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { db, businesses } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select().from(businesses).where(eq(businesses.userId, s.sub)).orderBy(asc(businesses.createdAt));
  return NextResponse.json({ businesses: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = z.object({ name: z.string().min(1).max(80) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  const [row] = await db.insert(businesses).values({ userId: s.sub, name: p.data.name.trim() }).returning();
  return NextResponse.json({ business: row }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = z.object({ id: z.string().uuid(), name: z.string().min(1).max(80) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const [b] = await db.select().from(businesses).where(eq(businesses.id, p.data.id));
  if (!b || b.userId !== s.sub) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const [row] = await db.update(businesses).set({ name: p.data.name.trim() }).where(eq(businesses.id, p.data.id)).returning();
  return NextResponse.json({ business: row });
}

export async function DELETE(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await db.delete(businesses).where(and(eq(businesses.id, id), eq(businesses.userId, s.sub)));
  return NextResponse.json({ ok: true });
}
