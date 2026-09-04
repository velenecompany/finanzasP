"use client";
import { useEffect, useState } from "react";
import { Plus, Package, ShoppingCart, ArrowDownCircle, TrendingUp, Wallet, Trash2, ArrowUpCircle, PackagePlus, Pencil } from "lucide-react";
import { formatMXN, formatDate } from "@/lib/utils";
import Topbar from "@/components/Topbar";
import Modal, { Field, inputCls } from "@/components/Modal";

type Product = { id: string; name: string; brand: string | null; flavor: string | null; stock: number; unitCost: string; priceRetail: string; priceWholesale: string; lowStockAlert: number };
type Sale = { id: string; quantity: number; unitPrice: string; profit: string; saleType: string; date: string; productName: string | null; flavor: string | null };
type Expense = { id: string; concept: string; amount: string; date: string };
type CapMov = { id: string; type: string; amount: string; note: string | null; date: string };
type Capital = { capital: number; injections: number; withdrawals: number; profit: number; expense: number; movements: CapMov[] };
type Purchase = { id: string; amount: number; note: string | null; date: string; invertido: number; restante: number; productos: { name: string; invested: number }[] };

const TABS = [["inventario", "Inventario", Package], ["ventas", "Ventas", ShoppingCart], ["gastos", "Gastos", ArrowDownCircle], ["salidas", "Salidas", PackagePlus], ["capital", "Capital", Wallet], ["ganancias", "Ganancias", TrendingUp]] as const;

