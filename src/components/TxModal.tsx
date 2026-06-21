"use client";
import { useEffect, useState } from "react";
import { X, Plus, Minus, CheckCircle2 } from "lucide-react";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

type Props = { open: boolean; onClose: () => void; onSaved: () => void; initialType?: "income" | "expense" };

export default function TxModal({ open, onClose, onSaved, initialType = "expense" }: Props) {
  const [type, setType] = useState<"income" | "expense">(initialType);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setType(initialType);
      setAmount(""); setDesc("");
      setDate(new Date().toISOString().slice(0, 10));
      setCategory(DEFAULT_CATEGORIES[initialType][0].name);
    }
  }, [open, initialType]);

  useEffect(() => { setCategory(DEFAULT_CATEGORIES[type][0].name); }, [type]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  if (!open) return null;

  async function save() {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    setSaving(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount: value, category, description: desc, date }),
    });
    setSaving(false);
    if (res.ok) { onSaved(); onClose(); }
  }

  const isIncome = type === "income";

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-[rgba(4,5,7,0.66)] backdrop-blur-sm z-[100] flex items-start justify-center px-5 pt-[8vh]">
      <div className="w-full max-w-[440px] bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 animate-pop">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[17px] font-bold tracking-tight">{isIncome ? "Registrar ingreso" : "Registrar gasto"}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-[9px] border border-[var(--border)] bg-[var(--surface-2)] grid place-items-center text-[var(--text-2)] hover:text-[var(--text)]"><X size={16} /></button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-1.5 mb-[18px]">
          <button onClick={() => setType("income")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition ${isIncome ? "bg-[var(--income-soft)] text-[var(--income)]" : "text-[var(--text-2)]"}`}>
            <Plus size={15} strokeWidth={2.2} /> Ingreso
          </button>
          <button onClick={() => setType("expense")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition ${!isIncome ? "bg-[var(--expense-soft)] text-[var(--expense)]" : "text-[var(--text-2)]"}`}>
            <Minus size={15} strokeWidth={2.2} /> Gasto
          </button>
        </div>

        <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Monto</label>
        <div className="flex items-center bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 mb-[15px] focus-within:border-[#2a3038]">
          <span className="text-2xl font-semibold text-[var(--text-3)]">$</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" inputMode="decimal" placeholder="0" autoFocus
            className="flex-1 bg-transparent outline-none text-[30px] font-bold py-3.5 px-2 w-full tnum" />
        </div>

        <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Categoría</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none mb-[15px] appearance-none cursor-pointer focus:border-[#2a3038]">
          {DEFAULT_CATEGORIES[type].map((c) => <option key={c.name}>{c.name}</option>)}
        </select>

        <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Descripción <span className="text-[var(--text-3)] font-normal">(opcional)</span></label>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej. Venta mayoreo Elf Bar"
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none mb-[15px] focus:border-[#2a3038]" />

        <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Fecha</label>
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date"
          className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none focus:border-[#2a3038] [color-scheme:dark]" />

        <div className="flex gap-2.5 mt-[22px]">
          <button onClick={onClose} className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-semibold text-[13px] px-4 py-3 rounded-[10px] hover:bg-[var(--surface-2)] transition">Cancelar</button>
          <button onClick={save} disabled={saving}
            className={`flex-1 inline-flex items-center justify-center gap-2 font-semibold text-[13px] py-3 rounded-[10px] transition disabled:opacity-60 ${isIncome ? "bg-[var(--income)] text-[#04130d]" : "bg-[var(--expense)] text-[#1a0908]"}`}>
            <CheckCircle2 size={15} /> {saving ? "Guardando..." : isIncome ? "Guardar ingreso" : "Guardar gasto"}
          </button>
        </div>
      </div>
    </div>
  );
}
