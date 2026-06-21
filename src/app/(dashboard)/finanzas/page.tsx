import { desc, eq } from "drizzle-orm";
import { db, transactions } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import FinanzasClient from "@/components/FinanzasClient";

export const dynamic = "force-dynamic";

export default async function FinanzasPage() {
  const session = await getSession();
  const rows = await db.select().from(transactions)
    .where(eq(transactions.userId, session!.sub))
    .orderBy(desc(transactions.date));

  const data = rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    description: r.description ?? "",
    date: typeof r.date === "string" ? r.date : r.date.toISOString(),
  }));

  return <FinanzasClient transactions={data} />;
}
