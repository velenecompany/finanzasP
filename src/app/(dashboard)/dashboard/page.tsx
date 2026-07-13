import { and, asc, eq, gte } from "drizzle-orm";
import { db, transactions, vapeSales, vapeExpenses, capitalMovements, settings, businesses } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { mergePrefs, DEFAULT_PREFS } from "@/lib/settings";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session!.sub;

  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const rows = await db.select().from(transactions).where(and(eq(transactions.userId, userId), gte(transactions.date, start)));
  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
  const lastIncome = rows.filter((r) => r.type === "income").sort((a, b) => +b.date - +a.date)[0];

  // capital por negocio
  const biz = await db.select().from(businesses).where(eq(businesses.userId, userId)).orderBy(asc(businesses.createdAt));
  const [allSales, allExps, allCaps] = await Promise.all([
    db.select().from(vapeSales).where(eq(vapeSales.userId, userId)),
    db.select().from(vapeExpenses).where(eq(vapeExpenses.userId, userId)),
    db.select().from(capitalMovements).where(eq(capitalMovements.userId, userId)),
  ]);
  const bizData = biz.map((b) => {
    const profit = allSales.filter((x) => x.businessId === b.id).reduce((a, x) => a + Number(x.profit), 0);
    const exp = allExps.filter((x) => x.businessId === b.id).reduce((a, x) => a + Number(x.amount), 0);
    const inj = allCaps.filter((x) => x.businessId === b.id && x.type === "injection").reduce((a, x) => a + Number(x.amount), 0);
    const wd = allCaps.filter((x) => x.businessId === b.id && x.type === "withdrawal").reduce((a, x) => a + Number(x.amount), 0);
    return { id: b.id, name: b.name, capital: inj - wd + profit - exp };
  });

  const [setRow] = await db.select().from(settings).where(eq(settings.userId, userId));
  const prefs = setRow ? mergePrefs(setRow.prefs) : DEFAULT_PREFS;

  return (
    <DashboardClient
      businesses={bizData}
      income={income}
      expense={expense}
      lastIncome={lastIncome ? Number(lastIncome.amount) : 0}
      prefs={prefs}
    />
  );
}
