import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db, users } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const base = req.nextUrl.origin;
  if (!token) return NextResponse.redirect(`${base}/login?verify=error`);

  const [user] = await db.select().from(users)
    .where(and(eq(users.verifyToken, token), gt(users.verifyExpires, new Date())));

  if (!user) return NextResponse.redirect(`${base}/login?verify=expired`);

  await db.update(users).set({ emailVerified: true, verifyToken: null, verifyExpires: null })
    .where(eq(users.id, user.id));

  return NextResponse.redirect(`${base}/dashboard?verify=ok`);
}
