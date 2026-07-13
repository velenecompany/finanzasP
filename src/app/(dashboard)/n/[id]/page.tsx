import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, businesses } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import BusinessModule from "@/components/BusinessModule";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  const s = await getSession();
  if (!s) redirect("/login");
  const [b] = await db.select().from(businesses).where(eq(businesses.id, params.id));
  if (!b || b.userId !== s.sub) redirect("/dashboard");
  return <BusinessModule businessId={b.id} title={b.name} subtitle="Inventario, ventas, capital y utilidades" />;
}
