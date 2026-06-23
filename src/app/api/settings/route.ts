import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, settings } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { mergePrefs, DEFAULT_PREFS } from "@/lib/settings";

export async function GET() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const [row] = await db.select().from(settings).where(eq(settings.userId, s.sub));
  return NextResponse.json({ prefs: row ? mergePrefs(row.prefs) : DEFAULT_PREFS });
}

export async function PUT(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const prefs = mergePrefs(body);
  await db.insert(settings).values({ userId: s.sub, prefs })
    .onConflictDoUpdate({ target: settings.userId, set: { prefs } });
  return NextResponse.json({ prefs });
}
