"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, BarChart3 } from "lucide-react";
import { formatMXN, formatDate } from "@/lib/utils";
import Topbar from "@/components/Topbar";
import TxModal from "@/components/TxModal";

type Tx = { id: string; type: "income" | "expense"; amount: number; description: string; date: string };

export default function FinanzasClient({ transactions }: { transactions: Tx[] }) {
  const [open, setOpen] = useState(false);
  const [initialType, setInitialType] = useState<"income" | "expense">("expense");
  const router = useRouter();

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const ni = transactions.filter((t) => t.type === "income").length;
  const ne = transactions.filter((t) => t.type === "expense").length;

  const openWith = (t: "income" | "expense") => { setInitialType(t); setOpen(true); };

  return (
    <>
      <Topbar title="Finanzas" subtitle="Ingresos, gastos y categorías" onNew={() => openWith("expense")} />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
          {[
            { label: "Ingresos del mes", val: income, n: ni, color: "var(--income)" },
            { label: "Gastos del mes", val: expense, n: ne, color: "var(--expense)" },
            { label: "Balance", val: income - expense, n: ni + ne, color: "var(--text)" },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]">
              <div className="text-[12.5px] text-[var(--text-2)] font-medium">{s.label}</div>
              <div className="text-[26px] font-bold tracking-tight mt-1 tnum" style={{ color: s.color }}>{formatMXN(s.val)}</div>
              <div className="text-[11.5px] text-[var(--text-3)] mt-2 font-mono">{s.n} movimiento{s.n !== 1 ? "s" : ""}</div>
            </div>
          ))}
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mt-[18px]">
          <div className="flex items-center justify-between mb-[18px]">
            <div className="text-[14px] font-semibold">Movimientos</div>
            <div className="flex gap-2.5">
              <button onClick={() => openWith("income")} className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] text-[13px] font-semibold px-3.5 py-2 rounded-[10px] hover:bg-[var(--surface-2)] transition">
                <Plus size={15} strokeWidth={2.2} className="text-[var(--income)]" /> Registrar ingreso
              </button>
              <button onClick={() => openWith("expense")} className="inline-flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] text-[13px] font-semibold px-3.5 py-2 rounded-[10px] hover:bg-[var(--surface-2)] transition">
                <Minus size={15} strokeWidth={2.2} className="text-[var(--expense)]" /> Registrar gasto
              </button>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-3)]">
              <BarChart3 size={34} className="mx-auto mb-2.5 opacity-50" />
              <div className="text-[13px]">Aún no hay movimientos. Registra tu primer ingreso o gasto.</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-[11px] tracking-[0.06em] uppercase text-[var(--text-3)] font-semibold">
                  <th className="text-left pb-3 border-b border-[var(--border)]">Concepto</th>
                  <th className="text-left pb-3 border-b border-[var(--border)]">Tipo</th>
                  <th className="text-left pb-3 border-b border-[var(--border)]">Fecha</th>
                  <th className="text-right pb-3 border-b border-[var(--border)]">Monto</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] font-medium">{t.description || (t.type === "income" ? "Ingreso" : "Gasto")}</td>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] text-[var(--text-2)]">{t.type === "income" ? "Ingreso" : "Gasto"}</td>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] text-[var(--text-2)]">{formatDate(t.date)}</td>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] text-right tnum font-semibold" style={{ color: t.type === "income" ? "var(--income)" : "var(--expense)" }}>
                      {t.type === "income" ? "+" : "−"}{formatMXN(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <TxModal open={open} onClose={() => setOpen(false)} onSaved={() => router.refresh()} initialType={initialType} />
    </>
  );
}
