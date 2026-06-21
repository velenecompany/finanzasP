"use client";
import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({
  open, onClose, title, children,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  if (!open) return null;
  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-[rgba(4,5,7,0.66)] backdrop-blur-sm z-[100] flex items-start justify-center px-5 pt-[7vh] overflow-y-auto">
      <div className="w-full max-w-[440px] bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 animate-pop mb-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[17px] font-bold tracking-tight">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-[9px] border border-[var(--border)] bg-[var(--surface-2)] grid place-items-center text-[var(--text-2)] hover:text-[var(--text)]"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-[15px]">
      <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">
        {label} {hint && <span className="text-[var(--text-3)] font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export const inputCls =
  "w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none focus:border-[#2a3038] [color-scheme:dark]";
