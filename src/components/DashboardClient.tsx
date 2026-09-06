"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, ArrowRight, Plus, Pencil, ChevronLeft, ChevronRight, Trash2, Wallet } from "lucide-react";
import { formatMXN, formatDate } from "@/lib/utils";
import Topbar from "@/components/Topbar";
import TxModal from "@/components/TxModal";
import Modal, { Field, inputCls } from "@/components/Modal";
import AlertsBanner from "@/components/AlertsBanner";

type Mov = { id: string; type: "income" | "expense"; amount: number; category: string; description: string; date: string };
type Biz = { id: string; name: string; capital: number };
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function DashboardClient({ movements, businesses, personalCash }: { movements: Mov[]; businesses: Biz[]; personalCash: number }) {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11
  const [txOpen, setTxOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [cashInput, setCashInput] = useState(String(personalCash || ""));
  const [savingCash, setSavingCash] = useState(false);

  const totalCapital = businesses.reduce((s, b) => s + b.capital, 0);

  const monthMovs = useMemo(() => movements
    .filter((m) => { const d = new Date(m.date); return d.getFullYear() === year && d.getMonth() === month; })
    .sort((a, b) => +new Date(b.date) - +new Date(a.date)), [movements, year, month]);
  const ingresos = monthMovs.filter((m) => m.type === "income").reduce((a, m) => a + m.amount, 0);
  const egresos = monthMovs.filter((m) => m.type === "expense").reduce((a, m) => a + m.amount, 0);

  function shift(delta: number) {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  }

  async function saveCash() {
    setSavingCash(true);
    const val = Math.max(0, parseFloat(cashInput) || 0);
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personalCash: val }) });
    setSavingCash(false); setCashOpen(false); router.refresh();
  }
  async function delMov(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <Topbar title="Dashboard" subtitle="Tus finanzas personales" onNew={() => setTxOpen(true)} />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise">
        <AlertsBanner />

        {/* Selector de mes */}
        <div className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-2.5 mb-[18px]">
          <button onClick={() => shift(-1)} className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-[var(--surface-2)] transition"><ChevronLeft size={18} /></button>
          <button onClick={() => setPickerOpen(true)} className="text-[15px] font-bold hover:text-[var(--income)] transition">{MESES[month]} {year}</button>
          <button onClick={() => shift(1)} className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-[var(--surface-2)] transition"><ChevronRight size={18} /></button>
        </div>

        {/* Tarjetas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] md:gap-[18px]">
          <button onClick={() => { setCashInput(String(personalCash || "")); setCashOpen(true); }} className="text-left bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px] hover:border-[#272d36] transition group">
            <div className="flex items-center justify-between"><div className="text-[12px] md:text-[12.5px] text-[var(--text-2)]">Dinero en Banco/Efectivo</div><Pencil size={13} className="text-[var(--text-3)] group-hover:text-[var(--text)]" /></div>
            <div className="text-[18px] md:text-[24px] font-bold tnum mt-1">{formatMXN(personalCash)}</div>
          </button>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12px] md:text-[12.5px] text-[var(--text-2)]">Ingresos del mes</div><div className="text-[18px] md:text-[24px] font-bold tnum text-[var(--income)] mt-1">{formatMXN(ingresos)}</div></div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12px] md:text-[12.5px] text-[var(--text-2)]">Egresos del mes</div><div className="text-[18px] md:text-[24px] font-bold tnum text-[var(--expense)] mt-1">{formatMXN(egresos)}</div></div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12px] md:text-[12.5px] text-[var(--text-2)]">Balance del mes</div><div className="text-[18px] md:text-[24px] font-bold tnum mt-1">{formatMXN(ingresos - egresos)}</div></div>
        </div>

        {/* Capital total de negocios */}
        <Link href={businesses[0] ? `/n/${businesses[0].id}` : "/cuenta"} className="block bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px] mt-[18px] hover:border-[#272d36] transition group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-[34px] h-[34px] rounded-[10px] grid place-items-center bg-[var(--surface-2)]"><Store size={17} className="text-[var(--income)]" /></div>
              <div><div className="text-[12.5px] text-[var(--text-2)]">Capital total en negocios</div><div className="text-[20px] font-bold tnum">{formatMXN(totalCapital)}</div></div>
            </div>
            <ArrowRight size={16} className="text-[var(--text-3)] group-hover:text-[var(--text)] transition" />
          </div>
        </Link>

        {/* Historial del mes */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mt-[18px]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[14px] font-semibold">Movimientos de {MESES[month]}</div>
            <button onClick={() => setTxOpen(true)} className="inline-flex items-center gap-1.5 bg-[var(--action)] text-white text-[12.5px] font-semibold px-3 py-2 rounded-[10px] hover:opacity-90 transition"><Plus size={14} strokeWidth={2.2} /> Movimiento</button>
          </div>
          {monthMovs.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-3)] text-[13px]">Sin movimientos en {MESES[month]} {year}.</div>
          ) : (
            <div className="space-y-1">
              {monthMovs.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-[10px] grid place-items-center shrink-0 ${m.type === "income" ? "bg-[var(--income-soft)]" : "bg-[var(--expense-soft)]"}`}>
                      {m.type === "income" ? <ArrowRight size={16} className="text-[var(--income)] -rotate-45" /> : <ArrowRight size={16} className="text-[var(--expense)] rotate-[135deg]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium truncate">{m.category || (m.type === "income" ? "Ingreso" : "Egreso")}{m.description ? <span className="text-[var(--text-3)] font-normal"> · {m.description}</span> : ""}</div>
                      <div className="text-[11px] text-[var(--text-3)]">{formatDate(m.date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[13.5px] font-semibold tnum" style={{ color: m.type === "income" ? "var(--income)" : "var(--expense)" }}>{m.type === "income" ? "+" : "−"}{formatMXN(m.amount)}</span>
                    <button onClick={() => delMov(m.id)} className="text-[var(--text-3)] hover:text-[var(--expense)] transition"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selector de mes (calendario anual) */}
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Ir a un mes">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setYear(year - 1)} className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-[var(--surface-2)]"><ChevronLeft size={18} /></button>
          <span className="text-[15px] font-bold">{year}</span>
          <button onClick={() => setYear(year + 1)} className="w-9 h-9 rounded-[10px] grid place-items-center hover:bg-[var(--surface-2)]"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MESES.map((mm, i) => {
            const active = i === month && year === year;
            return (
              <button key={mm} onClick={() => { setMonth(i); setPickerOpen(false); }} className={`py-3 rounded-[11px] text-[13px] font-semibold border transition ${i === month ? "bg-[var(--income-soft)] border-[var(--income)] text-[var(--income)]" : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)] hover:border-[#2a3038]"}`}>{mm.slice(0, 3)}</button>
            );
          })}
        </div>
      </Modal>

      {/* Editar efectivo/banco */}
      <Modal open={cashOpen} onClose={() => setCashOpen(false)} title="Dinero en Banco/Efectivo">
        <p className="text-[12px] text-[var(--text-3)] mb-3">Registra cuánto dinero personal tienes disponible (efectivo + banco). Actualízalo cuando cambie.</p>
        <Field label="Monto disponible"><input autoFocus className={inputCls} type="number" inputMode="decimal" placeholder="0" value={cashInput} onChange={(e) => setCashInput(e.target.value)} /></Field>
        <button onClick={saveCash} disabled={savingCash} className="w-full bg-[var(--action)] text-white font-semibold text-[13px] py-3 rounded-[10px] mt-2 hover:opacity-90 transition disabled:opacity-60">{savingCash ? "Guardando..." : "Guardar"}</button>
      </Modal>

      <TxModal open={txOpen} onClose={() => setTxOpen(false)} onSaved={() => router.refresh()} initialType="income" />
    </>
  );
}
