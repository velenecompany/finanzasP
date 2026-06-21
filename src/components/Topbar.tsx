"use client";
import { Plus } from "lucide-react";

export default function Topbar({
  title, subtitle, onNew,
}: { title: string; subtitle: string; onNew?: () => void }) {
  return (
    <div className="topbar-safe sticky top-0 z-20 bg-[rgba(10,11,13,0.85)] backdrop-blur-xl border-b border-[var(--border)]">
      <div className="h-14 md:h-16 flex items-center gap-4 px-4 md:px-7">
        <div className="min-w-0">
          <div className="text-[17px] md:text-[18px] font-bold tracking-tight truncate">{title}</div>
          <div className="text-[12.5px] text-[var(--text-3)] hidden md:block">{subtitle}</div>
        </div>
        {onNew && (
          <button onClick={onNew}
            className="ml-auto inline-flex items-center gap-2 bg-[var(--action)] text-white font-semibold text-[13px] px-3.5 md:px-3.5 py-2.5 rounded-[10px] active:opacity-80 md:hover:opacity-90 transition whitespace-nowrap">
            <Plus size={16} strokeWidth={2.2} /> <span className="hidden sm:inline">Nuevo movimiento</span>
          </button>
        )}
      </div>
    </div>
  );
}
