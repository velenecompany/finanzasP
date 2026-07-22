"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, ArrowRight, Plus } from "lucide-react";
import { formatMXN } from "@/lib/utils";
import { computeReparto, type Prefs } from "@/lib/settings";
import Topbar from "@/components/Topbar";
import AlertsBanner from "@/components/AlertsBanner";
import TxModal from "@/components/TxModal";

type Biz = { id: string; name: string; capital: number };

export default function DashboardClient({
  businesses, income, expense, lastIncome, prefs,
}: { businesses: Biz[]; income: number; expense: number; lastIncome: number; prefs: Prefs }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const total = businesses.reduce((s, b) => s + b.capital, 0);
  const rep = computeReparto(lastIncome, prefs);
  const dots = ["var(--income)", "var(--gold)", "var(--action)", "#c084fc", "#f472b6"];

  return (
    <>
      <Topbar title="Dashboard" subtitle="Resumen de tu patrimonio" onNew={() => setOpen(true)} />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise">
        <AlertsBanner />

        <div className="rounded-[20px] border border-[var(--border)] p-6 md:p-7 relative overflow-hidden" style={{ background: "radial-gradient(120% 140% at 0% 0%,#11171a,#0d0f12 55%)" }}>
          <div className="text-[11px] tracking-[0.14em] uppercase text-[var(--text-3)] font-semibold font-mono mb-2.5">Capital total</div>
          <div className="text-[38px] md:text-[46px] font-extrabold tracking-tight leading-none tnum">{formatMXN(total)}</div>
          {businesses.length > 0 && (
            <div className="flex gap-x-4 gap-y-1.5 mt-3 text-[13px] font-mono flex-wrap">
              {businesses.map((b, i) => (
                <span key={b.id} className="text-[var(--text-2)]"><span style={{ color: dots[i % dots.length] }}>●</span> {b.name} {formatMXN(b.capital)}</span>
              ))}
            </div>
          )}
        </div>

        {businesses.length === 0 ? (
          <Link href="/cuenta" className="flex items-center justify-center gap-2.5 bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-2xl p-6 mt-[18px] text-[13.5px] font-semibold text-[var(--text-2)] hover:bg-[var(--surface-2)] transition">
            <Plus size={18} className="text-[var(--action)]" /> Agrega tu primer negocio
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-[14px] md:gap-[18px] mt-[18px]">
            {businesses.map((b, i) => (
              <Link key={b.id} href={`/n/${b.id}`} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px] hover:border-[#272d36] transition group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-[34px] h-[34px] rounded-[10px] grid place-items-center bg-[var(--surface-2)]"><Store size={17} style={{ color: dots[i % dots.length] }} /></div>
                  <ArrowRight size={16} className="text-[var(--text-3)] group-hover:text-[var(--text)] transition" />
                </div>
                <div className="text-[12.5px] text-[var(--text-2)] truncate">{b.name}</div>
                <div className="text-[20px] md:text-[26px] font-bold tnum mt-1">{formatMXN(b.capital)}</div>
              </Link>
            ))}
            <Link href="/cuenta" className="bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-2xl p-[18px] flex flex-col items-center justify-center gap-2 text-[var(--text-3)] hover:bg-[var(--surface-2)] transition min-h-[112px]">
              <Plus size={20} /><span className="text-[12.5px] font-semibold">Agregar negocio</span>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-3 gap-[14px] md:gap-[18px] mt-[18px]">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12px] md:text-[12.5px] text-[var(--text-2)]">Ingresos del mes</div><div className="text-[18px] md:text-[24px] font-bold tnum text-[var(--income)] mt-1">{formatMXN(income)}</div></div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12px] md:text-[12.5px] text-[var(--text-2)]">Gastos del mes</div><div className="text-[18px] md:text-[24px] font-bold tnum text-[var(--expense)] mt-1">{formatMXN(expense)}</div></div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12px] md:text-[12.5px] text-[var(--text-2)]">Balance del mes</div><div className="text-[18px] md:text-[24px] font-bold tnum mt-1">{formatMXN(income - expense)}</div></div>
        </div>

        {lastIncome > 0 && (
          <Link href="/finanzas" className="block bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mt-[18px] hover:border-[#272d36] transition">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[14px] font-semibold">Reparto de tu último pago</div>
              <span className="text-[12px] text-[var(--action)] font-semibold inline-flex items-center gap-1">Ver en Finanzas <ArrowRight size={13} /></span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[12px] p-3 text-center"><div className="text-[11px] text-[var(--text-2)] mb-1">Colchón {prefs.splits.colchon}%</div><div className="text-[14px] font-bold tnum text-[var(--income)]">{formatMXN(rep.colchon)}</div></div>
              <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[12px] p-3 text-center"><div className="text-[11px] text-[var(--text-2)] mb-1">Reinversión {prefs.splits.reinversion}%</div><div className="text-[14px] font-bold tnum text-[var(--action)]">{formatMXN(rep.reinversion)}</div></div>
              <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[12px] p-3 text-center"><div className="text-[11px] text-[var(--text-2)] mb-1">Libre {prefs.splits.libre}%</div><div className="text-[14px] font-bold tnum text-[var(--gold)]">{formatMXN(rep.libre)}</div></div>
            </div>
          </Link>
        )}
      </div>

      <TxModal open={open} onClose={() => setOpen(false)} onSaved={() => router.refresh()} initialType="income" />
    </>
  );
}
