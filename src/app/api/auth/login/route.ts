import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email));
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash)))
    return NextResponse.json({ error: "Correo o contraseña incorrectos" }, { status: 401 });

  await createSession({ sub: user.id, role: user.role, email: user.email });
  return NextResponse.json({ ok: true });
}
