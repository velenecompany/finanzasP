"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Store, Plus, Pencil, Trash2, X, LogOut } from "lucide-react";
import Topbar from "@/components/Topbar";

type Biz = { id: string; name: string };
const inputCls = "w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3.5 py-3 text-[13.5px] outline-none focus:border-[#2a3038]";

export default function CuentaClient() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [name, setName] = useState("");
  const [savedName, setSavedName] = useState(false);

  const [cur, setCur] = useState(""); const [nw, setNw] = useState(""); const [nw2, setNw2] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const [biz, setBiz] = useState<Biz[]>([]);
  const [newBiz, setNewBiz] = useState("");
  const [editId, setEditId] = useState(""); const [editName, setEditName] = useState("");

  const loadUser = async () => { const { user } = await (await fetch("/api/account")).json(); setUser(user); setName(user.name); };
  const loadBiz = async () => setBiz((await (await fetch("/api/businesses")).json()).businesses ?? []);
  useEffect(() => { loadUser(); loadBiz(); }, []);

  async function saveName() {
    await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setSavedName(true); setTimeout(() => setSavedName(false), 2000);
  }
  async function changePassword() {
    setPwMsg(null);
    if (nw !== nw2) { setPwMsg({ ok: false, text: "Las contraseñas nuevas no coinciden" }); return; }
    if (nw.length < 8) { setPwMsg({ ok: false, text: "La nueva debe tener mínimo 8 caracteres" }); return; }
    setPwLoading(true);
    const res = await fetch("/api/account/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: cur, next: nw }) });
    setPwLoading(false);
    if (res.ok) { setPwMsg({ ok: true, text: "Contraseña actualizada" }); setCur(""); setNw(""); setNw2(""); }
    else setPwMsg({ ok: false, text: (await res.json()).error ?? "Error" });
  }
  async function addBiz() {
    if (!newBiz.trim()) return;
    await fetch("/api/businesses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newBiz }) });
    setNewBiz(""); loadBiz(); router.refresh();
  }
  async function renameBiz(id: string) {
    if (!editName.trim()) return;
    await fetch("/api/businesses", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editName }) });
    setEditId(""); setEditName(""); loadBiz(); router.refresh();
  }
  async function deleteBiz(id: string) {
    if (!confirm("¿Eliminar este negocio? Se borran sus productos, ventas, gastos y capital.")) return;
    await fetch(`/api/businesses?id=${id}`, { method: "DELETE" }); loadBiz(); router.refresh();
  }
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }

  return (
    <>
      <Topbar title="Mi cuenta" subtitle="Perfil, seguridad y negocios" />
      <div className="p-5 md:p-7 max-w-[720px] w-full mx-auto animate-rise space-y-[18px]">

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <div className="text-[14px] font-semibold mb-4">Perfil</div>
          <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Nombre</label>
          <input className={inputCls + " mb-3"} value={name} onChange={(e) => setName(e.target.value)} />
          <label className="block text-[11.5px] font-semibold text-[var(--text-2)] mb-1.5">Correo</label>
          <input className={inputCls + " mb-4 opacity-60 cursor-not-allowed"} value={user?.email ?? ""} disabled />
          <button onClick={saveName} className="bg-[var(--action)] text-white font-semibold text-[13px] px-4 py-2.5 rounded-[10px] hover:opacity-90 transition inline-flex items-center gap-2">
            {savedName ? <><Check size={16} /> Guardado</> : "Guardar nombre"}
          </button>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <div className="text-[14px] font-semibold mb-4">Cambiar contraseña</div>
          {pwMsg && <div className={`mb-3 text-[12.5px] rounded-[10px] px-3 py-2 ${pwMsg.ok ? "text-[var(--income)] bg-[var(--income-soft)]" : "text-[var(--expense)] bg-[var(--expense-soft)]"}`}>{pwMsg.text}</div>}
          <input className={inputCls + " mb-3"} type="password" placeholder="Contraseña actual" value={cur} onChange={(e) => setCur(e.target.value)} />
          <input className={inputCls + " mb-3"} type="password" placeholder="Nueva contraseña (mín. 8)" value={nw} onChange={(e) => setNw(e.target.value)} />
          <input className={inputCls + " mb-4"} type="password" placeholder="Repite la nueva contraseña" value={nw2} onChange={(e) => setNw2(e.target.value)} />
          <button onClick={changePassword} disabled={pwLoading} className="bg-[var(--action)] text-white font-semibold text-[13px] px-4 py-2.5 rounded-[10px] hover:opacity-90 transition disabled:opacity-60">
            {pwLoading ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <div className="text-[14px] font-semibold mb-1">Mis negocios</div>
          <div className="text-[12px] text-[var(--text-3)] mb-4">Cada negocio tiene su propio inventario, ventas, gastos y capital.</div>
          <div className="space-y-2 mb-4">
            {biz.map((b) => (
              <div key={b.id} className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-[11px] px-3 py-2.5">
                {editId === b.id ? (
                  <>
                    <input autoFocus className="flex-1 bg-transparent outline-none text-[13.5px]" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && renameBiz(b.id)} />
                    <button onClick={() => renameBiz(b.id)} className="text-[var(--income)]"><Check size={16} /></button>
                    <button onClick={() => { setEditId(""); setEditName(""); }} className="text-[var(--text-3)]"><X size={16} /></button>
                  </>
                ) : (
                  <>
                    <Store size={16} className="text-[var(--income)]" />
                    <span className="flex-1 text-[13.5px] font-medium truncate">{b.name}</span>
                    <button onClick={() => { setEditId(b.id); setEditName(b.name); }} className="text-[var(--text-3)] hover:text-[var(--text)] transition"><Pencil size={14} /></button>
                    <button onClick={() => deleteBiz(b.id)} className="text-[var(--text-3)] hover:text-[var(--expense)] transition"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            ))}
            {biz.length === 0 && <div className="text-[13px] text-[var(--text-3)] text-center py-3">Aún no tienes negocios. Agrega el primero abajo.</div>}
          </div>
          <div className="flex gap-2">
            <input className={inputCls} placeholder="Nombre del nuevo negocio" value={newBiz} onChange={(e) => setNewBiz(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addBiz()} />
            <button onClick={addBiz} className="shrink-0 bg-[var(--action)] text-white font-semibold text-[13px] px-4 rounded-[11px] hover:opacity-90 transition inline-flex items-center gap-1.5"><Plus size={15} /> Agregar</button>
          </div>
        </div>

        <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] text-[13px] font-semibold text-[var(--expense)] hover:bg-[var(--surface-2)] transition">
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </>
  );
}
