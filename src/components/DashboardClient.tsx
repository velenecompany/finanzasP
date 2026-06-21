"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Building2, TrendingUp, Settings2 } from "lucide-react";
import { formatMXN, distributeIncome } from "@/lib/utils";
import Topbar from "@/components/Topbar";
import TxModal from "@/components/TxModal";

type Split = { expenses: number; goals: number; debts: number };

export default function DashboardClient({
  personal, income, expense, lastIncome, split,
}: { personal: number; income: number; expense: number; lastIncome: number; split: Split }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const dist = distributeIncome(lastIncome, split);

  const buckets = [
    { name: "Gastos", pct: split.expenses, amt: dist.expenses, color: "var(--expense)", grad: "rgba(242,118,107,.5)" },
    { name: "Metas", pct: split.goals, amt: dist.goals, color: "var(--gold)", grad: "rgba(216,179,106,.5)" },
    { name: "Deudas", pct: split.debts, amt: dist.debts, color: "var(--income)", grad: "rgba(52,216,160,.5)" },
  ];

  return (
    <>
      <Topbar title="Dashboard" subtitle="Resumen de tu patrimonio" onNew={() => setOpen(true)} />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise">
        <div className="rounded-[20px] border border-[var(--border)] p-7 relative overflow-hidden"
          style={{ background: "radial-gradient(120% 140% at 0% 0%,#11171a,#0d0f12 55%)" }}>
          <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--text-3)] font-semibold font-mono mb-2.5">Balance del mes</div>
          <div className="text-[46px] font-extrabold tracking-tight leading-none tnum">{formatMXN(personal)}</div>
          <div className="text-[13px] text-[var(--text-2)] mt-3 font-mono">
            <span className="text-[var(--income)]">{formatMXN(income)} ingresos</span> · <span className="text-[var(--expense)]">{formatMXN(expense)} gastos</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px] mt-[18px]">
          {[
            { label: "Ingresos del mes", val: formatMXN(income), icon: Wallet, color: "var(--income)" },
            { label: "Gastos del mes", val: formatMXN(expense), icon: Building2, color: "var(--expense)" },
            { label: "Balance", val: formatMXN(income - expense), icon: TrendingUp, color: "var(--text)" },
            { label: "Último ingreso", val: formatMXN(lastIncome), icon: Wallet, color: "var(--text)" },
          ].map((s) => (
            <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]">
              <div className="w-[34px] h-[34px] rounded-[10px] grid place-items-center mb-3.5 bg-[var(--surface-2)]"><s.icon size={17} style={{ color: s.color }} /></div>
              <div className="text-[12.5px] text-[var(--text-2)] font-medium">{s.label}</div>
              <div className="text-[26px] font-bold tracking-tight mt-1 tnum" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mt-[18px] max-w-[520px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[14px] font-semibold">Distribución automática</div>
              <div className="text-[11.5px] text-[var(--text-3)] mt-0.5">Último ingreso · {formatMXN(lastIncome)}</div>
            </div>
            <Settings2 size={16} className="text-[var(--text-2)]" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {buckets.map((b) => (
              <div key={b.name} className="text-center">
                <div className="h-[150px] rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)] relative overflow-hidden flex items-end">
                  <div className="absolute top-3 left-0 right-0 font-mono text-[18px] font-semibold z-[2]" style={{ color: b.color }}>{b.pct}%</div>
                  <div className="w-full rounded-b-[13px] transition-all duration-1000" style={{ height: `${b.pct}%`, background: `linear-gradient(180deg, ${b.grad}, transparent)` }} />
                </div>
                <div className="text-[12.5px] font-semibold mt-2.5">{b.name}</div>
                <div className="text-[13px] text-[var(--text-2)] mt-0.5 tnum">{formatMXN(b.amt)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TxModal open={open} onClose={() => setOpen(false)} onSaved={() => router.refresh()} initialType="income" />
    </>
  );
}