export default function BusinessModule({ businessId, title, subtitle }: { businessId: string; title: string; subtitle: string }) {
  const [tab, setTab] = useState<string>("inventario");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cap, setCap] = useState<Capital | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [cash, setCash] = useState(0);
  const [cashInput, setCashInput] = useState("");
  const [modal, setModal] = useState<"" | "product" | "sale" | "expense" | "capital" | "purchase" | "cash">("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [pForm, setPForm] = useState({ name: "", brand: "", flavor: "", stock: "", unitCost: "", priceRetail: "", priceWholesale: "", purchaseId: "" });
  const [sForm, setSForm] = useState({ productId: "", quantity: "1", saleType: "menudeo", unitPrice: "" });
  const [eForm, setEForm] = useState({ concept: "", amount: "" });
  const [cForm, setCForm] = useState({ type: "injection", amount: "", note: "" });
  const [puForm, setPuForm] = useState({ amount: "", note: "" });

  const q = `?businessId=${businessId}`;
  const load = async () => {
    const [p, s, e, c, pu, bz] = await Promise.all([
      fetch("/api/vapes/products" + q), fetch("/api/vapes/sales" + q),
      fetch("/api/vapes/expenses" + q), fetch("/api/capital" + q), fetch("/api/purchases" + q),
      fetch("/api/businesses"),
    ]);
    const prods = (await p.json()).products ?? [];
    setProducts(prods); setSales((await s.json()).sales ?? []); setExpenses((await e.json()).expenses ?? []);
    setCap(await c.json()); setPurchases((await pu.json()).purchases ?? []);
    const mine = ((await bz.json()).businesses ?? []).find((x: any) => x.id === businessId);
    if (mine) setCash(Number(mine.cashAvailable ?? 0));
    if (prods[0] && !sForm.productId) setSForm((f) => ({ ...f, productId: prods[0].id }));
  };
  useEffect(() => { load(); }, [businessId]); // eslint-disable-line

  async function saveProduct() {
    if (!pForm.name || !pForm.unitCost) return;
    setSaving(true);
    await fetch("/api/vapes/products", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, name: pForm.name, brand: pForm.brand, flavor: pForm.flavor, stock: parseInt(pForm.stock) || 0,
        unitCost: parseFloat(pForm.unitCost) || 0, priceRetail: parseFloat(pForm.priceRetail) || 0, priceWholesale: parseFloat(pForm.priceWholesale) || 0,
        purchaseId: pForm.purchaseId || undefined }) });
    setSaving(false); setModal(""); setPForm({ name: "", brand: "", flavor: "", stock: "", unitCost: "", priceRetail: "", priceWholesale: "", purchaseId: "" }); load();
  }
  async function saveSale() {
    setErr(""); setSaving(true);
    const res = await fetch("/api/vapes/sales", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, productId: sForm.productId, quantity: parseInt(sForm.quantity) || 1, saleType: sForm.saleType, unitPrice: sForm.unitPrice === "" ? undefined : parseFloat(sForm.unitPrice) }) });
    setSaving(false);
    if (res.ok) { setModal(""); setSForm({ ...sForm, quantity: "1", unitPrice: "" }); load(); }
    else setErr((await res.json()).error ?? "Error");
  }
  async function saveExpense() {
    if (!eForm.concept || !eForm.amount) return;
    setSaving(true);
    await fetch("/api/vapes/expenses", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, concept: eForm.concept, amount: parseFloat(eForm.amount) }) });
    setSaving(false); setModal(""); setEForm({ concept: "", amount: "" }); load();
  }
  async function saveCapital() {
    const amt = parseFloat(cForm.amount);
    if (!amt) return;
    setSaving(true);
    await fetch("/api/capital", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, type: cForm.type, amount: amt, note: cForm.note }) });
    setSaving(false); setModal(""); setCForm({ type: "injection", amount: "", note: "" }); load();
  }
  async function delProduct(id: string) { if (confirm("¿Eliminar este producto?")) { await fetch(`/api/vapes/products?id=${id}`, { method: "DELETE" }); load(); } }
  async function delSale(id: string) { if (confirm("¿Eliminar esta venta? Se devolverá el stock.")) { await fetch(`/api/vapes/sales?id=${id}`, { method: "DELETE" }); load(); } }
  async function delExpense(id: string) { if (confirm("¿Eliminar este gasto?")) { await fetch(`/api/vapes/expenses?id=${id}`, { method: "DELETE" }); load(); } }
  async function delCapital(id: string) { if (confirm("¿Eliminar este movimiento de capital?")) { await fetch(`/api/capital?id=${id}`, { method: "DELETE" }); load(); } }

  async function savePurchase() {
    const amt = parseFloat(puForm.amount);
    if (!amt) return;
    setSaving(true);
    await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, amount: amt, note: puForm.note }) });
    setSaving(false); setModal(""); setPuForm({ amount: "", note: "" }); load();
  }
  async function delPurchase(id: string) {
    if (!confirm("¿Eliminar esta salida? Los productos ligados quedarán sin salida.")) return;
    await fetch(`/api/purchases?id=${id}`, { method: "DELETE" }); load();
  }

  // Precio de lista según producto + tipo (para precargar la venta, editable)
  function listPriceFor(productId: string, type: string): string {
    const prod = products.find((x) => x.id === productId);
    if (!prod) return "";
    return String(Number(type === "menudeo" ? prod.priceRetail : prod.priceWholesale));
  }
  function openSale() {
    const pid = sForm.productId || (products[0]?.id ?? "");
    setErr(""); setSForm((f) => ({ ...f, productId: pid, unitPrice: listPriceFor(pid, f.saleType) })); setModal("sale");
  }
  function openCash() { setCashInput(String(cash || "")); setModal("cash"); }
  async function saveCash() {
    setSaving(true);
    const val = Math.max(0, parseFloat(cashInput) || 0);
    await fetch("/api/businesses", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: businessId, cash: val }) });
    setCash(val); setSaving(false); setModal("");
  }

  const invValue = products.reduce((s, p) => s + p.stock * Number(p.unitCost), 0);
  const totalProfit = sales.reduce((s, v) => s + Number(v.profit), 0);
  const totalRevenue = sales.reduce((s, v) => s + Number(v.unitPrice) * v.quantity, 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const lowStock = products.filter((p) => p.stock <= p.lowStockAlert).length;

  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-[14px] md:gap-[18px] mb-[18px]">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12.5px] text-[var(--text-2)]">Capital del negocio</div><div className="text-[22px] md:text-[24px] font-bold tnum text-[var(--income)] mt-1">{formatMXN(cap?.capital ?? 0)}</div></div>
          <button onClick={openCash} className="text-left bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px] hover:border-[#272d36] transition group">
            <div className="flex items-center justify-between"><div className="text-[12.5px] text-[var(--text-2)]">Disponible (efectivo/banco)</div><Pencil size={13} className="text-[var(--text-3)] group-hover:text-[var(--text)]" /></div>
            <div className="text-[22px] md:text-[24px] font-bold tnum mt-1">{formatMXN(cash)}</div>
          </button>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12.5px] text-[var(--text-2)]">Valor inventario</div><div className="text-[22px] md:text-[24px] font-bold tnum mt-1">{formatMXN(invValue)}</div></div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12.5px] text-[var(--text-2)]">Utilidad ventas</div><div className="text-[22px] md:text-[24px] font-bold tnum mt-1">{formatMXN(totalProfit)}</div></div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[18px]"><div className="text-[12.5px] text-[var(--text-2)]">Stock bajo</div><div className="text-[22px] md:text-[24px] font-bold tnum mt-1" style={{ color: lowStock ? "var(--expense)" : "var(--text)" }}>{lowStock}</div></div>
        </div>

        <div className="flex gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-1.5 mb-[18px] w-full md:w-fit overflow-x-auto">
          {TABS.map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className={`inline-flex items-center gap-2 px-3 md:px-3.5 py-2 rounded-lg text-[12.5px] md:text-[13px] font-semibold transition whitespace-nowrap ${tab === id ? "bg-[var(--surface)] text-[var(--text)]" : "text-[var(--text-2)]"}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {tab === "inventario" && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[14px] font-semibold">Productos</div>
              <button onClick={() => setModal("product")} className="inline-flex items-center gap-2 bg-[var(--action)] text-white font-semibold text-[13px] px-3.5 py-2 rounded-[10px] hover:opacity-90 transition"><Plus size={15} strokeWidth={2.2} /> Nuevo producto</button>
            </div>
            {products.length === 0 ? <div className="text-center py-8 text-[var(--text-3)] text-[13px]">Sin productos todavía.</div> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[640px]">
                <thead><tr className="text-[11px] uppercase text-[var(--text-3)] font-semibold">
                  <th className="text-left pb-3 border-b border-[var(--border)]">Producto</th><th className="text-right pb-3 border-b border-[var(--border)]">Stock</th><th className="text-right pb-3 border-b border-[var(--border)]">Costo</th><th className="text-right pb-3 border-b border-[var(--border)]">Menudeo</th><th className="text-right pb-3 border-b border-[var(--border)]">Mayoreo</th><th className="pb-3 border-b border-[var(--border)] w-8"></th>
                </tr></thead>
                <tbody>{products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 border-b border-[var(--border)] text-[13px]"><b className="font-semibold">{p.brand ? p.brand + " " : ""}{p.name}</b>{p.flavor && <span className="text-[var(--text-3)] text-[12px] block">{p.flavor}</span>}</td>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] text-right tnum"><span style={{ color: p.stock <= p.lowStockAlert ? "var(--expense)" : "var(--text)" }}>{p.stock}</span></td>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] text-right tnum text-[var(--text-2)]">{formatMXN(p.unitCost)}</td>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] text-right tnum">{formatMXN(p.priceRetail)}</td>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] text-right tnum">{formatMXN(p.priceWholesale)}</td>
                    <td className="py-3 border-b border-[var(--border)] text-right"><button onClick={() => delProduct(p.id)} className="text-[var(--text-3)] hover:text-[var(--expense)] transition"><Trash2 size={15} /></button></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        )}

        {tab === "ventas" && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[14px] font-semibold">Historial de ventas</div>
              <button onClick={openSale} disabled={!products.length} className="inline-flex items-center gap-2 bg-[var(--action)] text-white font-semibold text-[13px] px-3.5 py-2 rounded-[10px] hover:opacity-90 transition disabled:opacity-40"><Plus size={15} strokeWidth={2.2} /> Registrar venta</button>
            </div>
            {sales.length === 0 ? <div className="text-center py-8 text-[var(--text-3)] text-[13px]">Sin ventas registradas.</div> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[560px]"><thead><tr className="text-[11px] uppercase text-[var(--text-3)] font-semibold">
                <th className="text-left pb-3 border-b border-[var(--border)]">Producto</th><th className="text-left pb-3 border-b border-[var(--border)]">Tipo</th><th className="text-right pb-3 border-b border-[var(--border)]">Cant.</th><th className="text-right pb-3 border-b border-[var(--border)]">Ingreso</th><th className="text-right pb-3 border-b border-[var(--border)]">Utilidad</th><th className="text-right pb-3 border-b border-[var(--border)]">Fecha</th><th className="pb-3 border-b border-[var(--border)] w-8"></th>
              </tr></thead><tbody>{sales.map((v) => (
                <tr key={v.id}>
                  <td className="py-3 border-b border-[var(--border)] text-[13px] font-medium">{v.productName ?? "—"}</td>
                  <td className="py-3 border-b border-[var(--border)] text-[13px]"><span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${v.saleType === "menudeo" ? "bg-[var(--action-soft)] text-[var(--action)]" : "bg-[var(--surface-2)] text-[var(--text-2)]"}`}>{v.saleType}</span></td>
                  <td className="py-3 border-b border-[var(--border)] text-[13px] text-right tnum">{v.quantity}</td>
                  <td className="py-3 border-b border-[var(--border)] text-[13px] text-right tnum">{formatMXN(Number(v.unitPrice) * v.quantity)}</td>
                  <td className="py-3 border-b border-[var(--border)] text-[13px] text-right tnum text-[var(--income)]">+{formatMXN(v.profit)}</td>
                  <td className="py-3 border-b border-[var(--border)] text-[13px] text-right text-[var(--text-2)]">{formatDate(v.date)}</td>
                  <td className="py-3 border-b border-[var(--border)] text-right"><button onClick={() => delSale(v.id)} className="text-[var(--text-3)] hover:text-[var(--expense)] transition"><Trash2 size={14} /></button></td>
                </tr>
              ))}</tbody></table></div>
            )}
          </div>
        )}

        {tab === "gastos" && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[14px] font-semibold">Salidas · <span className="text-[var(--expense)] tnum">{formatMXN(totalExpenses)}</span></div>
              <button onClick={() => setModal("expense")} className="inline-flex items-center gap-2 bg-[var(--action)] text-white font-semibold text-[13px] px-3.5 py-2 rounded-[10px] hover:opacity-90 transition"><Plus size={15} strokeWidth={2.2} /> Nuevo gasto</button>
            </div>
            {expenses.length === 0 ? <div className="text-center py-8 text-[var(--text-3)] text-[13px]">Sin gastos. Registra producción, marketing, envíos...</div> : (
              <table className="w-full"><thead><tr className="text-[11px] uppercase text-[var(--text-3)] font-semibold"><th className="text-left pb-3 border-b border-[var(--border)]">Concepto</th><th className="text-right pb-3 border-b border-[var(--border)]">Fecha</th><th className="text-right pb-3 border-b border-[var(--border)]">Monto</th><th className="pb-3 border-b border-[var(--border)] w-8"></th></tr></thead>
              <tbody>{expenses.map((e) => (<tr key={e.id}><td className="py-3 border-b border-[var(--border)] text-[13px] font-medium">{e.concept}</td><td className="py-3 border-b border-[var(--border)] text-[13px] text-right text-[var(--text-2)]">{formatDate(e.date)}</td><td className="py-3 border-b border-[var(--border)] text-[13px] text-right tnum text-[var(--expense)]">−{formatMXN(e.amount)}</td><td className="py-3 border-b border-[var(--border)] text-right"><button onClick={() => delExpense(e.id)} className="text-[var(--text-3)] hover:text-[var(--expense)] transition"><Trash2 size={14} /></button></td></tr>))}</tbody></table>
            )}
          </div>
        )}

        {tab === "capital" && (
          <>
            <div className="grid md:grid-cols-2 gap-[18px] mb-[18px]">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
                <div className="text-[12.5px] text-[var(--text-2)]">Capital actual del negocio</div>
                <div className="text-[30px] font-bold tnum text-[var(--income)] mt-1">{formatMXN(cap?.capital ?? 0)}</div>
                <div className="text-[11.5px] text-[var(--text-3)] mt-2 font-mono leading-relaxed">
                  Inyecciones {formatMXN(cap?.injections ?? 0)} − Retiros {formatMXN(cap?.withdrawals ?? 0)}<br />
                  + Utilidad {formatMXN(cap?.profit ?? 0)} − Gastos {formatMXN(cap?.expense ?? 0)}
                </div>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex flex-col justify-center gap-2.5">
                <button onClick={() => { setCForm({ type: "injection", amount: "", note: "" }); setModal("capital"); }} className="inline-flex items-center justify-center gap-2 bg-[var(--income)] text-[#04130d] font-semibold text-[13px] py-3 rounded-[11px] hover:opacity-90 transition"><ArrowUpCircle size={16} /> Inyectar capital</button>
                <button onClick={() => { setCForm({ type: "withdrawal", amount: "", note: "" }); setModal("capital"); }} className="inline-flex items-center justify-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--expense)] font-semibold text-[13px] py-3 rounded-[11px] hover:bg-[var(--surface-3)] transition"><ArrowDownCircle size={16} /> Retirar capital</button>
              </div>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
              <div className="text-[14px] font-semibold mb-4">Movimientos de capital</div>
              {!cap?.movements.length ? <div className="text-center py-8 text-[var(--text-3)] text-[13px]">Sin inyecciones ni retiros aún.</div> : (
                <table className="w-full"><tbody>{cap.movements.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] font-medium">{m.type === "injection" ? "Inyección" : "Retiro"}{m.note ? <span className="text-[var(--text-3)] font-normal"> · {m.note}</span> : ""}</td>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] text-right text-[var(--text-2)]">{formatDate(m.date)}</td>
                    <td className="py-3 border-b border-[var(--border)] text-[13px] text-right tnum" style={{ color: m.type === "injection" ? "var(--income)" : "var(--expense)" }}>{m.type === "injection" ? "+" : "−"}{formatMXN(m.amount)}</td>
                    <td className="py-3 border-b border-[var(--border)] text-right w-8"><button onClick={() => delCapital(m.id)} className="text-[var(--text-3)] hover:text-[var(--expense)] transition"><Trash2 size={14} /></button></td>
                  </tr>
                ))}</tbody></table>
              )}
            </div>
          </>
        )}

        {tab === "salidas" && (
          <>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-[18px]">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[14px] font-semibold">Salidas de dinero</div>
                <button onClick={() => setModal("purchase")} className="inline-flex items-center gap-2 bg-[var(--action)] text-white font-semibold text-[13px] px-3.5 py-2 rounded-[10px] hover:opacity-90 transition"><Plus size={15} strokeWidth={2.2} /> Registrar salida</button>
              </div>
              <p className="text-[12px] text-[var(--text-3)]">Dinero que sacas para comprar mercancía. Al dar de alta un producto, elige de qué salida viene y aquí verás cuánto ya convertiste en inventario.</p>
            </div>
            {purchases.length === 0 ? (
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center text-[var(--text-3)] text-[13px]">Sin salidas registradas.</div>
            ) : (
              <div className="space-y-[14px]">
                {purchases.map((pu) => {
                  const pct = pu.amount > 0 ? Math.min(100, Math.round((pu.invertido / pu.amount) * 100)) : 0;
                  return (
                    <div key={pu.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[14px] font-semibold">{pu.note || "Salida de dinero"}</div>
                          <div className="text-[11.5px] text-[var(--text-3)]">{formatDate(pu.date)}</div>
                        </div>
                        <button onClick={() => delPurchase(pu.id)} className="text-[var(--text-3)] hover:text-[var(--expense)] transition shrink-0"><Trash2 size={15} /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5 mt-3">
                        <div><div className="text-[11px] text-[var(--text-3)]">Salida</div><div className="text-[15px] font-bold tnum">{formatMXN(pu.amount)}</div></div>
                        <div><div className="text-[11px] text-[var(--text-3)]">En inventario</div><div className="text-[15px] font-bold tnum text-[var(--income)]">{formatMXN(pu.invertido)}</div></div>
                        <div><div className="text-[11px] text-[var(--text-3)]">Restante</div><div className="text-[15px] font-bold tnum" style={{ color: pu.restante < 0 ? "var(--expense)" : "var(--text)" }}>{formatMXN(pu.restante)}</div></div>
                      </div>
                      <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden mt-3"><div className="h-full rounded-full bg-[var(--income)] transition-all" style={{ width: pct + "%" }} /></div>
                      {pu.productos.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {pu.productos.map((x, i) => <span key={i} className="text-[11.5px] px-2 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)]">{x.name} · {formatMXN(x.invested)}</span>)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "ganancias" && (
          <div className="grid md:grid-cols-3 gap-[18px]">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5"><div className="text-[12.5px] text-[var(--text-2)]">Ingresos totales</div><div className="text-[26px] font-bold tnum mt-1">{formatMXN(totalRevenue)}</div></div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5"><div className="text-[12.5px] text-[var(--text-2)]">Gastos totales</div><div className="text-[26px] font-bold tnum text-[var(--expense)] mt-1">{formatMXN(totalExpenses)}</div></div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5"><div className="text-[12.5px] text-[var(--text-2)]">Utilidad neta</div><div className="text-[26px] font-bold tnum text-[var(--income)] mt-1">{formatMXN(totalProfit - totalExpenses)}</div><div className="text-[11.5px] text-[var(--text-3)] mt-1 font-mono">Margen {totalRevenue > 0 ? Math.round(((totalProfit - totalExpenses) / totalRevenue) * 100) : 0}%</div></div>
          </div>
        )}
      </div>

      <Modal open={modal === "product"} onClose={() => setModal("")} title="Nuevo producto">
        <Field label="Producto"><input className={inputCls} placeholder="Nombre del producto" value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Marca" hint="(opc.)"><input className={inputCls} placeholder="Marca" value={pForm.brand} onChange={(e) => setPForm({ ...pForm, brand: e.target.value })} /></Field>
          <Field label="Variante" hint="(opc.)"><input className={inputCls} placeholder="Variante / sabor / talla" value={pForm.flavor} onChange={(e) => setPForm({ ...pForm, flavor: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Existencia"><input className={inputCls} type="number" placeholder="20" value={pForm.stock} onChange={(e) => setPForm({ ...pForm, stock: e.target.value })} /></Field>
          <Field label="Costo unitario"><input className={inputCls} type="number" inputMode="decimal" placeholder="95" value={pForm.unitCost} onChange={(e) => setPForm({ ...pForm, unitCost: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio menudeo"><input className={inputCls} type="number" inputMode="decimal" placeholder="180" value={pForm.priceRetail} onChange={(e) => setPForm({ ...pForm, priceRetail: e.target.value })} /></Field>
          <Field label="Precio mayoreo"><input className={inputCls} type="number" inputMode="decimal" placeholder="140" value={pForm.priceWholesale} onChange={(e) => setPForm({ ...pForm, priceWholesale: e.target.value })} /></Field>
        </div>
        {purchases.length > 0 && (
          <Field label="¿Viene de una salida de dinero?" hint="(opcional)">
            <select className={inputCls + " appearance-none cursor-pointer"} value={pForm.purchaseId} onChange={(e) => setPForm({ ...pForm, purchaseId: e.target.value })}>
              <option value="">— Ninguna —</option>
              {purchases.map((pu) => <option key={pu.id} value={pu.id}>{(pu.note || "Salida")} · restante {formatMXN(pu.restante)}</option>)}
            </select>
          </Field>
        )}
        <button onClick={saveProduct} disabled={saving} className="w-full bg-[var(--action)] text-white font-semibold text-[13px] py-3 rounded-[10px] mt-2 hover:opacity-90 transition disabled:opacity-60">{saving ? "Guardando..." : "Agregar producto"}</button>
      </Modal>

      <Modal open={modal === "sale"} onClose={() => setModal("")} title="Registrar venta">
        {err && <div className="mb-3 text-[12.5px] text-[var(--expense)] bg-[var(--expense-soft)] rounded-[10px] px-3 py-2">{err}</div>}
        <Field label="Producto"><select className={inputCls + " appearance-none cursor-pointer"} value={sForm.productId} onChange={(e) => setSForm({ ...sForm, productId: e.target.value, unitPrice: listPriceFor(e.target.value, sForm.saleType) })}>{products.map((p) => <option key={p.id} value={p.id}>{p.brand ? p.brand + " " : ""}{p.name} {p.flavor ? `(${p.flavor})` : ""} — stock {p.stock}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad"><input className={inputCls} type="number" min="1" value={sForm.quantity} onChange={(e) => setSForm({ ...sForm, quantity: e.target.value })} /></Field>
          <Field label="Tipo"><select className={inputCls + " appearance-none cursor-pointer"} value={sForm.saleType} onChange={(e) => setSForm({ ...sForm, saleType: e.target.value, unitPrice: listPriceFor(sForm.productId, e.target.value) })}><option value="menudeo">Menudeo</option><option value="mayoreo">Mayoreo</option></select></Field>
        </div>
        <Field label="Precio de venta (c/u)" hint="editable"><input className={inputCls} type="number" inputMode="decimal" placeholder="0" value={sForm.unitPrice} onChange={(e) => setSForm({ ...sForm, unitPrice: e.target.value })} /></Field>
        <div className="text-[12px] text-[var(--text-2)] mb-1 font-mono">Total de la venta: {formatMXN((parseFloat(sForm.unitPrice) || 0) * (parseInt(sForm.quantity) || 0))}</div>
        <button onClick={saveSale} disabled={saving} className="w-full bg-[var(--income)] text-[#04130d] font-semibold text-[13px] py-3 rounded-[10px] mt-2 hover:opacity-90 transition disabled:opacity-60">{saving ? "Guardando..." : "Registrar venta"}</button>
      </Modal>

      <Modal open={modal === "expense"} onClose={() => setModal("")} title="Nuevo gasto del negocio">
        <Field label="Concepto"><input className={inputCls} placeholder="Compra de inventario, marketing..." value={eForm.concept} onChange={(e) => setEForm({ ...eForm, concept: e.target.value })} /></Field>
        <Field label="Monto"><input className={inputCls} type="number" inputMode="decimal" placeholder="0" value={eForm.amount} onChange={(e) => setEForm({ ...eForm, amount: e.target.value })} /></Field>
        <button onClick={saveExpense} disabled={saving} className="w-full bg-[var(--action)] text-white font-semibold text-[13px] py-3 rounded-[10px] mt-2 hover:opacity-90 transition disabled:opacity-60">{saving ? "Guardando..." : "Registrar gasto"}</button>
      </Modal>

      <Modal open={modal === "cash"} onClose={() => setModal("")} title="Disponible en efectivo/banco">
        <p className="text-[12px] text-[var(--text-3)] mb-3">Registra cuánto dinero líquido tienes de este negocio (efectivo + banco). Actualízalo cuando cambie.</p>
        <Field label="Monto disponible"><input autoFocus className={inputCls} type="number" inputMode="decimal" placeholder="0" value={cashInput} onChange={(e) => setCashInput(e.target.value)} /></Field>
        <button onClick={saveCash} disabled={saving} className="w-full bg-[var(--action)] text-white font-semibold text-[13px] py-3 rounded-[10px] mt-2 hover:opacity-90 transition disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>
      </Modal>

      <Modal open={modal === "purchase"} onClose={() => setModal("")} title="Registrar salida de dinero">
        <Field label="Monto que sacas"><input className={inputCls} type="number" inputMode="decimal" placeholder="0" value={puForm.amount} onChange={(e) => setPuForm({ ...puForm, amount: e.target.value })} /></Field>
        <Field label="¿Para qué es?" hint="(opcional)"><input className={inputCls} placeholder="Compra de mercancía, drop nuevo..." value={puForm.note} onChange={(e) => setPuForm({ ...puForm, note: e.target.value })} /></Field>
        <button onClick={savePurchase} disabled={saving} className="w-full bg-[var(--action)] text-white font-semibold text-[13px] py-3 rounded-[10px] mt-2 hover:opacity-90 transition disabled:opacity-60">{saving ? "Guardando..." : "Registrar salida"}</button>
      </Modal>

      <Modal open={modal === "capital"} onClose={() => setModal("")} title={cForm.type === "injection" ? "Inyectar capital" : "Retirar capital"}>
        <Field label="Monto"><input className={inputCls} type="number" inputMode="decimal" placeholder="0" value={cForm.amount} onChange={(e) => setCForm({ ...cForm, amount: e.target.value })} /></Field>
        <Field label="Nota" hint="(opcional)"><input className={inputCls} placeholder="Aporte inicial, retiro de utilidades..." value={cForm.note} onChange={(e) => setCForm({ ...cForm, note: e.target.value })} /></Field>
        <button onClick={saveCapital} disabled={saving} className={`w-full font-semibold text-[13px] py-3 rounded-[10px] mt-2 transition disabled:opacity-60 ${cForm.type === "injection" ? "bg-[var(--income)] text-[#04130d]" : "bg-[var(--expense)] text-[#1a0908]"}`}>{saving ? "Guardando..." : cForm.type === "injection" ? "Inyectar" : "Retirar"}</button>
      </Modal>
    </>
  );
}
