"use client";
import { useEffect, useMemo, useState } from "react";
import { formatMXN } from "@/lib/utils";
import Topbar from "@/components/Topbar";

export default function CrecimientoClient() {
  const [current, setCurrent] = useState(0);
  const [target, setTarget] = useState("100000");
  const [months, setMonths] = useState("6");

  useEffect(() => {
    (async () => {
      const [s, e] = await Promise.all([fetch("/api/vapes/sales"), fetch("/api/vapes/expenses")]);
      const sales = (await s.json()).sales ?? [];
      const expenses = (await e.json()).expenses ?? [];
      const profit = sales.reduce((a: number, v: { profit: string }) => a + Number(v.profit), 0);
      const exp = expenses.reduce((a: number, x: { amount: string }) => a + Number(x.amount), 0);
      setCurrent(Math.max(0, profit - exp));
    })();
  }, []);

  const tgt = parseFloat(target) || 0;
  const m = Math.max(1, parseInt(months) || 1);
  const diff = Math.max(0, tgt - current);
  const monthly = diff / m;

  const points = useMemo(() => {
    return Array.from({ length: m + 1 }, (_, i) => current + monthly * i);
  }, [current, monthly, m]);

  const maxY = Math.max(tgt, ...points, 1);
  const path = points.map((p, i) => {
    const x = 40 + (i / m) * 460;
    const y = 180 - (p / maxY) * 150;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  return (
    <>
      <Topbar title="Crecimiento del negocio" subtitle="Proyección de capital" />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise">
        <div className="grid md:grid-cols-3 gap-[18px] mb-[18px]">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12.5px] text-[var(--text-2)]">Capital actual</div><div className="text-[24px] font-bold tnum mt-1">{formatMXN(current)}</div><div className="text-[11px] text-[var(--text-3)] mt-1 font-mono">utilidad − gastos del negocio</div></div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12.5px] text-[var(--text-2)]">Falta para la meta</div><div className="text-[24px] font-bold tnum text-[var(--gold)] mt-1">{formatMXN(diff)}</div></div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12.5px] text-[var(--text-2)]">Ahorro mensual requerido</div><div className="text-[24px] font-bold tnum text-[var(--income)] mt-1">{formatMXN(monthly)}</div></div>
        </div>

        <div className="grid md:grid-cols-[320px_1fr] gap-[18px]">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <div className="text-[14px] font-semibold mb-4">Configura tu proyección</div>
            <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Capital objetivo</label>
            <input className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none mb-4 focus:border-[#2a3038]" type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
            <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Plazo (meses)</label>
            <div className="grid grid-cols-3 gap-2">
              {["6", "12", "18"].map((v) => (
                <button key={v} onClick={() => setMonths(v)} className={`py-2.5 rounded-[10px] text-[13px] font-semibold transition border ${months === v ? "bg-[var(--action-soft)] border-[var(--action)] text-[var(--action)]" : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)]"}`}>{v}m</button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <div className="text-[14px] font-semibold mb-4">Proyección a {m} meses</div>
            <svg viewBox="0 0 520 200" className="w-full h-auto">
              <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34D8A0" stopOpacity=".25" /><stop offset="1" stopColor="#34D8A0" stopOpacity="0" /></linearGradient></defs>
              <line x1="40" y1="30" x2="500" y2="30" stroke="#1E222A" /><line x1="40" y1="105" x2="500" y2="105" stroke="#1E222A" /><line x1="40" y1="180" x2="500" y2="180" stroke="#1E222A" />
              <path d={`${path} L500,180 L40,180 Z`} fill="url(#cg)" />
              <path d={path} fill="none" stroke="#34D8A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="40" y1={180 - (tgt / maxY) * 150} x2="500" y2={180 - (tgt / maxY) * 150} stroke="#D8B36A" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="44" y={180 - (tgt / maxY) * 150 - 6} fill="#D8B36A" fontSize="10" fontFamily="JetBrains Mono">meta {formatMXN(tgt)}</text>
            </svg>
            <div className="flex justify-between mt-2 text-[11px] text-[var(--text-3)] font-mono px-10"><span>Hoy</span><span>{m} meses</span></div>
          </div>
        </div>
      </div>
    </>
  );
}
