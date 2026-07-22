"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import AdvisorChat from "@/components/AdvisorChat";

const inputCls = "w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none focus:border-[#2a3038]";
const EXAMPLES = ["Ropa", "Barbería", "Cafetería", "Tienda", "Servicios"];

export default function OnboardingClient({ name }: { name: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"business" | "ai">("business");
  const [biz, setBiz] = useState("");
  const [going, setGoing] = useState(false);

  async function goToAI() {
    setGoing(true);
    if (biz.trim()) {
      await fetch("/api/businesses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: biz.trim() }) });
    }
    setGoing(false);
    setStep("ai");
  }

  async function skip() {
    await fetch("/api/onboarding/complete", { method: "POST" });
    router.push("/dashboard"); router.refresh();
  }

  return (
    <div className="min-h-screen grid place-items-center p-5" style={{ background: "radial-gradient(120% 100% at 50% 0%,#11171a,#0a0b0d 60%)" }}>
      <div className={`w-full ${step === "ai" ? "max-w-[560px]" : "max-w-[460px]"}`}>
        <div className="text-center mb-6">
          <div className="font-bold text-[20px] tracking-tight">Wealth<span className="text-[var(--income)]">Flow</span></div>
          <p className="text-[13px] text-[var(--text-3)] mt-1">Hola{name ? ` ${name}` : ""}, configuremos lo tuyo.</p>
        </div>

        {step === "business" ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            <h2 className="text-[16px] font-bold mb-1">Tu primer negocio</h2>
            <p className="text-[12.5px] text-[var(--text-3)] mb-4">¿Cómo se llama tu negocio? Podrás agregar más después. (Opcional)</p>
            <input autoFocus className={inputCls} placeholder="Nombre de tu negocio" value={biz}
              onChange={(e) => setBiz(e.target.value)} onKeyDown={(e) => e.key === "Enter" && goToAI()} />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => setBiz(ex)} className="text-[12px] px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] hover:border-[#2a3038]">{ex}</button>
              ))}
            </div>
            <button onClick={goToAI} disabled={going}
              className="w-full mt-6 bg-[var(--action)] text-white font-semibold text-[13.5px] py-3 rounded-[11px] hover:opacity-90 transition disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {going ? "Un momento…" : <>Continuar <ArrowRight size={16} /></>}
            </button>
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 h-[72vh] flex flex-col">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)] mb-1">
              <div className="w-8 h-8 rounded-[9px] bg-[var(--income-soft)] grid place-items-center shrink-0"><Sparkles size={16} className="text-[var(--income)]" /></div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-semibold">Asesor financiero</div>
                <div className="text-[11px] text-[var(--text-3)]">Responde sus preguntas y dejará todo configurado</div>
              </div>
            </div>
            <AdvisorChat
              starter="Hola, acabo de crear mi cuenta. Ayúdame a configurar mis finanzas: hazme el diagnóstico y deja lista mi configuración."
              onComplete={() => { router.push("/dashboard"); router.refresh(); }}
            />
          </div>
        )}

        {step === "ai" && (
          <div className="text-center mt-4">
            <button onClick={skip} className="text-[10.5px] text-[var(--text-3)] opacity-40 hover:opacity-80 transition underline underline-offset-2">
              omitir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
