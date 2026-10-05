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

export type VTObservedPath = {
  value: string;
  reverseOf?: string;
  geometry: 'contact' | 'chain' | 'turning-chain';
  confirmedNoJump: boolean;
  notes?: string;
};

export const OBSERVED_MA29_122: VTObservedMatchSheet = {
  id: 'real-2026-09-29',
  date: '2026-09-29',
  sequence: 122,
  status: 'confirmed',
  matchesByTurn: {
    Previa: [],
    Primera: ['54', '983'],
    Matutina: ['389', '86', '468'],
    Vespertina: ['26', '62', '31'],
    Nocturna: ['894', '907', '796', '7942', '22'],
  },
  notes: [
    'Abajo sólo se anotan coincidencias encontradas; no es una lista completa de resultados ni incluye jurisdicción.',
    'Los resaltados superiores se realizan después del sorteo y muestran dónde se formó por roce cada coincidencia inferior.',
    'Previa vacía significa cero coincidencias observadas para ese turno; no significa ausencia de recorridos geométricos posibles en la matriz.',
    'Corrección por ampliación de la foto: Matutina es 468, no 463.',
    'MA29 contiene 13 coincidencias observadas: 6 VT2, 6 VT3 y 1 VT4.',
    'Distribución por turno: Previa 0, Primera 2, Matutina 3, Vespertina 3, Nocturna 5.',
    '983 y 389 reutilizan el mismo eje físico en sentidos opuestos.',
    '26 y 62 reutilizan el mismo contacto en sentidos opuestos.',
    '22 confirma que dos celdas contiguas con la misma cifra son un VT2 válido.',
    '7942 confirma que las coincidencias de cuatro cifras existen en la práctica.',
  ],
};

export const PATHS_MA29_122: VTObservedPath[] = [
  { value: '54', geometry: 'contact', confirmedNoJump: true },
  { value: '983', geometry: 'chain', confirmedNoJump: true },
  { value: '389', reverseOf: '983', geometry: 'chain', confirmedNoJump: true },
  { value: '86', geometry: 'contact', confirmedNoJump: true },
  { value: '468', geometry: 'chain', confirmedNoJump: true },
  { value: '26', geometry: 'contact', confirmedNoJump: true },
  { value: '62', reverseOf: '26', geometry: 'contact', confirmedNoJump: true },
  { value: '31', geometry: 'contact', confirmedNoJump: true },
  { value: '894', geometry: 'chain', confirmedNoJump: true },
  { value: '907', geometry: 'chain', confirmedNoJump: true },
  { value: '796', geometry: 'chain', confirmedNoJump: true },
  { value: '7942', geometry: 'turning-chain', confirmedNoJump: true },
  { value: '22', geometry: 'contact', confirmedNoJump: true },
];

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
