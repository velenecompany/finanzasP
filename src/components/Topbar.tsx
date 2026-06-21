"use client";
import { Plus } from "lucide-react";

export default function Topbar({
  title, subtitle, onNew,
}: { title: string; subtitle: string; onNew?: () => void }) {
  return (
    <div className="h-16 border-b border-[var(--border)] flex items-center gap-4 px-5 md:px-7 sticky top-0 z-20 bg-[rgba(10,11,13,0.82)] backdrop-blur-xl">
      <div>
        <div className="text-[18px] font-bold tracking-tight">{title}</div>
        <div className="text-[12.5px] text-[var(--text-3)] hidden md:block">{subtitle}</div>
      </div>
      {onNew && (
        <button onClick={onNew}
          className="ml-auto inline-flex items-center gap-2 bg-[var(--action)] text-white font-semibold text-[13px] px-3.5 py-2.5 rounded-[10px] hover:opacity-90 transition">
          <Plus size={15} strokeWidth={2.2} /> Nuevo movimiento
        </button>
      )}
    </div>
  );
}
