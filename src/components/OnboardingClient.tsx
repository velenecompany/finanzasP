"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Wallet, PieChart, ArrowRight, Check, AlertTriangle, Sparkles, PencilLine } from "lucide-react";
import AdvisorChat from "@/components/AdvisorChat";

const inputCls = "w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none focus:border-[#2a3038]";
const EXAMPLES = ["Ropa", "Barbería", "Cafetería", "Tienda", "Servicios"];

export default function OnboardingClient({ name }: { name: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"business" | "choice" | "ai" | "fixed" | "split">("business");
  const [saving, setSaving] = useState(false);

  const [biz, setBiz] = useState("");
  const [fixed, setFixed] = useState({ carro: "", gasolina: "", comida: "" });
  const [splits, setSplits] = useState({ colchon: "20", reinversion: "50", libre: "30" });

  const num = (v: string) => Math.max(0, parseFloat(v) || 0);
  const splitSum = num(splits.colchon) + num(splits.reinversion) + num(splits.libre);

  async function createBizIfAny() {
    if (biz.trim()) await fetch("/api/businesses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: biz.trim() }) });
  }

  async function finishManual() {
    setSaving(true);
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fixed: { carro: num(fixed.carro), gasolina: num(fixed.gasolina), comida: num(fixed.comida) },
        splits: { colchon: Math.round(num(splits.colchon)), reinversion: Math.round(num(splits.reinversion)), libre: Math.round(num(splits.libre)) },
      }) });
    await fetch("/api/onboarding/complete", { method: "POST" });
    router.push("/dashboard"); router.refresh();
  }

  const stepNum = step === "business" ? 1 : step === "choice" ? 2 : step === "ai" ? 2 : step === "fixed" ? 2 : 3;

  return (
    <div className="min-h-screen grid place-items-center p-5" style={{ background: "radial-gradient(120% 100% at 50% 0%,#11171a,#0a0b0d 60%)" }}>
      <div className={`w-full ${step === "ai" ? "max-w-[560px]" : "max-w-[460px]"}`}>
        <div className="text-center mb-6">
          <div className="font-bold text-[20px] tracking-tight">Wealth<span className="text-[var(--income)]">Flow</span></div>
          <p className="text-[13px] text-[var(--text-3)] mt-1">Hola{name ? ` ${name}` : ""}, configuremos lo tuyo.</p>
        </div>

        {step === "ai" ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 h-[70vh] flex flex-col">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] mb-1">
              <div className="w-8 h-8 rounded-[9px] bg-[var(--income-soft)] grid place-items-center"><Sparkles size={16} className="text-[var(--income)]" /></div>
              <div><div className="text-[13.5px] font-semibold">Asesor financiero IA</div><div className="text-[11px] text-[var(--text-3)]">Te hará unas preguntas para configurar todo</div></div>
            </div>
            <AdvisorChat
              starter="Hola, acabo de crear mi cuenta. Ayúdame a configurar mis finanzas: hazme el diagnóstico y deja lista mi configuración."
              onComplete={() => { router.push("/dashboard"); router.refresh(); }}
            />
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            {step === "business" && (
              <>
                <h2 className="text-[16px] font-bold mb-1">Tu primer negocio</h2>
                <p className="text-[12.5px] text-[var(--text-3)] mb-4">¿Cómo se llama tu negocio? Podrás agregar más después. (Opcional)</p>
                <input autoFocus className={inputCls} placeholder="Nombre de tu negocio" value={biz} onChange={(e) => setBiz(e.target.value)} />
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {EXAMPLES.map((ex) => <button key={ex} onClick={() => setBiz(ex)} className="text-[12px] px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] hover:border-[#2a3038]">{ex}</button>)}
                </div>
                <button onClick={async () => { await createBizIfAny(); setStep("choice"); }} className="w-full mt-6 bg-[var(--action)] text-white font-semibold text-[13.5px] py-3 rounded-[11px] hover:opacity-90 transition inline-flex items-center justify-center gap-2">Continuar <ArrowRight size={16} /></button>
              </>
            )}

            {step === "choice" && (
              <>
                <h2 className="text-[16px] font-bold mb-1">¿Cómo configuramos tus finanzas?</h2>
                <p className="text-[12.5px] text-[var(--text-3)] mb-4">Elige cómo prefieres definir tus gastos fijos y tu reparto.</p>
                <button onClick={() => setStep("ai")} className="w-full text-left bg-[var(--surface-2)] border border-[var(--income)] rounded-[14px] p-4 mb-3 hover:bg-[var(--surface-3)] transition">
                  <div className="flex items-center gap-2.5 mb-1"><Sparkles size={17} className="text-[var(--income)]" /><b className="text-[14px]">Con IA (recomendado)</b></div>
                  <p className="text-[12px] text-[var(--text-3)]">Un asesor te hace unas preguntas y deja todo configurado por ti.</p>
                </button>
                <button onClick={() => setStep("fixed")} className="w-full text-left bg-[var(--surface-2)] border border-[var(--border)] rounded-[14px] p-4 hover:bg-[var(--surface-3)] transition">
                  <div className="flex items-center gap-2.5 mb-1"><PencilLine size={17} className="text-[var(--text-2)]" /><b className="text-[14px]">A mano</b></div>
                  <p className="text-[12px] text-[var(--text-3)]">Llena tú mismo tus gastos fijos y porcentajes.</p>
                </button>
              </>
            )}

            {step === "fixed" && (
              <>
                <h2 className="text-[16px] font-bold mb-1">Tus gastos fijos mensuales</h2>
                <p className="text-[12.5px] text-[var(--text-3)] mb-4">Lo que pagas cada mes sí o sí. Déjalo en 0 si no aplica.</p>
                <div className="space-y-3">
                  {([["carro", "Coche / transporte"], ["gasolina", "Gasolina"], ["comida", "Comida / despensa"]] as const).map(([k, label]) => (
                    <div key={k}>
                      <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">{label}</label>
                      <input className={inputCls} type="number" inputMode="decimal" placeholder="0" value={fixed[k]} onChange={(e) => setFixed({ ...fixed, [k]: e.target.value })} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-6">
                  <button onClick={() => setStep("choice")} className="px-4 py-3 rounded-[11px] bg-[var(--surface-2)] border border-[var(--border)] text-[13.5px] font-semibold text-[var(--text-2)]">Atrás</button>
                  <button onClick={() => setStep("split")} className="flex-1 bg-[var(--action)] text-white font-semibold text-[13.5px] py-3 rounded-[11px] hover:opacity-90 transition inline-flex items-center justify-center gap-2">Continuar <ArrowRight size={16} /></button>
                </div>
              </>
            )}

            {step === "split" && (
              <>
                <h2 className="text-[16px] font-bold mb-1">Reparto de lo disponible</h2>
                <p className="text-[12.5px] text-[var(--text-3)] mb-4">Después de tus fijos, ¿cómo repartes lo que queda? Debe sumar 100%.</p>
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
                  <button onClick={() => setStep("fixed")} className="px-4 py-3 rounded-[11px] bg-[var(--surface-2)] border border-[var(--border)] text-[13.5px] font-semibold text-[var(--text-2)]">Atrás</button>
                  <button onClick={finishManual} disabled={saving || splitSum !== 100} className="flex-1 bg-[var(--income)] text-[#04130d] font-semibold text-[13.5px] py-3 rounded-[11px] hover:opacity-90 transition disabled:opacity-50">{saving ? "Guardando..." : "Empezar a usar WealthFlow"}</button>
                </div>
              </>
            )}
          </div>
        )}

        {(step === "choice" || step === "ai") && (
          <button onClick={async () => { await fetch("/api/onboarding/complete", { method: "POST" }); router.push("/dashboard"); router.refresh(); }} className="w-full text-center text-[12.5px] text-[var(--text-3)] mt-4 hover:text-[var(--text-2)]">Omitir configuración</button>
        )}
      </div>
    </div>
  );
}
