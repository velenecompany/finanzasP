"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";

type Alert = { id: string; severity: string; type: string; title: string; message: string };
const ICON: Record<string, any> = { danger: AlertCircle, warning: AlertTriangle, info: Info };
const COLOR: Record<string, string> = { danger: "var(--expense)", warning: "var(--gold)", info: "var(--action)" };

export default function AlertsBanner() {
  const [items, setItems] = useState<Alert[]>([]);
  useEffect(() => { (async () => setItems((await (await fetch("/api/alerts")).json()).alerts ?? []))(); }, []);
  async function dismiss(id: string) {
    setItems((x) => x.filter((a) => a.id !== id));
    await fetch(`/api/alerts?id=${id}`, { method: "PATCH" });
  }
  if (!items.length) return null;
  return (
    <div className="space-y-2.5 mb-[18px]">
      {items.map((a) => {
        const Icon = ICON[a.severity] ?? Info; const c = COLOR[a.severity] ?? "var(--action)";
        return (
          <div key={a.id} className="bg-[var(--surface)] border rounded-2xl p-4 flex items-start gap-3" style={{ borderColor: c }}>
            <Icon size={18} className="shrink-0 mt-0.5" style={{ color: c }} />
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-semibold">{a.title}</div>
              <div className="text-[12.5px] text-[var(--text-2)] mt-0.5">{a.message}</div>
            </div>
            <button onClick={() => dismiss(a.id)} className="shrink-0 text-[var(--text-3)] hover:text-[var(--text)]"><X size={16} /></button>
          </div>
        );
      })}
    </div>
  );
}
