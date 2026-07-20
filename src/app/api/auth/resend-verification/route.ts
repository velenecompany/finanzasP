import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { makeToken, inHours } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/email";

export async function POST() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const [user] = await db.select().from(users).where(eq(users.id, s.sub));
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, already: true });

  const verifyToken = makeToken();
  await db.update(users).set({ verifyToken, verifyExpires: inHours(24) }).where(eq(users.id, user.id));
  try { await sendVerificationEmail(user.email, user.name, verifyToken); }
  catch (e) { return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
