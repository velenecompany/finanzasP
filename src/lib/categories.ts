export const DEFAULT_CATEGORIES = {
  income: [
    { name: "Ventas del negocio", color: "#34D8A0" },
    { name: "Salario", color: "#34D8A0" },
    { name: "Freelance / VANT", color: "#5B8DEF" },
    { name: "Otros ingresos", color: "#9AA0A8" },
  ],
  expense: [
    { name: "Comida", color: "#F2766B" },
    { name: "Transporte", color: "#F2766B" },
    { name: "Gasolina", color: "#D8B36A" },
    { name: "Gimnasio", color: "#5B8DEF" },
    { name: "Escuela", color: "#5B8DEF" },
    { name: "Suscripciones", color: "#9AA0A8" },
    { name: "Entretenimiento", color: "#D8B36A" },
    { name: "Salud", color: "#34D8A0" },
    { name: "Inventario vapes", color: "#F2766B" },
    { name: "Otros", color: "#9AA0A8" },
  ],
} as const;

export function categoryColor(type: "income" | "expense", name: string): string {
  const found = DEFAULT_CATEGORIES[type].find((c) => c.name === name);
  return found?.color ?? "#9AA0A8";
}
