"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Wallet, BarChart3, Target, Receipt,
  CreditCard, Package, TrendingUp, Bot, FileText,
} from "lucide-react";

const NAV = [
  { group: "General", items: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/finanzas", label: "Finanzas", icon: Wallet },
    { href: "/presupuestos", label: "Presupuestos", icon: BarChart3 },
    { href: "/metas", label: "Metas", icon: Target },
  ]},
  { group: "Crédito", items: [
    { href: "/deudas", label: "Deudas", icon: Receipt },
    { href: "/tarjetas", label: "Tarjetas", icon: CreditCard },
  ]},
  { group: "Negocio", items: [
    { href: "/negocio/inventario", label: "Negocio Vapes", icon: Package },
    { href: "/negocio/crecimiento", label: "Crecimiento", icon: TrendingUp },
  ]},
  { group: "Inteligencia", items: [
    { href: "/asistente", label: "Asistente IA", icon: Bot },
    { href: "/reportes", label: "Reportes", icon: FileText },
  ]},
];

export default function Sidebar({ name }: { name: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex flex-col w-[248px] border-r border-[var(--border)] sticky top-0 h-screen px-3.5 py-5 bg-[var(--bg)]">
      <div className="flex items-center gap-3 px-2 pb-5">
        <div className="w-[34px] h-[34px] rounded-[10px] grid place-items-center border border-[var(--border)] bg-[var(--surface-2)]">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--income)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-5 4 3 8-9" /><path d="M21 6v5h-5" /></svg>
        </div>
        <span className="font-bold text-[16px] tracking-tight">Wealth<span className="text-[var(--income)]">Flow</span></span>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="text-[10.5px] tracking-[0.12em] uppercase text-[var(--text-3)] px-2.5 pt-3.5 pb-1.5 font-semibold font-mono">{g.group}</div>
            {g.items.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-[10px] text-[13.5px] font-medium transition relative ${active ? "bg-[var(--surface-2)] text-[var(--text)]" : "text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"}`}>
                  {active && <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-[var(--income)] rounded-r" />}
                  <Icon size={17} strokeWidth={1.8} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="pt-3.5 border-t border-[var(--border)]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-[11px]">
          <div className="w-8 h-8 rounded-[9px] bg-[var(--surface-2)] grid place-items-center font-bold text-[13px] text-[var(--income)]">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <b className="text-[13px] font-semibold leading-tight block">{name}</b>
            <span className="text-[11px] text-[var(--text-3)]">Plan Pro</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
