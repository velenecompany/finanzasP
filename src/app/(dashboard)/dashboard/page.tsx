import { and, eq, gte } from "drizzle-orm";
import { db, transactions, users } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session!.sub;

  const start = new Date();
  start.setDate(1); start.setHours(0, 0, 0, 0);

  const rows = await db.select().from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.date, start)));
  const [u] = await db.select().from(users).where(eq(users.id, userId));

  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
  const lastIncome = rows.filter((r) => r.type === "income").sort((a, b) => +b.date - +a.date)[0];

  return (
    <DashboardClient
      personal={income - expense}
      income={income}
      expense={expense}
      lastIncome={lastIncome ? Number(lastIncome.amount) : 0}
      split={{ expenses: u.splitExpenses, goals: u.splitGoals, debts: u.splitDebts }}
    />
  );
}
