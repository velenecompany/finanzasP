"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Check, X, Sparkles, ShieldCheck } from "lucide-react";

type Pending = { id: string; name: string; input: any; summary: string } | null;

export default function AdvisorChat({ starter, onComplete }: { starter?: string; onComplete?: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const kicked = useRef(false);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }); }, [messages, loading, pending]);

  useEffect(() => {
    if (starter && !kicked.current) { kicked.current = true; send(starter, []); }
  }, []); // eslint-disable-line

  async function call(payload: any) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/ai/advisor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); setLoading(false); return; }
      setMessages(data.messages);
      setPending(data.type === "confirm" ? data.pending : null);
    } catch (e: any) { setError(e?.message ?? "Error de red"); }
    setLoading(false);
  }

  function send(text: string, base?: any[]) {
    const msgs = [...(base ?? messages), { role: "user", content: text }];
    setMessages(msgs);
    call({ messages: msgs });
  }

  async function confirm() {
    if (!pending) return;
    const wasComplete = pending.name === "complete_onboarding";
    const id = pending.id; setPending(null);
    await call({ messages, approve: id });
    if (wasComplete && onComplete) onComplete();
  }
  function cancel() {
    if (!pending) return;
    const id = pending.id; setPending(null);
    call({ messages, decline: id });
  }

  // Deriva las burbujas visibles del array crudo
  const bubbles: { role: "user" | "assistant"; text: string }[] = [];
  for (const m of messages) {
    if (m.role === "user" && typeof m.content === "string") bubbles.push({ role: "user", text: m.content });
    else if (m.role === "assistant" && Array.isArray(m.content)) {
      const t = m.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
      if (t) bubbles.push({ role: "assistant", text: t });
    }
  }
  // Oculta el primer mensaje si fue el "starter" automático
  const visible = starter ? bubbles.filter((b, i) => !(i === 0 && b.role === "user" && b.text === starter)) : bubbles;

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-1 py-2">
        {visible.length === 0 && !loading && (
          <div className="text-center text-[var(--text-3)] text-[13px] py-10">
            <Sparkles size={22} className="mx-auto mb-2 text-[var(--income)]" />
            Cuéntame de tu situación y te ayudo a configurar tus finanzas.
          </div>
        )}
        {visible.map((b, i) => (
          <div key={i} className={`flex ${b.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap ${b.role === "user" ? "bg-[var(--action)] text-white" : "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]"}`}>
              {b.text}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl px-4 py-3 text-[var(--text-3)] text-[13px]">Pensando…</div></div>}

        {pending && (
          <div className="bg-[var(--surface)] border border-[var(--income)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2 text-[12px] font-semibold text-[var(--income)]"><ShieldCheck size={15} /> Confirmar acción</div>
            <p className="text-[13.5px] mb-3">{pending.summary}</p>
            <div className="flex gap-2">
              <button onClick={confirm} className="flex-1 bg-[var(--income)] text-[#04130d] font-semibold text-[13px] py-2.5 rounded-[10px] inline-flex items-center justify-center gap-1.5 hover:opacity-90"><Check size={15} /> Confirmar</button>
              <button onClick={cancel} className="px-4 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] font-semibold text-[13px] py-2.5 rounded-[10px] inline-flex items-center justify-center gap-1.5"><X size={15} /> Cancelar</button>
            </div>
          </div>
        )}
        {error && <div className="text-[12.5px] text-[var(--expense)] bg-[var(--expense-soft)] rounded-[10px] px-3 py-2">{error}</div>}
      </div>

      <div className="border-t border-[var(--border)] pt-3 mt-2">
        <div className="flex gap-2">
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && input.trim() && !loading && !pending) { send(input.trim()); setInput(""); } }}
            placeholder={pending ? "Confirma o cancela arriba…" : "Escribe tu respuesta…"}
            disabled={loading || !!pending}
            className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none focus:border-[#2a3038] disabled:opacity-60"
          />
          <button onClick={() => { if (input.trim()) { send(input.trim()); setInput(""); } }} disabled={loading || !!pending || !input.trim()}
            className="w-12 shrink-0 grid place-items-center bg-[var(--action)] text-white rounded-[11px] disabled:opacity-40"><Send size={17} /></button>
        </div>
      </div>
    </div>
  );
}
