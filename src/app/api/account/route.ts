import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const [u] = await db.select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt }).from(users).where(eq(users.id, s.sub));
  return NextResponse.json({ user: u });
}

export async function PATCH(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = z.object({ name: z.string().min(2).max(120) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  await db.update(users).set({ name: p.data.name.trim() }).where(eq(users.id, s.sub));
  return NextResponse.json({ ok: true });
}
