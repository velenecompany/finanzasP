"use client";
import { useEffect, useState } from "react";
import Modal, { Field, inputCls } from "@/components/Modal";

type Props = { open: boolean; onClose: () => void; onSaved: () => void; initialType?: "income" | "expense" };

export default function TxModal({ open, onClose, onSaved, initialType = "expense" }: Props) {
  const [type, setType] = useState<"income" | "expense">(initialType);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([]);
  const [expenseCats, setExpenseCats] = useState<string[]>([]);

  useEffect(() => { setType(initialType); }, [initialType, open]);

  useEffect(() => {
    if (!open) return;
    setAmount(""); setDesc(""); setCategory("");
    setDate(new Date().toISOString().slice(0, 10));
    (async () => {
      const [b, s] = await Promise.all([fetch("/api/businesses"), fetch("/api/settings")]);
      const biz = (await b.json()).businesses ?? [];
      setBusinesses(biz);
      const prefs = (await s.json()).prefs ?? {};
      setExpenseCats(prefs.expenseCategories ?? []);
    })();
  }, [open]);

  // categoría por defecto al cambiar de tipo
  useEffect(() => {
    if (type === "income") setCategory(businesses[0]?.name ?? "");
    else setCategory("");
  }, [type, businesses]);

  async function save() {
    const value = parseFloat(amount);
    if (!value) return;
    setSaving(true);
    await fetch("/api/transactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, amount: value, category, description: desc, date }),
    });
    // Guardar categoría de egreso nueva para reusar
    if (type === "expense" && category.trim() && !expenseCats.includes(category.trim())) {
      const next = [...expenseCats, category.trim()];
      await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expenseCategories: next }) });
    }
    setSaving(false); onSaved(); onClose();
  }

  const isIncome = type === "income";

  return (
    <Modal open={open} onClose={onClose} title="Movimiento nuevo">
      <div className="grid grid-cols-2 gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-1.5 mb-[15px]">
        <button onClick={() => setType("income")} className={`py-2.5 rounded-lg text-[13px] font-semibold transition ${isIncome ? "bg-[var(--income-soft)] text-[var(--income)]" : "text-[var(--text-2)]"}`}>Ingreso</button>
        <button onClick={() => setType("expense")} className={`py-2.5 rounded-lg text-[13px] font-semibold transition ${!isIncome ? "bg-[var(--expense-soft)] text-[var(--expense)]" : "text-[var(--text-2)]"}`}>Egreso</button>
      </div>

      <Field label="Monto">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" inputMode="decimal" placeholder="0" autoFocus className={inputCls} />
      </Field>

      {isIncome ? (
        <Field label="Categoría" hint="(negocio)">
          {businesses.length > 0 ? (
            <select className={inputCls + " appearance-none cursor-pointer"} value={category} onChange={(e) => setCategory(e.target.value)}>
              {businesses.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
              <option value="Otro">Otro</option>
            </select>
          ) : (
            <input className={inputCls} placeholder="Escribe la fuente del ingreso" value={category} onChange={(e) => setCategory(e.target.value)} />
          )}
        </Field>
      ) : (
        <Field label="Categoría" hint="(se guarda para reusar)">
          <input className={inputCls} placeholder="Ej. Gasolina, Comida, Renta..." value={category} onChange={(e) => setCategory(e.target.value)} />
          {expenseCats.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {expenseCats.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`text-[12px] px-2.5 py-1.5 rounded-lg border transition ${category === c ? "bg-[var(--expense-soft)] border-[var(--expense)] text-[var(--expense)]" : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)]"}`}>{c}</button>
              ))}
            </div>
          )}
        </Field>
      )}

      <Field label="Descripción" hint="(opcional)">
        <input className={inputCls} placeholder="Detalle del movimiento" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </Field>

      <Field label="Fecha">
        <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      <button onClick={save} disabled={saving || !amount}
        className={`w-full font-semibold text-[13px] py-3 rounded-[10px] mt-2 transition disabled:opacity-50 ${isIncome ? "bg-[var(--income)] text-[#04130d]" : "bg-[var(--expense)] text-[#1a0908]"}`}>
        {saving ? "Guardando..." : isIncome ? "Registrar ingreso" : "Registrar egreso"}
      </button>
    </Modal>
  );
}
