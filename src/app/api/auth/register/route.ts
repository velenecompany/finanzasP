import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users, categories, businesses } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { makeToken, inHours } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

const passwordRule = z.string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[a-zA-Z]/, "Debe incluir al menos una letra")
  .regex(/[0-9]/, "Debe incluir al menos un número");

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: passwordRule,
  businesses: z.array(z.string().min(1).max(80)).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { name, email, password, businesses: bizNames } = parsed.data;
  const normEmail = email.toLowerCase().trim();
  const existing = await db.select().from(users).where(eq(users.email, normEmail));
  if (existing.length) return NextResponse.json({ error: "Ese correo ya está registrado" }, { status: 409 });

  const verifyToken = makeToken();
  const [user] = await db.insert(users).values({
    name, email: normEmail, passwordHash: await hashPassword(password),
    verifyToken, verifyExpires: inHours(24),
  }).returning();

  const seed = [
    ...DEFAULT_CATEGORIES.income.map((c) => ({ ...c, type: "income" as const })),
    ...DEFAULT_CATEGORIES.expense.map((c) => ({ ...c, type: "expense" as const })),
  ].map((c) => ({ userId: user.id, name: c.name, type: c.type, color: c.color, isDefault: true }));
  await db.insert(categories).values(seed);

  const names = (bizNames ?? []).map((n) => n.trim()).filter(Boolean);
  if (names.length) await db.insert(businesses).values(names.map((n) => ({ userId: user.id, name: n })));

  try { await sendVerificationEmail(normEmail, name, verifyToken); }
  catch (e) { console.error("[register] no se pudo enviar verificación:", e); }

  await createSession({ sub: user.id, role: user.role, email: user.email });
  return NextResponse.json({ ok: true });
}
