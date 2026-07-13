import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, users, categories, businesses } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  businesses: z.array(z.string().min(1).max(80)).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { name, email, password, businesses: bizNames } = parsed.data;
  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length) return NextResponse.json({ error: "Ese correo ya está registrado" }, { status: 409 });

  const [user] = await db.insert(users).values({ name, email, passwordHash: await hashPassword(password) }).returning();

  const seed = [
    ...DEFAULT_CATEGORIES.income.map((c) => ({ ...c, type: "income" as const })),
    ...DEFAULT_CATEGORIES.expense.map((c) => ({ ...c, type: "expense" as const })),
  ].map((c) => ({ userId: user.id, name: c.name, type: c.type, color: c.color, isDefault: true }));
  await db.insert(categories).values(seed);

  const names = (bizNames ?? []).map((n) => n.trim()).filter(Boolean);
  if (names.length) await db.insert(businesses).values(names.map((n) => ({ userId: user.id, name: n })));

  await createSession({ sub: user.id, role: user.role, email: user.email });
  return NextResponse.json({ ok: true });
}
