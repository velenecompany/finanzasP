"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatMXN, formatDate } from "@/lib/utils";
import Topbar from "@/components/Topbar";
import Modal, { Field, inputCls } from "@/components/Modal";

type Card = { id: string; name: string; creditLimit: string; currentBalance: string; cutoffDay: number | null; paymentDay: number | null };
type Mov = { id: string; type: string; amount: string; description: string | null; date: string };

const GRADIENTS = ["linear-gradient(135deg,#2A1240,#160A22)", "linear-gradient(135deg,#0C2233,#08141D)", "linear-gradient(135deg,#1B2A1F,#0A1711)", "linear-gradient(135deg,#2A1A12,#1A0E08)"];

export default function TarjetasClient() {
  const [cards, setCards] = useState<Card[]>([]);
  const [openCard, setOpenCard] = useState(false);
  const [openTx, setOpenTx] = useState(false);
  const [editId, setEditId] = useState<string>("");
  const [activeCard, setActiveCard] = useState<string>("");
  const [movs, setMovs] = useState<Mov[]>([]);
  const [cardForm, setCardForm] = useState({ name: "", creditLimit: "", cutoffDay: "", paymentDay: "" });
  const [txForm, setTxForm] = useState({ type: "charge", amount: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => setCards((await (await fetch("/api/cards")).json()).cards ?? []);
  useEffect(() => { load(); }, []);

  const loadMovs = async (cardId: string) => {
    setActiveCard(cardId);
    setMovs((await (await fetch(`/api/cards/transactions?cardId=${cardId}`)).json()).transactions ?? []);
  };

  function openNew() {
    setEditId(""); setCardForm({ name: "", creditLimit: "", cutoffDay: "", paymentDay: "" }); setOpenCard(true);
  }
  function openEdit(c: Card) {
    setEditId(c.id);
    setCardForm({ name: c.name, creditLimit: String(Number(c.creditLimit)), cutoffDay: c.cutoffDay ? String(c.cutoffDay) : "", paymentDay: c.paymentDay ? String(c.paymentDay) : "" });
    setOpenCard(true);
  }

  async function saveCard() {
    const lim = parseFloat(cardForm.creditLimit);
    if (!cardForm.name || !lim) return;
    setSaving(true);
    const body = { name: cardForm.name, creditLimit: lim, cutoffDay: parseInt(cardForm.cutoffDay) || undefined, paymentDay: parseInt(cardForm.paymentDay) || undefined };
    await fetch("/api/cards", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editId ? { ...body, id: editId } : body),
    });
    setSaving(false); setOpenCard(false); load();
  }

  async function deleteCard(id: string) {
    if (!confirm("¿Eliminar esta tarjeta y todos sus movimientos?")) return;
    await fetch(`/api/cards?id=${id}`, { method: "DELETE" });
    if (activeCard === id) { setActiveCard(""); setMovs([]); }
    load();
  }

  async function saveTx() {
    const amt = parseFloat(txForm.amount);
    if (!amt || !activeCard) return;
    setSaving(true);
    await fetch("/api/cards/transactions", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: activeCard, type: txForm.type, amount: amt, description: txForm.description }) });
    setSaving(false); setOpenTx(false); setTxForm({ type: "charge", amount: "", description: "" });
    load(); loadMovs(activeCard);
  }

  async function deleteMov(id: string) {
    if (!confirm("¿Eliminar este movimiento? Se ajustará el saldo.")) return;
    await fetch(`/api/cards/transactions?id=${id}`, { method: "DELETE" });
    load(); loadMovs(activeCard);
  }

  const totalLimit = cards.reduce((s, c) => s + Number(c.creditLimit), 0);
  const totalBalance = cards.reduce((s, c) => s + Number(c.currentBalance), 0);
  const available = totalLimit - totalBalance;
  const util = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
  const activeName = cards.find((c) => c.id === activeCard)?.name;

  return (
    <>
      <Topbar title="Tarjetas de crédito" subtitle="Límites, utilización y cortes" />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
          {cards.map((c, i) => {
            const lim = Number(c.creditLimit), bal = Number(c.currentBalance);
            const u = lim > 0 ? Math.round((bal / lim) * 100) : 0;
            return (
              <div key={c.id} className="rounded-[18px] p-[22px] relative overflow-hidden min-h-[200px] flex flex-col justify-between border border-[var(--border)]" style={{ background: GRADIENTS[i % 4] }}>
                <div className="flex justify-between items-start relative z-10">
                  <div className="font-bold text-[15px] text-white">{c.name}</div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(c)} className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 grid place-items-center text-white transition"><Pencil size={13} /></button>
                    <button onClick={() => deleteCard(c.id)} className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 grid place-items-center text-white transition"><Trash2 size={13} /></button>
                  </div>
                </div>
                <div className="font-mono text-[15px] tracking-[0.18em] text-white/60 relative z-10 my-1.5">•••• •••• •••• ••••</div>
                <div className="relative z-10">
                  <div className="flex justify-between text-[11px] text-white/60 mb-1.5 font-mono"><span>Utilización</span><span>{u}%</span></div>
                  <div className="h-1.5 bg-white/15 rounded-full overflow-hidden"><div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${u}%` }} /></div>
                  <div className="flex justify-between mt-3 text-[11.5px]">
                    <div><span className="text-white/55 block">Disponible</span><b className="text-white text-[13px] tnum">{formatMXN(lim - bal)}</b></div>
                    <div><span className="text-white/55 block">Límite</span><b className="text-white text-[13px] tnum">{formatMXN(lim)}</b></div>
                    {c.cutoffDay && <div><span className="text-white/55 block">Corte</span><b className="text-white text-[13px]">Día {c.cutoffDay}</b></div>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => { setActiveCard(c.id); setOpenTx(true); }} className="text-[12px] font-semibold text-white bg-white/15 hover:bg-white/25 rounded-lg py-2 transition">+ Movimiento</button>
                    <button onClick={() => loadMovs(c.id)} className="text-[12px] font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg py-2 transition">Ver historial</button>
                  </div>
                </div>
              </div>
            );
          })}
          <div onClick={openNew} className="bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-[18px] min-h-[200px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[var(--surface-2)] transition">
            <div className="w-10 h-10 rounded-[10px] bg-[var(--action-soft)] grid place-items-center"><Plus size={20} className="text-[var(--action)]" /></div>
            <div className="text-center"><b className="text-[14px]">Agregar tarjeta</b><div className="text-[12px] text-[var(--text-3)] mt-0.5">Nu, Klar, etc.</div></div>
          </div>
        </div>

        {cards.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px] mt-[18px]">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12.5px] text-[var(--text-2)]">Crédito disponible</div><div className="text-[24px] font-bold tnum text-[var(--income)] mt-1">{formatMXN(available)}</div></div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12.5px] text-[var(--text-2)]">Utilización global</div><div className="text-[24px] font-bold tnum mt-1" style={{ color: util >= 50 ? "var(--gold)" : "var(--text)" }}>{util}%</div></div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12.5px] text-[var(--text-2)]">Deuda total</div><div className="text-[24px] font-bold tnum text-[var(--expense)] mt-1">{formatMXN(totalBalance)}</div></div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12.5px] text-[var(--text-2)]">Límite total</div><div className="text-[24px] font-bold tnum mt-1">{formatMXN(totalLimit)}</div></div>
          </div>
        )}

        {activeCard && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mt-[18px]">
            <div className="text-[14px] font-semibold mb-4">Movimientos de {activeName}</div>
            {movs.length === 0 ? <div className="text-center py-6 text-[var(--text-3)] text-[13px]">Sin movimientos en esta tarjeta.</div> : (
              <table className="w-full"><tbody>
                {movs.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] font-medium">{m.description || (m.type === "charge" ? "Compra" : "Pago")}</td>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] text-[var(--text-2)]">{formatDate(m.date)}</td>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] text-right tnum" style={{ color: m.type === "charge" ? "var(--expense)" : "var(--income)" }}>{m.type === "charge" ? "−" : "+"}{formatMXN(m.amount)}</td>
                    <td className="py-3 border-b border-[var(--border)] text-right w-10"><button onClick={() => deleteMov(m.id)} className="text-[var(--text-3)] hover:text-[var(--expense)] transition"><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
        )}
      </div>

      <Modal open={openCard} onClose={() => setOpenCard(false)} title={editId ? "Editar tarjeta" : "Agregar tarjeta"}>
        <Field label="Nombre"><input className={inputCls} placeholder="Nu México" value={cardForm.name} onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} /></Field>
        <Field label="Límite de crédito"><input className={inputCls} type="number" inputMode="decimal" placeholder="2000" value={cardForm.creditLimit} onChange={(e) => setCardForm({ ...cardForm, creditLimit: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Día de corte" hint="(1-31)"><input className={inputCls} type="number" placeholder="15" value={cardForm.cutoffDay} onChange={(e) => setCardForm({ ...cardForm, cutoffDay: e.target.value })} /></Field>
          <Field label="Día de pago" hint="(1-31)"><input className={inputCls} type="number" placeholder="5" value={cardForm.paymentDay} onChange={(e) => setCardForm({ ...cardForm, paymentDay: e.target.value })} /></Field>
        </div>
        <button onClick={saveCard} disabled={saving} className="w-full bg-[var(--action)] text-white font-semibold text-[13px] py-3 rounded-[10px] mt-2 hover:opacity-90 transition disabled:opacity-60">{saving ? "Guardando..." : editId ? "Guardar cambios" : "Agregar tarjeta"}</button>
      </Modal>

      <Modal open={openTx} onClose={() => setOpenTx(false)} title="Movimiento de tarjeta">
        <div className="grid grid-cols-2 gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-1.5 mb-[15px]">
          <button onClick={() => setTxForm({ ...txForm, type: "charge" })} className={`py-2.5 rounded-lg text-[13px] font-semibold transition ${txForm.type === "charge" ? "bg-[var(--expense-soft)] text-[var(--expense)]" : "text-[var(--text-2)]"}`}>Compra</button>
          <button onClick={() => setTxForm({ ...txForm, type: "payment" })} className={`py-2.5 rounded-lg text-[13px] font-semibold transition ${txForm.type === "payment" ? "bg-[var(--income-soft)] text-[var(--income)]" : "text-[var(--text-2)]"}`}>Pago</button>
        </div>
        <Field label="Monto"><input className={inputCls} type="number" inputMode="decimal" placeholder="0" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })} /></Field>
        <Field label="Descripción" hint="(opcional)"><input className={inputCls} placeholder="Súper, gasolina..." value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} /></Field>
        <button onClick={saveTx} disabled={saving} className="w-full bg-[var(--action)] text-white font-semibold text-[13px] py-3 rounded-[10px] mt-2 hover:opacity-90 transition disabled:opacity-60">{saving ? "Guardando..." : "Registrar"}</button>
      </Modal>
    </>
  );
}
