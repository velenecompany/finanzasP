"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash2, ChevronDown, Calculator } from "lucide-react";
import { formatMXN, formatDate } from "@/lib/utils";
import { DEFAULT_PREFS, computeReparto, type Prefs } from "@/lib/settings";
import Topbar from "@/components/Topbar";
import TxModal from "@/components/TxModal";

type Tx = { id: string; type: "income" | "expense"; amount: number; description: string; date: string };

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // lunes = 0
  x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function weekLabel(start: Date) {
  const end = new Date(start); end.setDate(end.getDate() + 6);
  const f = (x: Date) => x.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  return `${f(start)} – ${f(end)}`;
}

export default function FinanzasClient({ transactions }: { transactions: Tx[] }) {
  const [open, setOpen] = useState(false);
  const [initialType, setInitialType] = useState<"income" | "expense">("expense");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [groupBy, setGroupBy] = useState<"day" | "week">("day");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pago, setPago] = useState("");
  const router = useRouter();

  useEffect(() => {
    (async () => { setPrefs((await (await fetch("/api/settings")).json()).prefs); })();
  }, []);

  // último ingreso para prellenar el reparto
  useEffect(() => {
    const lastIncome = transactions.filter((t) => t.type === "income")[0];
    if (lastIncome && !pago) setPago(String(lastIncome.amount));
  }, [transactions]); // eslint-disable-line

  const now = new Date();
  const sMonth = startOfMonth(now), sWeek = startOfWeek(now);
  const sum = (pred: (t: Tx) => boolean) => transactions.filter(pred).reduce((a, t) => a + t.amount, 0);
  const incMonth = sum((t) => t.type === "income" && new Date(t.date) >= sMonth);
  const incWeek = sum((t) => t.type === "income" && new Date(t.date) >= sWeek);
  const expMonth = sum((t) => t.type === "expense" && new Date(t.date) >= sMonth);
  const expWeek = sum((t) => t.type === "expense" && new Date(t.date) >= sWeek);

  const openWith = (t: "income" | "expense") => { setInitialType(t); setOpen(true); };
  async function deleteTx(id: string) {
    if (!confirm("¿Eliminar este movimiento?")) return;
    await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  // agrupación por día o semana
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: Tx[]; sortKey: number }>();
    for (const t of transactions) {
      const d = new Date(t.date);
      let key: string, label: string, sortKey: number;
      if (groupBy === "day") {
        key = t.date.slice(0, 10);
        label = d.toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long" });
        sortKey = new Date(key).getTime();
      } else {
        const ws = startOfWeek(d);
        key = ws.toISOString().slice(0, 10);
        label = weekLabel(ws);
        sortKey = ws.getTime();
      }
      if (!map.has(key)) map.set(key, { label, items: [], sortKey });
      map.get(key)!.items.push(t);
    }
    return [...map.entries()].map(([key, v]) => {
      const inc = v.items.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0);
      const exp = v.items.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0);
      return { key, ...v, inc, exp };
    }).sort((a, b) => b.sortKey - a.sortKey);
  }, [transactions, groupBy]);

  // primer grupo abierto por defecto
  useEffect(() => { if (groups[0]) setExpanded(new Set([groups[0].key])); }, [groupBy]); // eslint-disable-line
  const toggle = (k: string) => setExpanded((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const rep = computeReparto(parseFloat(pago) || 0, prefs);

  const StatCard = ({ label, val, color }: { label: string; val: number; color: string }) => (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]">
      <div className="text-[12.5px] text-[var(--text-2)] font-medium">{label}</div>
      <div className="text-[22px] md:text-[24px] font-bold tracking-tight mt-1 tnum" style={{ color }}>{formatMXN(val)}</div>
    </div>
  );

  return (
    <>
      <Topbar title="Finanzas" subtitle="Ingresos, gastos y reparto" onNew={() => openWith("expense")} />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[14px] md:gap-[18px]">
          <StatCard label="Ingresos del mes" val={incMonth} color="var(--income)" />
          <StatCard label="Ingresos de la semana" val={incWeek} color="var(--income)" />
          <StatCard label="Gastos del mes" val={expMonth} color="var(--expense)" />
          <StatCard label="Gastos de la semana" val={expWeek} color="var(--expense)" />
        </div>

        {/* REPARTO AUTOMÁTICO DEL PAGO */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mt-[18px]">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-[9px] bg-[var(--action-soft)] grid place-items-center"><Calculator size={16} className="text-[var(--action)]" /></div>
            <div className="text-[14px] font-semibold">Reparto de tu pago</div>
          </div>
          <div className="text-[12px] text-[var(--text-3)] mb-4">Aparta tus fijos y reparte el resto. Edita montos y % en Ajustes.</div>

          <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">¿De cuánto fue tu pago?</label>
          <div className="flex items-center bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 mb-4 max-w-[260px] focus-within:border-[#2a3038]">
            <span className="text-[22px] font-semibold text-[var(--text-3)]">$</span>
            <input value={pago} onChange={(e) => setPago(e.target.value)} type="number" inputMode="decimal" placeholder="10000"
              className="flex-1 bg-transparent outline-none text-[26px] font-bold py-2.5 px-2 w-full tnum" />
          </div>

          <div className="space-y-2.5">
            <Row label="Pago" value={rep.pago} bold />
            <Row label={`Carro`} value={-prefs.fixed.carro} sub />
            <Row label={`Gasolina`} value={-prefs.fixed.gasolina} sub />
            <Row label={`Comida`} value={-prefs.fixed.comida} sub />
            <div className="border-t border-[var(--border)] my-1" />
            <Row label="Disponible" value={rep.disponible} bold />
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <Bucket label={`Colchón ${prefs.splits.colchon}%`} value={rep.colchon} color="var(--income)" />
              <Bucket label={`Reinversión ${prefs.splits.reinversion}%`} value={rep.reinversion} color="var(--action)" />
              <Bucket label={`Libre ${prefs.splits.libre}%`} value={rep.libre} color="var(--gold)" />
            </div>
          </div>
        </div>

        {/* HISTORIAL AGRUPADO */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mt-[18px]">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="text-[14px] font-semibold">Movimientos</div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex gap-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-[10px] p-1">
                <button onClick={() => setGroupBy("day")} className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition ${groupBy === "day" ? "bg-[var(--surface)] text-[var(--text)]" : "text-[var(--text-2)]"}`}>Por día</button>
                <button onClick={() => setGroupBy("week")} className={`px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition ${groupBy === "week" ? "bg-[var(--surface)] text-[var(--text)]" : "text-[var(--text-2)]"}`}>Por semana</button>
              </div>
              <button onClick={() => openWith("income")} className="inline-flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] text-[12.5px] font-semibold px-3 py-2 rounded-[10px] hover:bg-[var(--surface-2)] transition"><Plus size={14} strokeWidth={2.2} className="text-[var(--income)]" /> Ingreso</button>
              <button onClick={() => openWith("expense")} className="inline-flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] text-[12.5px] font-semibold px-3 py-2 rounded-[10px] hover:bg-[var(--surface-2)] transition"><Minus size={14} strokeWidth={2.2} className="text-[var(--expense)]" /> Gasto</button>
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-3)] text-[13px]">Aún no hay movimientos. Registra tu primer ingreso o gasto.</div>
          ) : (
            <div className="space-y-2.5">
              {groups.map((g) => {
                const isOpen = expanded.has(g.key);
                return (
                  <div key={g.key} className="border border-[var(--border)] rounded-[14px] overflow-hidden">
                    <button onClick={() => toggle(g.key)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-2)] transition">
                      <div className="flex items-center gap-2.5">
                        <ChevronDown size={16} className={`text-[var(--text-3)] transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                        <span className="text-[13px] font-semibold capitalize">{g.label}</span>
                        <span className="text-[11px] text-[var(--text-3)]">· {g.items.length} mov.</span>
                      </div>
                      <div className="flex items-center gap-3 text-[12.5px] font-mono tnum">
                        {g.inc > 0 && <span className="text-[var(--income)]">+{formatMXN(g.inc)}</span>}
                        {g.exp > 0 && <span className="text-[var(--expense)]">−{formatMXN(g.exp)}</span>}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-1.5 border-t border-[var(--border)]">
                        {g.items.map((t) => (
                          <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium truncate">{t.description || (t.type === "income" ? "Ingreso" : "Gasto")}</div>
                              <div className="text-[11px] text-[var(--text-3)]">{formatDate(t.date)}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[13px] font-semibold tnum" style={{ color: t.type === "income" ? "var(--income)" : "var(--expense)" }}>{t.type === "income" ? "+" : "−"}{formatMXN(t.amount)}</span>
                              <button onClick={() => deleteTx(t.id)} className="text-[var(--text-3)] hover:text-[var(--expense)] transition"><Trash2 size={15} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <TxModal open={open} onClose={() => setOpen(false)} onSaved={() => router.refresh()} initialType={initialType} />
    </>
  );
}

function Row({ label, value, bold, sub }: { label: string; value: number; bold?: boolean; sub?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${sub ? "pl-3" : ""}`}>
      <span className={`text-[13px] ${bold ? "font-semibold" : "text-[var(--text-2)]"}`}>{label}</span>
      <span className={`tnum text-[13.5px] ${bold ? "font-bold" : ""}`} style={{ color: value < 0 ? "var(--expense)" : bold ? "var(--text)" : "var(--text-2)" }}>
        {value < 0 ? "−" : ""}{formatMXN(Math.abs(value))}
      </span>
    </div>
  );
}

function Bucket({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-[12px] p-3 text-center">
      <div className="text-[11px] text-[var(--text-2)] mb-1 leading-tight">{label}</div>
      <div className="text-[15px] font-bold tnum" style={{ color }}>{formatMXN(value)}</div>
    </div>
  );
}
