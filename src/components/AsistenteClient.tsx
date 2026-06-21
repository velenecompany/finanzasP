"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Send, Bot } from "lucide-react";
import Topbar from "@/components/Topbar";

type Session = { id: string; title: string };
type Msg = { role: "user" | "assistant"; content: string };

const CHIPS = ["¿Cuánto debería reinvertir este mes?", "¿Cómo bajo mi utilización de crédito?", "Proyecta mi capital a 6 meses", "¿Conviene subir mi precio de mayoreo?"];

export default function AsistenteClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSessions = async () => setSessions((await (await fetch("/api/ai/sessions")).json()).sessions ?? []);
  useEffect(() => { loadSessions(); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  async function newChat() {
    const res = await fetch("/api/ai/sessions", { method: "POST" });
    const { session } = await res.json();
    setActiveId(session.id); setMessages([]); loadSessions();
    return session.id;
  }

  async function openSession(id: string) {
    setActiveId(id);
    const { messages } = await (await fetch(`/api/ai/sessions?id=${id}`)).json();
    setMessages(messages.map((m: Msg) => ({ role: m.role, content: m.content })));
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;
    let sessionId = activeId;
    if (!sessionId) sessionId = await newChat();
    setInput(""); setMessages((m) => [...m, { role: "user", content: msg }, { role: "assistant", content: "" }]);
    setStreaming(true);
    const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, message: msg }) });
    if (!res.ok || !res.body) {
      const t = await res.text();
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: "⚠️ " + t }; return c; });
      setStreaming(false); return;
    }
    const reader = res.body.getReader(); const dec = new TextDecoder(); let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += dec.decode(value, { stream: true });
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: acc }; return c; });
    }
    setStreaming(false); loadSessions();
  }

  return (
    <>
      <Topbar title="Asistente IA" subtitle="Asesor financiero personalizado" />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise" style={{ height: "calc(100vh - 64px)" }}>
        <div className="grid md:grid-cols-[230px_1fr] gap-[18px] h-full">
          <div className="hidden md:flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3.5 overflow-y-auto">
            <button onClick={newChat} className="w-full inline-flex items-center justify-center gap-2 bg-[var(--action)] text-white font-semibold text-[13px] py-2.5 rounded-[10px] mb-3.5 hover:opacity-90 transition"><Plus size={15} strokeWidth={2.2} /> Nuevo chat</button>
            {sessions.map((s) => (
              <button key={s.id} onClick={() => openSession(s.id)} className={`text-left px-3 py-2.5 rounded-[10px] mb-1 transition ${activeId === s.id ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"}`}>
                <span className="text-[12.5px] font-semibold block truncate">{s.title}</span>
              </button>
            ))}
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 md:p-6 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="flex-1 grid place-items-center">
                  <div className="text-center max-w-[420px]">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--income-soft)] grid place-items-center mx-auto mb-4"><Bot size={22} className="text-[var(--income)]" /></div>
                    <h3 className="text-[16px] font-bold">Tu asesor financiero</h3>
                    <p className="text-[13px] text-[var(--text-3)] mt-1.5 mb-5">Pregúntame sobre finanzas, presupuestos, tu negocio de vapes o cómo crecer tu capital.</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {CHIPS.map((c) => <button key={c} onClick={() => send(c)} className="text-[12px] px-3 py-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)] hover:border-[var(--income)] hover:text-[var(--text)] transition">{c}</button>)}
                    </div>
                  </div>
                </div>
              ) : messages.map((m, i) => (
                <div key={i} className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "self-end flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-[9px] grid place-items-center text-[13px] font-bold flex-shrink-0 ${m.role === "assistant" ? "bg-[var(--income-soft)] text-[var(--income)]" : "bg-[var(--surface-2)] text-[var(--text-2)]"}`}>{m.role === "assistant" ? "W" : "F"}</div>
                  <div className={`px-4 py-3 rounded-[13px] text-[13.5px] leading-relaxed whitespace-pre-wrap ${m.role === "assistant" ? "bg-[var(--surface-2)] border border-[var(--border)] rounded-tl-[4px]" : "bg-[var(--action)] text-white rounded-tr-[4px]"}`}>{m.content || (streaming ? "..." : "")}</div>
                </div>
              ))}
            </div>
            <div className="p-4 md:p-5 border-t border-[var(--border)] flex gap-2.5">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Pregunta sobre tus finanzas o tu negocio..." className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-[13.5px] outline-none focus:border-[#2a3038]" />
              <button onClick={() => send()} disabled={streaming} className="w-[42px] h-[42px] rounded-[11px] bg-[var(--action)] grid place-items-center text-white flex-shrink-0 disabled:opacity-50"><Send size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
