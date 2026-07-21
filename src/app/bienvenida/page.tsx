import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import OnboardingClient from "@/components/OnboardingClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await getSession();
  if (!s) redirect("/login");
  const [u] = await db.select({ name: users.name, onboarded: users.onboarded }).from(users).where(eq(users.id, s.sub));
  if (u?.onboarded) redirect("/dashboard");
  return <OnboardingClient name={u?.name ?? ""} />;
}
