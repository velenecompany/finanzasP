import { and, eq, gte } from "drizzle-orm";
import {
  db, businesses, vapeSales, vapeExpenses, capitalMovements, transactions,
  debts, creditCards, settings, financialProfile, alerts, users,
} from "@/lib/db";
import { mergePrefs, DEFAULT_PREFS } from "@/lib/settings";

// Cada handler recibe el userId de la SESIÓN (nunca del modelo).

async function readFinances(userId: string) {
  const biz = await db.select().from(businesses).where(eq(businesses.userId, userId));
  const [sales, exps, caps] = await Promise.all([
    db.select().from(vapeSales).where(eq(vapeSales.userId, userId)),
    db.select().from(vapeExpenses).where(eq(vapeExpenses.userId, userId)),
    db.select().from(capitalMovements).where(eq(capitalMovements.userId, userId)),
  ]);
  const businessesOut = biz.map((b) => {
    const profit = sales.filter((x) => x.businessId === b.id).reduce((a, x) => a + Number(x.profit), 0);
    const exp = exps.filter((x) => x.businessId === b.id).reduce((a, x) => a + Number(x.amount), 0);
    const inj = caps.filter((x) => x.businessId === b.id && x.type === "injection").reduce((a, x) => a + Number(x.amount), 0);
    const wd = caps.filter((x) => x.businessId === b.id && x.type === "withdrawal").reduce((a, x) => a + Number(x.amount), 0);
    return { name: b.name, capital: inj - wd + profit - exp };
  });
  const totalCapital = businessesOut.reduce((a, b) => a + b.capital, 0);

  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const txs = await db.select().from(transactions).where(and(eq(transactions.userId, userId), gte(transactions.date, start)));
  const monthIncome = txs.filter((t) => t.type === "income").reduce((a, t) => a + Number(t.amount), 0);
  const monthExpense = txs.filter((t) => t.type === "expense").reduce((a, t) => a + Number(t.amount), 0);

  const debtRows = await db.select().from(debts).where(eq(debts.userId, userId));
  const cardRows = await db.select().from(creditCards).where(eq(creditCards.userId, userId));
  const [setRow] = await db.select().from(settings).where(eq(settings.userId, userId));
  const prefs = setRow ? mergePrefs(setRow.prefs) : DEFAULT_PREFS;
  const monthlyFixed = prefs.fixed.carro + prefs.fixed.gasolina + prefs.fixed.comida;

  return {
    businesses: businessesOut,
    totalCapital,
    mesActual: { ingresos: monthIncome, gastos: monthExpense, balance: monthIncome - monthExpense },
    deudas: debtRows.map((d) => ({ acreedor: d.creditor, saldo: Number(d.remaining), tasa: Number(d.interestRate ?? 0) })),
    tarjetas: cardRows.map((c) => ({ nombre: c.name, limite: Number(c.creditLimit), saldo: Number(c.currentBalance) })),
    gastosFijosMensuales: { ...prefs.fixed, total: monthlyFixed },
    reparto: prefs.splits,
  };
}

async function mergeSettings(userId: string, patch: any) {
  const [row] = await db.select().from(settings).where(eq(settings.userId, userId));
  const current = row ? mergePrefs(row.prefs) : DEFAULT_PREFS;
  const next = { ...current, ...patch, fixed: { ...current.fixed, ...(patch.fixed ?? {}) }, splits: { ...current.splits, ...(patch.splits ?? {}) } };
  await db.insert(settings).values({ userId, prefs: next }).onConflictDoUpdate({ target: settings.userId, set: { prefs: next } });
  return next;
}

export async function runTool(name: string, input: any, userId: string): Promise<any> {
  switch (name) {
    case "get_user_finances":
      return await readFinances(userId);

    case "get_financial_profile": {
      const [p] = await db.select().from(financialProfile).where(eq(financialProfile.userId, userId));
      return p ?? { exists: false };
    }

    case "save_financial_profile": {
      const v = input ?? {};
      const values = {
        userId,
        liquidCapital: String(v.liquid_capital ?? 0), tiedCapital: String(v.tied_capital ?? 0),
        totalDebt: String(v.total_debt ?? 0), debtDetail: v.debt_detail ?? null,
        monthlyIncome: String(v.monthly_income ?? 0), monthlyExpenses: String(v.monthly_expenses ?? 0),
        incomePredictability: v.income_predictability ?? null, incomeSources: v.income_sources ?? 1,
        mainSourceDependency: v.main_source_dependency ?? 100, cushionMonths: String(v.cushion_months ?? 0),
        cushionSeparated: !!v.cushion_separated, reinvestRate: v.reinvest_rate ?? 0,
        goal1y: v.goal_1y ?? null, goal3y: v.goal_3y ?? null, riskProfile: v.risk_profile ?? null,
        completedAt: new Date(), updatedAt: new Date(),
      };
      await db.insert(financialProfile).values(values)
        .onConflictDoUpdate({ target: financialProfile.userId, set: { ...values, userId: undefined } as any });
      return { ok: true };
    }

    case "update_fixed_expenses": {
      const next = await mergeSettings(userId, { fixed: { carro: Number(input.carro) || 0, gasolina: Number(input.gasolina) || 0, comida: Number(input.comida) || 0 } });
      return { ok: true, fixed: next.fixed };
    }

    case "update_split": {
      const c = Math.round(Number(input.colchon) || 0), r = Math.round(Number(input.reinversion) || 0), l = Math.round(Number(input.libre) || 0);
      if (c + r + l !== 100) return { ok: false, error: "Los porcentajes deben sumar 100" };
      const next = await mergeSettings(userId, { splits: { colchon: c, reinversion: r, libre: l } });
      return { ok: true, splits: next.splits };
    }

    case "create_business": {
      const nm = String(input.name ?? "").trim();
      if (!nm) return { ok: false, error: "Falta el nombre" };
      const [b] = await db.insert(businesses).values({ userId, name: nm }).returning();
      return { ok: true, id: b.id, name: b.name };
    }

    case "create_alert": {
      await db.insert(alerts).values({
        userId, severity: input.severity, type: input.type,
        title: String(input.title).slice(0, 160), message: String(input.message),
      });
      return { ok: true };
    }

    case "complete_onboarding": {
      await db.update(users).set({ onboarded: true }).where(eq(users.id, userId));
      return { ok: true };
    }

    default:
      return { error: `Tool desconocida: ${name}` };
  }
}
