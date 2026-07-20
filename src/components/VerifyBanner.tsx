"use client";
import { useState } from "react";
import { MailWarning, X, Check } from "lucide-react";

export default function VerifyBanner() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "hidden">("idle");
  if (state === "hidden") return null;

  async function resend() {
    setState("sending");
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    setState(res.ok ? "sent" : "idle");
  }

  return (
    <div className="bg-[var(--gold-soft,#2a2410)] border-b border-[var(--border)] px-4 md:px-7 py-2.5 flex items-center gap-3 text-[12.5px]">
      <MailWarning size={16} className="text-[var(--gold)] shrink-0" />
      <span className="text-[var(--text-2)] flex-1 min-w-0">
        {state === "sent" ? "Te reenviamos el correo de verificación. Revisa tu bandeja." : "Verifica tu correo para asegurar tu cuenta."}
      </span>
      {state !== "sent" && (
        <button onClick={resend} disabled={state === "sending"}
          className="shrink-0 font-semibold text-[var(--gold)] hover:underline disabled:opacity-60">
          {state === "sending" ? "Enviando..." : "Reenviar correo"}
        </button>
      )}
      {state === "sent" && <Check size={15} className="text-[var(--income)] shrink-0" />}
      <button onClick={() => setState("hidden")} className="shrink-0 text-[var(--text-3)] hover:text-[var(--text)]"><X size={15} /></button>
    </div>
  );
}
