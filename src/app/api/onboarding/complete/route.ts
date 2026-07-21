import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function POST() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await db.update(users).set({ onboarded: true }).where(eq(users.id, s.sub));
  return NextResponse.json({ ok: true });
}
