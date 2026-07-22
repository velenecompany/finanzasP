import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth/session";
import { TOOLS, WRITE_TOOLS, describeWrite } from "@/lib/ai/tools";
import { runTool } from "@/lib/ai/handlers";

export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const SYSTEM = `Eres el asesor financiero de WealthFlow, una app de finanzas para emprendedores en México. Hablas español mexicano, cercano pero profesional, directo y claro. Usas signos de $ para pesos.

Tu trabajo tiene dos modos:
1) DIAGNÓSTICO (onboarding): entrevistas al usuario de forma conversacional para entender su situación. Haz 2-3 preguntas por turno, NUNCA todas de golpe. Cubre con el tiempo: capital líquido vs atado, deudas y sus tasas, ingreso/gasto mensual y qué tan predecible es, número de fuentes de ingreso y dependencia de la principal, gastos fijos vs discrecionales, meses de colchón si el ingreso se detuviera, si el colchón está separado del capital de trabajo, cuánto reinvierte, y metas a 1 y 3 años. Infiere su perfil de riesgo (conservador/balanceado/agresivo).
2) SEGUIMIENTO: responde dudas como "¿voy bien este mes?" usando SIEMPRE los datos reales (llama get_user_finances primero).

Reglas:
- Antes de dar consejos con números, llama get_user_finances para ver su situación real. No inventes cifras.
- Cuando tengas suficiente información del diagnóstico, propón y ESCRIBE su configuración: gastos fijos (update_fixed_expenses) y un reparto personalizado según su perfil y metas (update_split, no siempre 20/50/30). Guarda el diagnóstico con save_financial_profile.
- Si detectas un riesgo real (cero colchón, deuda con tasa altísima, dependencia total de una sola fuente), crea una alerta con create_alert.
- Al final del onboarding, usa complete_onboarding.
- IMPORTANTE: toda escritura pasa por una confirmación visual del usuario (aparece una tarjeta con botón). Tú solo propón la acción llamando la tool; el sistema se encarga de pedir el "sí". No afirmes que ya guardaste algo hasta que el resultado de la tool lo confirme.
- Sé conciso. Respuestas de 2-4 frases por turno cuando entrevistas.
- En el ONBOARDING eres el único camino de configuración: no lo alargues. Con 4-6 turnos de preguntas ya deberías tener lo suficiente para proponer su configuración. Prioriza en este orden: ingreso mensual y qué tan predecible es, gastos fijos, deudas y colchón, y metas. Lo demás es opcional.
- Si el usuario no sabe un dato o dice que no aplica, no insistas: usa 0 o una estimación razonable y sigue.
- Cierra siempre el onboarding: cuando ya guardaste gastos fijos y reparto, llama complete_onboarding.`;

function textOf(content: any[]): string {
  return content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY)
    return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY en el servidor" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const messages: any[] = Array.isArray(body?.messages) ? body.messages : [];
  const approve: string | null = body?.approve ?? null;   // tool_use_id confirmado
  const decline: string | null = body?.decline ?? null;   // tool_use_id rechazado

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Si el usuario acaba de confirmar/rechazar una escritura, resolvemos esa tool antes de seguir.
  if (approve || decline) {
    const last = messages[messages.length - 1];
    const tu = last?.content?.find?.((b: any) => b.type === "tool_use" && b.id === (approve || decline));
    if (tu) {
      let result: any;
      if (approve) result = await runTool(tu.name, tu.input, s.sub);   // user_id SIEMPRE de la sesión
      else result = { cancelled: true, note: "El usuario canceló esta acción." };
      messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(result) }] });
    }
  }

  try {
    // Loop de tool use
    for (let i = 0; i < 8; i++) {
      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM,
        tools: TOOLS as any,
        tool_choice: { type: "auto", disable_parallel_tool_use: true } as any,
        messages,
      });

      messages.push({ role: "assistant", content: resp.content });
      const toolUse: any = resp.content.find((b: any) => b.type === "tool_use");

      if (!toolUse) {
        return NextResponse.json({ type: "message", text: textOf(resp.content), messages });
      }

      // Escritura no confirmada → pausa y pide confirmación
      if (WRITE_TOOLS.has(toolUse.name)) {
        return NextResponse.json({
          type: "confirm",
          text: textOf(resp.content),
          pending: { id: toolUse.id, name: toolUse.name, input: toolUse.input, summary: describeWrite(toolUse.name, toolUse.input) },
          messages,
        });
      }

      // Lectura → ejecuta y continúa
      const result = await runTool(toolUse.name, toolUse.input, s.sub);
      messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(result) }] });
    }

    return NextResponse.json({ type: "message", text: "Seguimos. ¿En qué más te ayudo?", messages });
  } catch (e: any) {
    console.error("[advisor] error:", e?.message);
    return NextResponse.json({ error: e?.message ?? "Error con la IA" }, { status: 500 });
  }
}
