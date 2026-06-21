"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatMXN, formatDate } from "@/lib/utils";
import Topbar from "@/components/Topbar";
import Modal, { Field, inputCls } from "@/components/Modal";

type Debt = { id: string; creditor: string; totalAmount: string; remaining: string; interestRate: string | null; dueDate: string | null };

export default function DeudasClient() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ creditor: "", totalAmount: "", interestRate: "", dueDate: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => setDebts((await (await fetch("/api/debts")).json()).debts ?? []);
  useEffect(() => { load(); }, []);

  async function save() {
    const total = parseFloat(form.totalAmount);
    if (!form.creditor || !total) return;
    setSaving(true);
    await fetch("/api/debts", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creditor: form.creditor, totalAmount: total, interestRate: parseFloat(form.interestRate) || 0, dueDate: form.dueDate || undefined }) });
    setSaving(false); setOpen(false); setForm({ creditor: "", totalAmount: "", interestRate: "", dueDate: "" }); load();
  }

  async function deleteDebt(id: string) {
    if (!confirm("¿Eliminar esta deuda?")) return;
    await fetch(`/api/debts?id=${id}`, { method: "DELETE" });
    load();
  }

  async function pay(id: string) {
    const v = prompt("¿De cuánto es el pago?");
    const amount = v ? parseFloat(v) : NaN;
    if (!amount || amount <= 0) return;
    await fetch("/api/debts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, payment: amount }) });
    load();
  }

  const totalDebt = debts.reduce((s, d) => s + Number(d.remaining), 0);

  return (
    <>
      <Topbar title="Deudas" subtitle="Acreedores, saldos y vencimientos" />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise">
        <div className="flex items-center justify-between mb-[18px]">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-5 py-3">
            <span className="text-[12px] text-[var(--text-2)]">Deuda total pendiente</span>
            <div className="text-[22px] font-bold tnum text-[var(--expense)]">{formatMXN(totalDebt)}</div>
          </div>
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-[var(--action)] text-white font-semibold text-[13px] px-3.5 py-2.5 rounded-[10px] hover:opacity-90 transition">
            <Plus size={15} strokeWidth={2.2} /> Nueva deuda
          </button>
        </div>

        {debts.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center text-[var(--text-3)] text-[13px]">Sin deudas registradas. 🎉</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-[18px]">
            {debts.map((d) => {
              const total = Number(d.totalAmount), rem = Number(d.remaining);
              const paid = total - rem;
              const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
              return (
                <div key={d.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[14px] font-semibold">{d.creditor}</div>
                      <div className="text-[11.5px] text-[var(--text-3)] font-mono">
                        {d.interestRate && Number(d.interestRate) > 0 ? `${d.interestRate}% interés` : "Sin interés"}
                        {d.dueDate ? ` · vence ${formatDate(d.dueDate)}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => pay(d.id)} className="text-[12px] font-semibold text-[var(--income)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 hover:bg-[var(--surface-2)] transition">Pagar</button>
                      <button onClick={() => deleteDebt(d.id)} className="w-8 grid place-items-center text-[var(--text-3)] hover:text-[var(--expense)] border border-[var(--border)] rounded-lg transition"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-[22px] font-bold tnum text-[var(--expense)]">{formatMXN(rem)}</span>
                    <span className="text-[12.5px] text-[var(--text-3)] tnum">de {formatMXN(total)}</span>
                  </div>
                  <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--income)] transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 text-[11.5px] font-mono text-[var(--income)]">{pct}% liquidado</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva deuda">
        <Field label="Acreedor"><input className={inputCls} placeholder="Préstamo proveedor" value={form.creditor} onChange={(e) => setForm({ ...form, creditor: e.target.value })} /></Field>
        <Field label="Monto total"><input className={inputCls} type="number" inputMode="decimal" placeholder="10000" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} /></Field>
        <Field label="Tasa de interés %" hint="(opcional)"><input className={inputCls} type="number" inputMode="decimal" placeholder="0" value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} /></Field>
        <Field label="Fecha límite" hint="(opcional)"><input className={inputCls} type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
        <button onClick={save} disabled={saving} className="w-full bg-[var(--action)] text-white font-semibold text-[13px] py-3 rounded-[10px] mt-2 hover:opacity-90 transition disabled:opacity-60">{saving ? "Guardando..." : "Registrar deuda"}</button>
      </Modal>
    </>
  );
}
