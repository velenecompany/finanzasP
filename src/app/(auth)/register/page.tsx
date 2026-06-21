"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true); setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (res.ok) router.push("/dashboard");
    else setError((await res.json()).error ?? "Error al registrarse");
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      <h1 className="text-lg font-bold mb-1">Crea tu cuenta</h1>
      <p className="text-[13px] text-[var(--text-3)] mb-6">Toma el control de tus finanzas y tu negocio.</p>
      {error && <div className="mb-4 text-[12.5px] text-[var(--expense)] bg-[var(--expense-soft)] rounded-[10px] px-3 py-2">{error}</div>}
      <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Nombre</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fernando"
        className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none mb-4 focus:border-[#2a3038]" />
      <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Correo</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="tu@correo.com"
        className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none mb-4 focus:border-[#2a3038]" />
      <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Contraseña <span className="text-[var(--text-3)] font-normal">(mín. 8)</span></label>
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••"
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none mb-5 focus:border-[#2a3038]" />
      <button onClick={submit} disabled={loading}
        className="w-full bg-[var(--action)] text-white font-semibold text-[13.5px] py-3 rounded-[11px] hover:opacity-90 transition disabled:opacity-60">
        {loading ? "Creando..." : "Crear cuenta"}
      </button>
      <p className="text-[12.5px] text-[var(--text-3)] text-center mt-5">
        ¿Ya tienes cuenta? <Link href="/login" className="text-[var(--action)] font-semibold">Inicia sesión</Link>
      </p>
    </div>
  );
}
