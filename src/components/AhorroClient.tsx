"use client";
import { useEffect, useState } from "react";
import { PiggyBank, ArrowUpCircle, ArrowDownCircle, Trash2 } from "lucide-react";
import { formatMXN, formatDate } from "@/lib/utils";
import Topbar from "@/components/Topbar";
import Modal, { Field, inputCls } from "@/components/Modal";

type Mov = { id: string; type: string; amount: string; note: string | null; date: string };

export default function AhorroClient() {
  const [total, setTotal] = useState(0);
  const [movs, setMovs] = useState<Mov[]>([]);
  const [modal, setModal] = useState<"" | "deposit" | "withdrawal">("");
  const [form, setForm] = useState({ amount: "", note: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const d = await (await fetch("/api/savings")).json();
    setTotal(d.total ?? 0); setMovs(d.movements ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    const amt = parseFloat(form.amount);
    if (!amt || !modal) return;
    setSaving(true);
    await fetch("/api/savings", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: modal, amount: amt, note: form.note }) });
    setSaving(false); setModal(""); setForm({ amount: "", note: "" }); load();
  }
  async function del(id: string) {
    if (!confirm("¿Eliminar este movimiento de ahorro?")) return;
    await fetch(`/api/savings?id=${id}`, { method: "DELETE" }); load();
  }

  return (
    <>
      <Topbar title="Ahorro" subtitle="Tu guardadito personal" />
      <div className="p-5 md:p-7 max-w-[820px] w-full mx-auto animate-rise">
        <div className="rounded-[20px] border border-[var(--border)] p-6 md:p-7 relative overflow-hidden" style={{ background: "radial-gradient(120% 140% at 0% 0%,#11171a,#0d0f12 55%)" }}>
          <div className="flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-[var(--text-3)] font-semibold font-mono mb-2.5"><PiggyBank size={15} className="text-[var(--income)]" /> Ahorro acumulado</div>
          <div className="text-[38px] md:text-[46px] font-extrabold tracking-tight leading-none tnum">{formatMXN(total)}</div>
          <div className="grid grid-cols-2 gap-2.5 mt-5 max-w-[420px]">
            <button onClick={() => { setForm({ amount: "", note: "" }); setModal("deposit"); }} className="inline-flex items-center justify-center gap-2 bg-[var(--income)] text-[#04130d] font-semibold text-[13px] py-3 rounded-[11px] hover:opacity-90 transition"><ArrowUpCircle size={16} /> Inyectar ahorro</button>
            <button onClick={() => { setForm({ amount: "", note: "" }); setModal("withdrawal"); }} className="inline-flex items-center justify-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--expense)] font-semibold text-[13px] py-3 rounded-[11px] hover:bg-[var(--surface-3)] transition"><ArrowDownCircle size={16} /> Retirar</button>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mt-[18px]">
          <div className="text-[14px] font-semibold mb-4">Historial de ahorro</div>
          {movs.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-3)] text-[13px]">Aún no tienes movimientos de ahorro.</div>
          ) : (
            <div className="space-y-1">
              {movs.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-[10px] grid place-items-center shrink-0 ${m.type === "deposit" ? "bg-[var(--income-soft)]" : "bg-[var(--expense-soft)]"}`}>
                      {m.type === "deposit" ? <ArrowUpCircle size={17} className="text-[var(--income)]" /> : <ArrowDownCircle size={17} className="text-[var(--expense)]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium truncate">{m.type === "deposit" ? "Inyección" : "Retiro"}{m.note ? <span className="text-[var(--text-3)] font-normal"> · {m.note}</span> : ""}</div>
                      <div className="text-[11px] text-[var(--text-3)]">{formatDate(m.date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[13.5px] font-semibold tnum" style={{ color: m.type === "deposit" ? "var(--income)" : "var(--expense)" }}>{m.type === "deposit" ? "+" : "−"}{formatMXN(m.amount)}</span>
                    <button onClick={() => del(m.id)} className="text-[var(--text-3)] hover:text-[var(--expense)] transition"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={!!modal} onClose={() => setModal("")} title={modal === "deposit" ? "Inyectar al ahorro" : "Retirar del ahorro"}>
        <Field label="Monto"><input autoFocus className={inputCls} type="number" inputMode="decimal" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
        <Field label="Nota" hint="(opcional)"><input className={inputCls} placeholder="Meta, motivo..." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
        <button onClick={save} disabled={saving} className={`w-full font-semibold text-[13px] py-3 rounded-[10px] mt-2 transition disabled:opacity-60 ${modal === "deposit" ? "bg-[var(--income)] text-[#04130d]" : "bg-[var(--expense)] text-[#1a0908]"}`}>{saving ? "Guardando..." : modal === "deposit" ? "Inyectar" : "Retirar"}</button>
      </Modal>
    </>
  );
}
