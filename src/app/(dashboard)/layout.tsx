import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, session.sub));

  return (
    <div className="grid md:grid-cols-[248px_1fr] min-h-screen">
      <Sidebar name={user?.name ?? "Usuario"} />
      <main className="min-w-0 flex flex-col">{children}</main>
    </div>
  );
}
