"use client";
import { useEffect, useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { formatMXN } from "@/lib/utils";
import Topbar from "@/components/Topbar";
import Modal, { Field, inputCls } from "@/components/Modal";

type Budget = { id: string; categoryName: string; color: string; limit: number; spent: number };
type Cat = { id: string; name: string; type: string };

export default function PresupuestosClient() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [b, c] = await Promise.all([fetch("/api/budgets"), fetch("/api/categories")]);
    setBudgets((await b.json()).budgets ?? []);
    const allCats = (await c.json()).categories ?? [];
    const expense = allCats.filter((x: Cat) => x.type === "expense");
    setCats(expense);
    if (expense[0]) setCategoryId(expense[0].id);
  };
  useEffect(() => { load(); }, []);

  async function save() {
    const value = parseFloat(limit);
    if (!value || !categoryId) return;
    setSaving(true);
    await fetch("/api/budgets", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, limit: value }) });
    setSaving(false); setOpen(false); setLimit(""); load();
  }

  return (
    <>
      <Topbar title="Presupuestos" subtitle="Límites por categoría y alertas" />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise">
        <div className="flex justify-end mb-[18px]">
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 bg-[var(--action)] text-white font-semibold text-[13px] px-3.5 py-2.5 rounded-[10px] hover:opacity-90 transition">
            <Plus size={15} strokeWidth={2.2} /> Nuevo presupuesto
          </button>
        </div>

        {budgets.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center text-[var(--text-3)] text-[13px]">
            Aún no tienes presupuestos. Crea uno para controlar cuánto gastas por categoría.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-[18px]">
            {budgets.map((b) => {
              const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
              const color = pct >= 100 ? "var(--expense)" : pct >= 80 ? "var(--gold)" : "var(--income)";
              return (
                <div key={b.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: b.color }} />
                      <span className="text-[14px] font-semibold">{b.categoryName}</span>
                    </div>
                    {pct >= 80 && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md font-mono"
                        style={{ background: `${color}1f`, color }}>
                        <AlertTriangle size={12} /> {pct >= 100 ? "Excedido" : "Cerca del límite"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-[22px] font-bold tnum" style={{ color }}>{formatMXN(b.spent)}</span>
                    <span className="text-[12.5px] text-[var(--text-3)] tnum">de {formatMXN(b.limit)}</span>
                  </div>
                  <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
                  </div>
                  <div className="flex justify-between mt-2 text-[11.5px] font-mono">
                    <span style={{ color }}>{pct}% usado</span>
                    <span className="text-[var(--text-3)]">Restan {formatMXN(Math.max(0, b.limit - b.spent))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo presupuesto">
        <Field label="Categoría">
          <select className={inputCls + " appearance-none cursor-pointer"} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Límite mensual">
          <input className={inputCls} type="number" inputMode="decimal" placeholder="4000" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </Field>
        <button onClick={save} disabled={saving} className="w-full bg-[var(--action)] text-white font-semibold text-[13px] py-3 rounded-[10px] mt-2 hover:opacity-90 transition disabled:opacity-60">
          {saving ? "Guardando..." : "Crear presupuesto"}
        </button>
      </Modal>
    </>
  );
}
