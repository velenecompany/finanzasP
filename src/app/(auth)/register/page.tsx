"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bizList, setBizList] = useState<string[]>([""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputCls = "w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none focus:border-[#2a3038]";

  const pwChecks = { len: password.length >= 8, letter: /[a-zA-Z]/.test(password), num: /[0-9]/.test(password) };
  const pwOk = pwChecks.len && pwChecks.letter && pwChecks.num;

  const setBiz = (i: number, v: string) => setBizList((l) => l.map((x, j) => (j === i ? v : x)));
  const addBiz = () => setBizList((l) => (l.length < 8 ? [...l, ""] : l));
  const removeBiz = (i: number) => setBizList((l) => l.filter((_, j) => j !== i));

  async function submit() {
    setLoading(true); setError("");
    const businesses = bizList.map((b) => b.trim()).filter(Boolean);
    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, businesses }),
    });
    setLoading(false);
    if (res.ok) router.push("/dashboard");
    else setError((await res.json()).error ?? "Error al registrarse");
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      <h1 className="text-lg font-bold mb-1">Crea tu cuenta</h1>
      <p className="text-[13px] text-[var(--text-3)] mb-6">Toma el control de tus finanzas y tus negocios.</p>
      {error && <div className="mb-4 text-[12.5px] text-[var(--expense)] bg-[var(--expense-soft)] rounded-[10px] px-3 py-2">{error}</div>}

      <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Nombre</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className={inputCls + " mb-4"} />

      <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Correo</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tu@correo.com" className={inputCls + " mb-4"} />

      <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Contraseña</label>
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className={inputCls + (password ? " mb-2" : " mb-5")} />
      {password && (
        <div className="flex gap-3 mb-5 text-[11.5px]">
          <span style={{ color: pwChecks.len ? "var(--income)" : "var(--text-3)" }}>{pwChecks.len ? "✓" : "○"} 8+ caracteres</span>
          <span style={{ color: pwChecks.letter ? "var(--income)" : "var(--text-3)" }}>{pwChecks.letter ? "✓" : "○"} una letra</span>
          <span style={{ color: pwChecks.num ? "var(--income)" : "var(--text-3)" }}>{pwChecks.num ? "✓" : "○"} un número</span>
        </div>
      )}

      <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Tus negocios <span className="text-[var(--text-3)] font-normal">(opcional)</span></label>
      <div className="space-y-2 mb-2">
        {bizList.map((b, i) => (
          <div key={i} className="flex gap-2">
            <input value={b} onChange={(e) => setBiz(i, e.target.value)} placeholder="Ej. Vapes, Ropa, Barbería..." className={inputCls} />
            {bizList.length > 1 && <button onClick={() => removeBiz(i)} className="w-11 shrink-0 grid place-items-center rounded-[11px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--expense)]"><X size={15} /></button>}
          </div>
        ))}
      </div>
      {bizList.length < 8 && (
        <button onClick={addBiz} className="text-[12.5px] font-semibold text-[var(--action)] inline-flex items-center gap-1.5 mb-5"><Plus size={14} /> Agregar otro negocio</button>
      )}

      <button onClick={submit} disabled={loading || !pwOk} className="w-full bg-[var(--action)] text-white font-semibold text-[13.5px] py-3 rounded-[11px] hover:opacity-90 transition disabled:opacity-60 mt-1">
        {loading ? "Creando..." : "Crear cuenta"}
      </button>
      <p className="text-[12.5px] text-[var(--text-3)] text-center mt-5">
        ¿Ya tienes cuenta? <Link href="/login" className="text-[var(--action)] font-semibold">Inicia sesión</Link>
      </p>
    </div>
  );
}
