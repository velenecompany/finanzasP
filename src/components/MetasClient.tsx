"use client";
import { useEffect, useState } from "react";
import { Plus, Target, TrendingUp } from "lucide-react";
import { formatMXN } from "@/lib/utils";
import Topbar from "@/components/Topbar";
import Modal, { Field, inputCls } from "@/components/Modal";

type Goal = { id: string; name: string; targetAmount: string; currentAmount: string; targetDate: string | null; priority: number };

const PRIO = { 1: { t: "Alta", c: "var(--expense)" }, 2: { t: "Media", c: "var(--gold)" }, 3: { t: "Baja", c: "var(--text-3)" } } as Record<number, { t: string; c: string }>;

export default function MetasClient() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", targetDate: "", priority: "2" });
  const [saving, setSaving] = useState(false);

  const load = async () => setGoals((await (await fetch("/api/goals")).json()).goals ?? []);
  useEffect(() => { load(); }, []);

  async function save() {
    const target = parseFloat(form.targetAmount);
    if (!form.name || !target) return;
    setSaving(true);
    await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, targetAmount: target, targetDate: form.targetDate || undefined, priority: Number(form.priority) }) });
    setSaving(false); setOpen(false); setForm({ name: "", targetAmount: "", targetDate: "", priority: "2" }); load();
  }

  async function contribute(id: string) {
    const v = prompt("¿Cuánto quieres aportar a esta meta?");
    const amount = v ? parseFloat(v) : NaN;
    if (!amount || amount <= 0) return;
    await fetch("/api/goals", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, addAmount: amount }) });
    load();
  }

  const monthsLeft = (date: string | null) => {
    if (!date) return null;
    const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
    return Math.max(1, Math.ceil(diff));
  };

  return (
    <>
      <Topbar title="Metas financieras" subtitle="Objetivos, progreso y aporte mensual" />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise">
        <div className="flex justify-end mb-[18px]">
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-[var(--action)] text-white font-semibold text-[13px] px-3.5 py-2.5 rounded-[10px] hover:opacity-90 transition">
            <Plus size={15} strokeWidth={2.2} /> Nueva meta
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center text-[var(--text-3)] text-[13px]">
            Aún no tienes metas. Crea una: fondo de emergencia, capital para VELÉ, un viaje...
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-[18px]">
            {goals.map((g) => {
              const cur = Number(g.currentAmount), tgt = Number(g.targetAmount);
              const pct = tgt > 0 ? Math.round((cur / tgt) * 100) : 0;
              const m = monthsLeft(g.targetDate);
              const monthly = m ? (tgt - cur) / m : null;
              const prio = PRIO[g.priority] ?? PRIO[2];
              return (
                <div key={g.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-[10px] bg-[var(--surface-2)] grid place-items-center"><Target size={17} style={{ color: prio.c }} /></div>
                      <div>
                        <div className="text-[14px] font-semibold">{g.name}</div>
                        <div className="text-[11px] font-mono" style={{ color: prio.c }}>Prioridad {prio.t}</div>
                      </div>
                    </div>
                    <button onClick={() => contribute(g.id)} className="text-[12px] font-semibold text-[var(--income)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 hover:bg-[var(--surface-2)] transition">+ Aportar</button>
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-[22px] font-bold tnum text-[var(--income)]">{formatMXN(cur)}</span>
                    <span className="text-[12.5px] text-[var(--text-3)] tnum">de {formatMXN(tgt)}</span>
                  </div>
                  <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--income)] transition-all duration-700" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <div className="flex justify-between mt-3 text-[11.5px]">
                    <span className="font-mono text-[var(--income)]">{pct}%</span>
                    {monthly !== null && monthly > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-[var(--text-2)]"><TrendingUp size={13} /> Aporta {formatMXN(monthly)}/mes · {m} meses</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva meta">
        <Field label="Nombre"><input className={inputCls} placeholder="Capital para VELÉ" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Monto objetivo"><input className={inputCls} type="number" inputMode="decimal" placeholder="50000" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} /></Field>
        <Field label="Fecha objetivo" hint="(opcional)"><input className={inputCls} type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></Field>
        <Field label="Prioridad">
          <select className={inputCls + " appearance-none cursor-pointer"} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="1">Alta</option><option value="2">Media</option><option value="3">Baja</option>
          </select>
        </Field>
        <button onClick={save} disabled={saving} className="w-full bg-[var(--action)] text-white font-semibold text-[13px] py-3 rounded-[10px] mt-2 hover:opacity-90 transition disabled:opacity-60">{saving ? "Guardando..." : "Crear meta"}</button>
      </Modal>
    </>
  );
}
