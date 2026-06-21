export function formatMXN(value: number | string): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(isNaN(n) ? 0 : n);
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

/** Distribuye un ingreso según los porcentajes (deben sumar 100). */
export function distributeIncome(
  amount: number,
  split: { expenses: number; goals: number; debts: number }
) {
  return {
    expenses: (amount * split.expenses) / 100,
    goals: (amount * split.goals) / 100,
    debts: (amount * split.debts) / 100,
  };
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
