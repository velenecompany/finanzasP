"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Wallet, BarChart3, Target, Receipt,
  CreditCard, Package, TrendingUp, Bot, FileText, Settings, Store, Plus, LogOut,
} from "lucide-react";

type Biz = { id: string; name: string };

export default function Sidebar({ name, businesses }: { name: string; businesses: Biz[] }) {
  const pathname = usePathname();
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  const link = (href: string, active: boolean) =>
    `flex items-center gap-3 px-2.5 py-2 rounded-[10px] text-[13.5px] font-medium transition relative ${active ? "bg-[var(--surface-2)] text-[var(--text)]" : "text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"}`;

  return (
    <aside className="hidden md:flex flex-col w-[248px] border-r border-[var(--border)] sticky top-0 h-screen px-3.5 py-5 bg-[var(--bg)]">
      <div className="flex items-center gap-3 px-2 pb-5">
        <div className="w-[34px] h-[34px] rounded-[10px] grid place-items-center border border-[var(--border)] bg-[var(--surface-2)]">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--income)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-5 4 3 8-9" /><path d="M21 6v5h-5" /></svg>
        </div>
        <span className="font-bold text-[16px] tracking-tight">Wealth<span className="text-[var(--income)]">Flow</span></span>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div className="text-[10.5px] tracking-[0.12em] uppercase text-[var(--text-3)] px-2.5 pt-3.5 pb-1.5 font-semibold font-mono">General</div>
        <Link href="/dashboard" className={link("/dashboard", pathname === "/dashboard")}><LayoutDashboard size={17} strokeWidth={1.8} />Dashboard</Link>
        <Link href="/finanzas" className={link("/finanzas", pathname.startsWith("/finanzas"))}><Wallet size={17} strokeWidth={1.8} />Finanzas</Link>
        <Link href="/presupuestos" className={link("/presupuestos", pathname.startsWith("/presupuestos"))}><BarChart3 size={17} strokeWidth={1.8} />Presupuestos</Link>
        <Link href="/metas" className={link("/metas", pathname.startsWith("/metas"))}><Target size={17} strokeWidth={1.8} />Metas</Link>

        <div className="text-[10.5px] tracking-[0.12em] uppercase text-[var(--text-3)] px-2.5 pt-3.5 pb-1.5 font-semibold font-mono">Crédito</div>
        <Link href="/deudas" className={link("/deudas", pathname.startsWith("/deudas"))}><Receipt size={17} strokeWidth={1.8} />Deudas</Link>
        <Link href="/tarjetas" className={link("/tarjetas", pathname.startsWith("/tarjetas"))}><CreditCard size={17} strokeWidth={1.8} />Tarjetas</Link>

        <div className="text-[10.5px] tracking-[0.12em] uppercase text-[var(--text-3)] px-2.5 pt-3.5 pb-1.5 font-semibold font-mono">Negocios</div>
        {businesses.map((b) => {
          const active = pathname === `/n/${b.id}`;
          return (
            <Link key={b.id} href={`/n/${b.id}`} className={link(`/n/${b.id}`, active)}>
              {active && <span className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-[var(--income)] rounded-r" />}
              <Store size={17} strokeWidth={1.8} />{b.name}
            </Link>
          );
        })}
        <Link href="/cuenta" className="flex items-center gap-3 px-2.5 py-2 rounded-[10px] text-[13px] font-medium text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition"><Plus size={16} strokeWidth={2} />Agregar negocio</Link>
        <Link href="/negocio/crecimiento" className={link("/negocio/crecimiento", pathname.startsWith("/negocio/crecimiento"))}><TrendingUp size={17} strokeWidth={1.8} />Crecimiento</Link>

        <div className="text-[10.5px] tracking-[0.12em] uppercase text-[var(--text-3)] px-2.5 pt-3.5 pb-1.5 font-semibold font-mono">Más</div>
        <Link href="/asistente" className={link("/asistente", pathname.startsWith("/asistente"))}><Bot size={17} strokeWidth={1.8} />Asistente IA</Link>
        <Link href="/reportes" className={link("/reportes", pathname.startsWith("/reportes"))}><FileText size={17} strokeWidth={1.8} />Reportes</Link>
        <Link href="/ajustes" className={link("/ajustes", pathname.startsWith("/ajustes"))}><Settings size={17} strokeWidth={1.8} />Ajustes</Link>
      </nav>

      <div className="pt-3.5 border-t border-[var(--border)]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-[11px]">
          <Link href="/cuenta" className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-[9px] bg-[var(--surface-2)] grid place-items-center font-bold text-[13px] text-[var(--income)]">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <b className="text-[13px] font-semibold leading-tight block truncate">{name}</b>
              <span className="text-[11px] text-[var(--text-3)]">Ver cuenta</span>
            </div>
          </Link>
          <button onClick={logout} title="Cerrar sesión" className="w-8 h-8 rounded-[9px] grid place-items-center text-[var(--text-3)] hover:text-[var(--expense)] hover:bg-[var(--surface-2)] transition"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}
