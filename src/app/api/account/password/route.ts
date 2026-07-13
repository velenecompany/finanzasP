import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export async function PATCH(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const p = z.object({ current: z.string().min(1), next: z.string().min(8) }).safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "La nueva contraseña debe tener mínimo 8 caracteres" }, { status: 400 });
  const [u] = await db.select().from(users).where(eq(users.id, s.sub));
  if (!u) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const ok = await verifyPassword(p.data.current, u.passwordHash);
  if (!ok) return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 400 });
  await db.update(users).set({ passwordHash: await hashPassword(p.data.next) }).where(eq(users.id, s.sub));
  return NextResponse.json({ ok: true });
}
