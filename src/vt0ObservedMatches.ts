// Evidencia histórica observada en las hojas manuscritas.
// IMPORTANTE: estos NO son todos los resultados del sorteo.
// Son únicamente los números que, DESPUÉS de salir, el padre encontró formados
// por roce en la matriz superior y por eso anotó debajo de la línea.
// Una lista vacía es evidencia válida: en ese turno no encontró coincidencias.

export type VTObservedTurn = 'Previa' | 'Primera' | 'Matutina' | 'Vespertina' | 'Nocturna';

export type VTObservedMatchSheet = {
  id: string;
  date: string;
  sequence: number;
  status: 'partial' | 'confirmed';
  matchesByTurn: Record<VTObservedTurn, string[]>;
  notes: string[];
};

export const OBSERVED_MA29_122: VTObservedMatchSheet = {
  id: 'real-2026-09-29',
  date: '2026-09-29',
  sequence: 122,
  status: 'partial',
  matchesByTurn: {
    Previa: [],
    Primera: ['54', '983'],
    Matutina: ['389', '86', '463'],
    Vespertina: ['26', '62', '31'],
    Nocturna: ['894', '907', '796', '7942', '22'],
  },
  notes: [
    'Abajo sólo se anotan coincidencias encontradas; no es una lista completa de resultados ni incluye jurisdicción.',
    'Los resaltados superiores se realizan después del sorteo y muestran dónde se formó por roce cada coincidencia inferior.',
    'Previa vacía significa cero coincidencias observadas para ese turno; no significa ausencia de recorridos geométricos posibles en la matriz.',
    'La transcripción de coincidencias está separada de la geometría hasta confirmar las celdas exactas de cada recorrido.',
    'MA29 contiene 13 coincidencias observadas: 6 VT2, 6 VT3 y 1 VT4.',
    'Distribución por turno: Previa 0, Primera 2, Matutina 3, Vespertina 3, Nocturna 5.',
    'Vespertina contiene 26 y 62 en la misma franja. Esto es evidencia histórica compatible con la regla de lectura directa/inversa del mismo contacto, aunque la foto por sí sola todavía no demuestra que ambos provengan exactamente del mismo par de celdas.',
    '22 demuestra que VT2 debe admitir dos celdas contiguas con la misma cifra; no se debe deduplicar un camino por valor de dígito.',
    '7942 confirma que las coincidencias de cuatro cifras existen en la práctica y deben conservarse como clase VT4 independiente.',
  ],
};

export type VTObservedLengthSummary = {
  total: number;
  VT2: string[];
  VT3: string[];
  VT4: string[];
};

export function summarizeObservedLengths(sheet: VTObservedMatchSheet): VTObservedLengthSummary {
  const all = Object.values(sheet.matchesByTurn).flat();
  return {
    total: all.length,
    VT2: all.filter(x => x.length === 2),
    VT3: all.filter(x => x.length === 3),
    VT4: all.filter(x => x.length === 4),
  };
}

export const OBSERVED_MATCH_SHEETS: VTObservedMatchSheet[] = [OBSERVED_MA29_122];
