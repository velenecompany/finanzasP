"use client";
import { useEffect, useState } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { formatMXN } from "@/lib/utils";
import { DEFAULT_PREFS, type Prefs } from "@/lib/settings";
import Topbar from "@/components/Topbar";

export default function AjustesClient() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { prefs } = await (await fetch("/api/settings")).json();
      setPrefs(prefs); setLoading(false);
    })();
  }, []);

  const splitSum = prefs.splits.colchon + prefs.splits.reinversion + prefs.splits.libre;

  async function save() {
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) });
    setSaved(true); setTimeout(() => setSaved(false), 2200);
  }

  const num = (v: string) => Math.max(0, parseFloat(v) || 0);
  const inputCls = "w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none focus:border-[#2a3038]";

  if (loading) return <><Topbar title="Ajustes" subtitle="Configuración" /><div className="p-7 text-[var(--text-3)] text-[13px]">Cargando...</div></>;

  return (
    <>
      <Topbar title="Ajustes" subtitle="Capital, gastos fijos y reparto" />
      <div className="p-5 md:p-7 max-w-[720px] w-full mx-auto animate-rise space-y-[18px]">

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <div className="text-[14px] font-semibold mb-1">Gastos fijos semanales</div>
          <div className="text-[12px] text-[var(--text-3)] mb-4">Se apartan automáticamente de cada pago antes de repartir el resto.</div>
          <div className="grid grid-cols-3 gap-3">
            {(["carro", "gasolina", "comida"] as const).map((k) => (
              <div key={k}>
                <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5 capitalize">{k}</label>
                <input className={inputCls} type="number" inputMode="decimal" value={prefs.fixed[k]}
                  onChange={(e) => setPrefs({ ...prefs, fixed: { ...prefs.fixed, [k]: num(e.target.value) } })} />
              </div>
            ))}
          </div>
          <div className="mt-3 text-[12px] text-[var(--text-2)] font-mono">Total fijos: {formatMXN(prefs.fixed.carro + prefs.fixed.gasolina + prefs.fixed.comida)}/semana</div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <div className="text-[14px] font-semibold mb-1">Reparto del disponible</div>
          <div className="text-[12px] text-[var(--text-3)] mb-4">Cómo se reparte lo que queda después de los gastos fijos. Debe sumar 100%.</div>
          <div className="grid grid-cols-3 gap-3">
            {([["colchon", "Colchón"], ["reinversion", "Reinversión"], ["libre", "Libre"]] as const).map(([k, label]) => (
              <div key={k}>
                <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">{label} %</label>
                <input className={inputCls} type="number" inputMode="numeric" value={prefs.splits[k]}
                  onChange={(e) => setPrefs({ ...prefs, splits: { ...prefs.splits, [k]: Math.round(num(e.target.value)) } })} />
              </div>
            ))}
          </div>
          <div className={`mt-3 inline-flex items-center gap-2 text-[12px] font-mono px-2.5 py-1.5 rounded-lg ${splitSum === 100 ? "text-[var(--income)] bg-[var(--income-soft)]" : "text-[var(--gold)] bg-[var(--gold-soft)]"}`}>
            {splitSum === 100 ? <Check size={14} /> : <AlertTriangle size={14} />} Suma: {splitSum}%
          </div>
        </div>

        <button onClick={save} disabled={splitSum !== 100}
          className="w-full bg-[var(--action)] text-white font-semibold text-[14px] py-3.5 rounded-[12px] hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {saved ? <><Check size={17} /> Guardado</> : "Guardar configuración"}
        </button>
        {splitSum !== 100 && <div className="text-center text-[12px] text-[var(--gold)]">Los porcentajes deben sumar 100% para guardar.</div>}
      </div>
    </>
  );
}
