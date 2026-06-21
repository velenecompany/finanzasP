import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users, categories } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { name, email, password } = parsed.data;
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length)
    return NextResponse.json({ error: "Ese correo ya está registrado" }, { status: 409 });

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password) })
    .returning();

  // categorías por defecto
  const seed = [
    ...DEFAULT_CATEGORIES.income.map((c) => ({ ...c, type: "income" as const })),
    ...DEFAULT_CATEGORIES.expense.map((c) => ({ ...c, type: "expense" as const })),
  ].map((c) => ({ userId: user.id, name: c.name, type: c.type, color: c.color, isDefault: true }));
  await db.insert(categories).values(seed);

  await createSession({ sub: user.id, role: user.role, email: user.email });
  return NextResponse.json({ ok: true });
}
