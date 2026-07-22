// Definiciones de tools que se le pasan a Claude. NO incluyen user_id:
// el user_id SIEMPRE lo inyecta el servidor desde la sesión JWT.

export const TOOLS = [
  {
    name: "get_user_finances",
    description: "Lee el estado financiero REAL y actual del usuario: capital por negocio, ingresos/gastos del mes, deudas, tarjetas, gastos fijos y reparto vigentes, y colchón estimado. Úsalo antes de dar cualquier consejo con números.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_financial_profile",
    description: "Lee el diagnóstico financiero previamente guardado del usuario (si existe).",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "save_financial_profile",
    description: "Guarda o actualiza el diagnóstico financiero del usuario tras la entrevista. REQUIERE CONFIRMACIÓN del usuario.",
    input_schema: {
      type: "object",
      properties: {
        liquid_capital: { type: "number", description: "Capital líquido disponible (efectivo, cuentas)" },
        tied_capital: { type: "number", description: "Capital atado (inventario, cuentas por cobrar)" },
        total_debt: { type: "number" },
        debt_detail: { type: "array", items: { type: "object", properties: { acreedor: { type: "string" }, monto: { type: "number" }, tasa: { type: "number" } } } },
        monthly_income: { type: "number" },
        monthly_expenses: { type: "number" },
        income_predictability: { type: "string", enum: ["alta", "media", "baja"] },
        income_sources: { type: "integer" },
        main_source_dependency: { type: "integer", description: "% que depende de la fuente principal (0-100)" },
        cushion_months: { type: "number", description: "Meses de colchón si el ingreso se detuviera hoy" },
        cushion_separated: { type: "boolean", description: "¿El colchón está separado del capital de trabajo?" },
        reinvest_rate: { type: "integer", description: "% de lo que sobra que se reinvierte" },
        goal_1y: { type: "string" },
        goal_3y: { type: "string" },
        risk_profile: { type: "string", enum: ["conservador", "balanceado", "agresivo"] },
      },
      required: [],
    },
  },
  {
    name: "update_fixed_expenses",
    description: "Escribe los gastos fijos mensuales del usuario. REQUIERE CONFIRMACIÓN del usuario.",
    input_schema: {
      type: "object",
      properties: {
        carro: { type: "number" }, gasolina: { type: "number" }, comida: { type: "number" },
      },
      required: ["carro", "gasolina", "comida"],
    },
  },
  {
    name: "update_split",
    description: "Escribe los porcentajes de reparto del disponible. Deben sumar 100. REQUIERE CONFIRMACIÓN del usuario.",
    input_schema: {
      type: "object",
      properties: {
        colchon: { type: "integer" }, reinversion: { type: "integer" }, libre: { type: "integer" },
      },
      required: ["colchon", "reinversion", "libre"],
    },
  },
  {
    name: "create_business",
    description: "Crea un negocio para el usuario. REQUIERE CONFIRMACIÓN del usuario.",
    input_schema: { type: "object", properties: { name: { type: "string" } }, required: ["name"] },
  },
  {
    name: "create_alert",
    description: "Crea una alerta visible en el dashboard cuando detectas un riesgo real (cero colchón, deuda cara, dependencia de una sola fuente). REQUIERE CONFIRMACIÓN del usuario.",
    input_schema: {
      type: "object",
      properties: {
        severity: { type: "string", enum: ["info", "warning", "danger"] },
        type: { type: "string" },
        title: { type: "string" },
        message: { type: "string" },
      },
      required: ["severity", "type", "title", "message"],
    },
  },
  {
    name: "complete_onboarding",
    description: "Marca el onboarding como terminado y lleva al usuario a su dashboard. Úsalo solo cuando ya configuraste lo esencial. REQUIERE CONFIRMACIÓN del usuario.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
];

// Tools que MODIFICAN datos: requieren confirmación explícita del usuario.
export const WRITE_TOOLS = new Set([
  "save_financial_profile", "update_fixed_expenses", "update_split",
  "create_business", "create_alert", "complete_onboarding",
]);

// Resumen legible de la acción para la tarjeta de confirmación.
export function describeWrite(name: string, input: any): string {
  switch (name) {
    case "update_fixed_expenses":
      return `Guardar gastos fijos: coche $${input.carro ?? 0}, gasolina $${input.gasolina ?? 0}, comida $${input.comida ?? 0} al mes.`;
    case "update_split":
      return `Guardar reparto: ${input.colchon}% colchón, ${input.reinversion}% reinversión, ${input.libre}% libre.`;
    case "create_business":
      return `Crear el negocio "${input.name}".`;
    case "create_alert":
      return `Crear una alerta (${input.severity}): ${input.title}.`;
    case "save_financial_profile":
      return `Guardar tu diagnóstico financiero.`;
    case "complete_onboarding":
      return `Terminar la configuración y entrar a tu dashboard.`;
    default:
      return `Ejecutar ${name}.`;
  }
}
