"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Wallet, PieChart, ArrowRight, Check, AlertTriangle } from "lucide-react";

const inputCls = "w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none focus:border-[#2a3038]";
const EXAMPLES = ["Ropa", "Barbería", "Cafetería", "Tienda", "Servicios"];

export default function OnboardingClient({ name }: { name: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [biz, setBiz] = useState("");
  const [fixed, setFixed] = useState({ carro: "", gasolina: "", comida: "" });
  const [splits, setSplits] = useState({ colchon: "20", reinversion: "50", libre: "30" });

  const num = (v: string) => Math.max(0, parseFloat(v) || 0);
  const splitSum = num(splits.colchon) + num(splits.reinversion) + num(splits.libre);

  async function finish() {
    setSaving(true);
    // 1. primer negocio (si escribió uno)
    if (biz.trim()) {
      await fetch("/api/businesses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: biz.trim() }) });
    }
    // 2. gastos fijos + reparto
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fixed: { carro: num(fixed.carro), gasolina: num(fixed.gasolina), comida: num(fixed.comida) },
        splits: { colchon: Math.round(num(splits.colchon)), reinversion: Math.round(num(splits.reinversion)), libre: Math.round(num(splits.libre)) },
      }) });
    // 3. marcar completado
    await fetch("/api/onboarding/complete", { method: "POST" });
    router.push("/dashboard");
    router.refresh();
  }

  const StepDot = ({ n, icon: Icon }: { n: number; icon: any }) => (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full grid place-items-center transition ${step >= n ? "bg-[var(--action)] text-white" : "bg-[var(--surface-2)] text-[var(--text-3)]"}`}>
        {step > n ? <Check size={16} /> : <Icon size={15} />}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen grid place-items-center p-5" style={{ background: "radial-gradient(120% 100% at 50% 0%,#11171a,#0a0b0d 60%)" }}>
      <div className="w-full max-w-[460px]">
        <div className="text-center mb-6">
          <div className="font-bold text-[20px] tracking-tight">Wealth<span className="text-[var(--income)]">Flow</span></div>
          <p className="text-[13px] text-[var(--text-3)] mt-1">Hola{name ? ` ${name}` : ""}, configuremos lo tuyo en 3 pasos.</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <StepDot n={1} icon={Store} />
          <div className={`h-[2px] w-8 ${step > 1 ? "bg-[var(--action)]" : "bg-[var(--surface-2)]"}`} />
          <StepDot n={2} icon={Wallet} />
          <div className={`h-[2px] w-8 ${step > 2 ? "bg-[var(--action)]" : "bg-[var(--surface-2)]"}`} />
          <StepDot n={3} icon={PieChart} />
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          {step === 1 && (
            <>
              <h2 className="text-[16px] font-bold mb-1">Tu primer negocio</h2>
              <p className="text-[12.5px] text-[var(--text-3)] mb-4">¿Cómo se llama tu negocio? Podrás agregar más después. (Opcional)</p>
              <input autoFocus className={inputCls} placeholder="Nombre de tu negocio" value={biz} onChange={(e) => setBiz(e.target.value)} />
              <div className="flex flex-wrap gap-1.5 mt-3">
                {EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => setBiz(ex)} className="text-[12px] px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] hover:border-[#2a3038]">{ex}</button>
                ))}
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setStep(2)} className="flex-1 bg-[var(--action)] text-white font-semibold text-[13.5px] py-3 rounded-[11px] hover:opacity-90 transition inline-flex items-center justify-center gap-2">Continuar <ArrowRight size={16} /></button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-[16px] font-bold mb-1">Tus gastos fijos mensuales</h2>
              <p className="text-[12.5px] text-[var(--text-3)] mb-4">Lo que pagas cada mes sí o sí. Se apartará de cada pago. Déjalo en 0 si no aplica.</p>
              <div className="space-y-3">
                {([["carro", "Coche / transporte"], ["gasolina", "Gasolina"], ["comida", "Comida / despensa"]] as const).map(([k, label]) => (
                  <div key={k}>
                    <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">{label}</label>
                    <input className={inputCls} type="number" inputMode="decimal" placeholder="0" value={fixed[k]} onChange={(e) => setFixed({ ...fixed, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setStep(1)} className="px-4 py-3 rounded-[11px] bg-[var(--surface-2)] border border-[var(--border)] text-[13.5px] font-semibold text-[var(--text-2)]">Atrás</button>
                <button onClick={() => setStep(3)} className="flex-1 bg-[var(--action)] text-white font-semibold text-[13.5px] py-3 rounded-[11px] hover:opacity-90 transition inline-flex items-center justify-center gap-2">Continuar <ArrowRight size={16} /></button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-[16px] font-bold mb-1">Reparto de lo disponible</h2>
              <p className="text-[12.5px] text-[var(--text-3)] mb-4">Después de tus fijos, ¿cómo repartes lo que queda de cada pago? Debe sumar 100%.</p>
              <div className="space-y-3">
                {([["colchon", "Colchón / ahorro"], ["reinversion", "Reinversión"], ["libre", "Libre / gastos"]] as const).map(([k, label]) => (
                  <div key={k}>
                    <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">{label} (%)</label>
                    <input className={inputCls} type="number" inputMode="numeric" value={splits[k]} onChange={(e) => setSplits({ ...splits, [k]: e.target.value })} />
                  </div>
                ))}
              </div>
              <div className={`mt-3 inline-flex items-center gap-2 text-[12px] font-mono px-2.5 py-1.5 rounded-lg ${splitSum === 100 ? "text-[var(--income)] bg-[var(--income-soft)]" : "text-[var(--gold)] bg-[var(--gold-soft,#2a2410)]"}`}>
                {splitSum === 100 ? <Check size={14} /> : <AlertTriangle size={14} />} Suma: {splitSum}%
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setStep(2)} className="px-4 py-3 rounded-[11px] bg-[var(--surface-2)] border border-[var(--border)] text-[13.5px] font-semibold text-[var(--text-2)]">Atrás</button>
                <button onClick={finish} disabled={saving || splitSum !== 100} className="flex-1 bg-[var(--income)] text-[#04130d] font-semibold text-[13.5px] py-3 rounded-[11px] hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
                  {saving ? "Guardando..." : "Empezar a usar WealthFlow"}
                </button>
              </div>
            </>
          )}
        </div>

        {step < 3 && (
          <button onClick={finish} disabled={saving} className="w-full text-center text-[12.5px] text-[var(--text-3)] mt-4 hover:text-[var(--text-2)]">Omitir por ahora</button>
        )}
      </div>
    </div>
  );
}
