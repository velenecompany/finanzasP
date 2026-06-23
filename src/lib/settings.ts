export type Prefs = {
  veleneCapital: number;
  fixed: { carro: number; gasolina: number; comida: number };
  splits: { colchon: number; reinversion: number; libre: number };
};

export const DEFAULT_PREFS: Prefs = {
  veleneCapital: 0,
  fixed: { carro: 2500, gasolina: 1300, comida: 800 },
  splits: { colchon: 20, reinversion: 50, libre: 30 },
};

export function mergePrefs(raw: unknown): Prefs {
  const p = (raw ?? {}) as Partial<Prefs>;
  return {
    veleneCapital: Number(p.veleneCapital ?? DEFAULT_PREFS.veleneCapital),
    fixed: { ...DEFAULT_PREFS.fixed, ...(p.fixed ?? {}) },
    splits: { ...DEFAULT_PREFS.splits, ...(p.splits ?? {}) },
  };
}

/** Calcula el reparto de un pago según los fijos y porcentajes. */
export function computeReparto(pago: number, prefs: Prefs) {
  const fixedTotal = prefs.fixed.carro + prefs.fixed.gasolina + prefs.fixed.comida;
  const disponible = Math.max(0, pago - fixedTotal);
  return {
    pago,
    fixedTotal,
    fixed: prefs.fixed,
    disponible,
    colchon: (disponible * prefs.splits.colchon) / 100,
    reinversion: (disponible * prefs.splits.reinversion) / 100,
    libre: (disponible * prefs.splits.libre) / 100,
  };
}
