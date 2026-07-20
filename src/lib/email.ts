import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "WealthFlow <no-reply@wealthflow.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function client() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const shell = (title: string, body: string) => `
<div style="background:#0a0b0d;padding:40px 0;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:440px;margin:0 auto;background:#111316;border:1px solid #1e222a;border-radius:16px;padding:32px">
    <div style="font-size:20px;font-weight:800;color:#f4f5f6;margin-bottom:4px">Wealth<span style="color:#34d8a0">Flow</span></div>
    <h1 style="font-size:17px;color:#f4f5f6;margin:18px 0 10px">${title}</h1>
    ${body}
    <p style="font-size:12px;color:#6b7280;margin-top:24px">Si no fuiste tú, ignora este correo.</p>
  </div>
</div>`;

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:10px;margin:8px 0">${label}</a>`;

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = `${APP_URL}/api/auth/verify?token=${token}`;
  const c = client();
  if (!c) { console.warn("[email] RESEND_API_KEY ausente — link:", url); return; }
  await c.emails.send({
    from: FROM, to, subject: "Verifica tu correo · WealthFlow",
    html: shell("Confirma tu correo", `
      <p style="font-size:14px;color:#c9ccd1;line-height:1.6">Hola ${name}, confirma tu correo para asegurar tu cuenta:</p>
      ${btn(url, "Verificar correo")}
      <p style="font-size:12px;color:#6b7280;margin-top:14px">El enlace expira en 24 horas.</p>`),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${APP_URL}/restablecer?token=${token}`;
  const c = client();
  if (!c) { console.warn("[email] RESEND_API_KEY ausente — link:", url); return; }
  await c.emails.send({
    from: FROM, to, subject: "Restablece tu contraseña · WealthFlow",
    html: shell("Restablece tu contraseña", `
      <p style="font-size:14px;color:#c9ccd1;line-height:1.6">Hola ${name}, da clic para crear una nueva contraseña:</p>
      ${btn(url, "Crear nueva contraseña")}
      <p style="font-size:12px;color:#6b7280;margin-top:14px">El enlace expira en 1 hora.</p>`),
  });
}
