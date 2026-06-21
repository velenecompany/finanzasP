"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Wallet, Package, Bot, Menu, X,
  BarChart3, Target, Receipt, CreditCard, TrendingUp, FileText, Settings, LogOut,
} from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/negocio/inventario", label: "Negocio", icon: Package },
  { href: "/asistente", label: "IA", icon: Bot },
];

const MORE = [
  { href: "/presupuestos", label: "Presupuestos", icon: BarChart3 },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/deudas", label: "Deudas", icon: Receipt },
  { href: "/tarjetas", label: "Tarjetas", icon: CreditCard },
  { href: "/negocio/crecimiento", label: "Crecimiento", icon: TrendingUp },
  { href: "/reportes", label: "Reportes", icon: FileText },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const moreActive = MORE.some((m) => isActive(m.href));

  return (
    <>
      {/* Sheet "Más" */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[90] flex flex-col justify-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm animate-[fade_.2s_ease]" />
          <div onClick={(e) => e.stopPropagation()}
            className="relative bg-[var(--surface)] border-t border-[var(--border)] rounded-t-[24px] p-5 pb-[calc(20px+env(safe-area-inset-bottom))] animate-[sheet_.28s_cubic-bezier(.22,1,.36,1)]">
            <div className="w-10 h-1 rounded-full bg-[var(--surface-3)] mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[15px] font-bold">Más</span>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-[9px] bg-[var(--surface-2)] grid place-items-center text-[var(--text-2)]"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {MORE.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-[14px] border transition ${isActive(href) ? "bg-[var(--surface-2)] border-[var(--income)]" : "bg-[var(--surface-2)] border-[var(--border)]"}`}>
                  <Icon size={20} className={isActive(href) ? "text-[var(--income)]" : "text-[var(--text-2)]"} />
                  <span className="text-[11.5px] font-medium text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>
            <button onClick={logout} className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-[14px] bg-[var(--surface-2)] border border-[var(--border)] text-[13px] font-semibold text-[var(--expense)]">
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[80] bg-[rgba(16,18,22,0.9)] backdrop-blur-xl border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-[60px]">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} className="flex flex-col items-center justify-center gap-1 relative">
                {active && <span className="absolute top-0 w-8 h-[2.5px] rounded-full bg-[var(--income)]" />}
                <Icon size={21} className={active ? "text-[var(--income)]" : "text-[var(--text-3)]"} strokeWidth={active ? 2.3 : 1.9} />
                <span className={`text-[10px] font-medium ${active ? "text-[var(--text)]" : "text-[var(--text-3)]"}`}>{label}</span>
              </Link>
            );
          })}
          <button onClick={() => setOpen(true)} className="flex flex-col items-center justify-center gap-1 relative">
            {moreActive && <span className="absolute top-0 w-8 h-[2.5px] rounded-full bg-[var(--income)]" />}
            <Menu size={21} className={moreActive ? "text-[var(--income)]" : "text-[var(--text-3)]"} strokeWidth={moreActive ? 2.3 : 1.9} />
            <span className={`text-[10px] font-medium ${moreActive ? "text-[var(--text)]" : "text-[var(--text-3)]"}`}>Más</span>
          </button>
        </div>
      </nav>
    </>
  );
}
