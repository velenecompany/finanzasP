"use client";
import { Construction } from "lucide-react";
import Topbar from "@/components/Topbar";

export default function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <div className="flex-1 grid place-items-center p-7">
        <div className="text-center animate-rise">
          <div className="w-14 h-14 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] grid place-items-center mx-auto mb-4">
            <Construction size={24} className="text-[var(--gold)]" />
          </div>
          <h2 className="text-[18px] font-bold tracking-tight">{title}</h2>
          <p className="text-[13px] text-[var(--text-3)] mt-1.5 max-w-[320px]">Modulo en construccion. Siguiente despues de Finanzas.</p>
        </div>
      </div>
    </>
  );
}
