import { and, eq, gte } from "drizzle-orm";
import { db, transactions, vapeSales, vapeExpenses, capitalMovements, settings } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { mergePrefs, DEFAULT_PREFS } from "@/lib/settings";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

async function capitalFor(userId: string, b: "vapes" | "velene") {
  const movs = await db.select().from(capitalMovements).where(and(eq(capitalMovements.userId, userId), eq(capitalMovements.business, b)));
  const sales = await db.select().from(vapeSales).where(and(eq(vapeSales.userId, userId), eq(vapeSales.business, b)));
  const exps = await db.select().from(vapeExpenses).where(and(eq(vapeExpenses.userId, userId), eq(vapeExpenses.business, b)));
  const inj = movs.filter((m) => m.type === "injection").reduce((a, m) => a + Number(m.amount), 0);
  const wd = movs.filter((m) => m.type === "withdrawal").reduce((a, m) => a + Number(m.amount), 0);
  const profit = sales.reduce((a, s) => a + Number(s.profit), 0);
  const expense = exps.reduce((a, e) => a + Number(e.amount), 0);
  return inj - wd + profit - expense;
}

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session!.sub;

  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const rows = await db.select().from(transactions).where(and(eq(transactions.userId, userId), gte(transactions.date, start)));
  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
  const lastIncome = rows.filter((r) => r.type === "income").sort((a, b) => +b.date - +a.date)[0];

  const [vapesCapital, veleneCapital] = await Promise.all([capitalFor(userId, "vapes"), capitalFor(userId, "velene")]);
  const [setRow] = await db.select().from(settings).where(eq(settings.userId, userId));
  const prefs = setRow ? mergePrefs(setRow.prefs) : DEFAULT_PREFS;

  return (
    <DashboardClient
      vapesCapital={vapesCapital}
      veleneCapital={veleneCapital}
      income={income}
      expense={expense}
      lastIncome={lastIncome ? Number(lastIncome.amount) : 0}
      prefs={prefs}
    />
  );
}
