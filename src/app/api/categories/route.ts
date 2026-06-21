import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, categories } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const rows = await db.select().from(categories).where(eq(categories.userId, s.sub));
  return NextResponse.json({ categories: rows });
}
