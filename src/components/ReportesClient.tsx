"use client";
import { useState } from "react";
import { FileText, Download, Wallet, CreditCard, ShoppingCart, TrendingUp } from "lucide-react";
import { formatMXN } from "@/lib/utils";
import Topbar from "@/components/Topbar";

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function download(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const REPORTS = [
  { id: "transactions", title: "Reporte financiero", desc: "Todos tus ingresos y gastos personales", icon: Wallet, endpoint: "/api/transactions", key: "transactions",
    map: (r: any) => ({ Fecha: r.date?.slice(0, 10), Tipo: r.type === "income" ? "Ingreso" : "Gasto", Monto: r.amount, Descripcion: r.description ?? "" }) },
  { id: "sales", title: "Reporte de ventas", desc: "Historial de ventas del negocio de vapes", icon: ShoppingCart, endpoint: "/api/vapes/sales", key: "sales",
    map: (r: any) => ({ Fecha: r.date?.slice(0, 10), Producto: r.productName ?? "", Cantidad: r.quantity, Tipo: r.saleType, PrecioUnitario: r.unitPrice, Utilidad: r.profit }) },
  { id: "products", title: "Reporte de inventario", desc: "Existencias, costos y precios", icon: TrendingUp, endpoint: "/api/vapes/products", key: "products",
    map: (r: any) => ({ Producto: r.name, Marca: r.brand ?? "", Sabor: r.flavor ?? "", Stock: r.stock, Costo: r.unitCost, Menudeo: r.priceRetail, Mayoreo: r.priceWholesale }) },
  { id: "cards", title: "Reporte de tarjetas", desc: "Límites, saldos y utilización", icon: CreditCard, endpoint: "/api/cards", key: "cards",
    map: (r: any) => ({ Tarjeta: r.name, Limite: r.creditLimit, Saldo: r.currentBalance, DiaCorte: r.cutoffDay ?? "", DiaPago: r.paymentDay ?? "" }) },
];

export default function ReportesClient() {
  const [loading, setLoading] = useState("");

  async function exportReport(r: typeof REPORTS[number]) {
    setLoading(r.id);
    const data = (await (await fetch(r.endpoint)).json())[r.key] ?? [];
    setLoading("");
    if (!data.length) { alert("No hay datos para este reporte todavía."); return; }
    download(`wealthflow-${r.id}-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(data.map(r.map)));
  }

  return (
    <>
      <Topbar title="Reportes" subtitle="Exporta tus datos a CSV / Excel" />
      <div className="p-5 md:p-7 max-w-[1240px] w-full mx-auto animate-rise">
        <div className="grid md:grid-cols-2 gap-[18px]">
          {REPORTS.map((r) => (
            <div key={r.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-[12px] bg-[var(--surface-2)] grid place-items-center flex-shrink-0"><r.icon size={20} className="text-[var(--action)]" /></div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold">{r.title}</div>
                <div className="text-[12px] text-[var(--text-3)] mt-0.5">{r.desc}</div>
              </div>
              <button onClick={() => exportReport(r)} disabled={loading === r.id} className="inline-flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] text-[13px] font-semibold px-3.5 py-2.5 rounded-[10px] hover:bg-[var(--surface-3)] transition disabled:opacity-50">
                <Download size={15} /> {loading === r.id ? "..." : "CSV"}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-[18px] bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 flex items-start gap-3">
          <FileText size={18} className="text-[var(--text-3)] mt-0.5 flex-shrink-0" />
          <div className="text-[12.5px] text-[var(--text-2)]">Los archivos CSV se abren directo en <b className="text-[var(--text)]">Excel</b> o Google Sheets. Para un PDF, abre el reporte en Excel y exporta a PDF desde ahí, o usa <b className="text-[var(--text)]">Cmd+P → Guardar como PDF</b> en cualquier vista.</div>
        </div>
      </div>
    </>
  );
}
