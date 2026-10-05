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
  id: 'real-2026-09-29', date: '2026-09-29', sequence: 122, status: 'confirmed',
  matchesByTurn: {
    Previa: [], Primera: ['54', '983'], Matutina: ['389', '86', '468'],
    Vespertina: ['26', '62', '31'], Nocturna: ['894', '907', '796', '7942', '22'],
  },
  notes: [
    'Abajo sólo se anotan coincidencias encontradas; no es una lista completa de resultados ni incluye jurisdicción.',
    'Los resaltados superiores se realizan después del sorteo y muestran dónde se formó por roce cada coincidencia inferior.',
    'Previa vacía significa cero coincidencias observadas para ese turno; no significa ausencia de recorridos geométricos posibles en la matriz.',
    'Corrección por ampliación de la foto: Matutina es 468, no 463.',
    'MA29 contiene 13 coincidencias observadas: 6 VT2, 6 VT3 y 1 VT4.',
    '983 y 389 reutilizan el mismo eje físico en sentidos opuestos; 26 y 62 reutilizan el mismo contacto en sentidos opuestos.',
    '22 confirma dos celdas contiguas con la misma cifra; 7942 confirma VT4.',
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

// MI30: transcripción de los segmentos resaltados de 2-4 cifras debajo de cada
// una de las cinco columnas/turnos. Hay además una marca aislada de una cifra
// en Matutina; se excluye porque VT0 estudia VT2/VT3/VT4.
export const OBSERVED_MI30_123: VTObservedMatchSheet = {
  id: 'real-2026-09-30', date: '2026-09-30', sequence: 123, status: 'partial',
  matchesByTurn: {
    Previa: ['53'],
    Primera: ['04', '70', '07'],
    Matutina: ['371', '859', '778', '718'],
    Vespertina: ['67', '51', '43'],
    Nocturna: ['67', '90', '786', '67', '83'],
  },
  notes: [
    'Transcripción visual desde las fotos 1000574961/1000574960.',
    'Se conservan duplicados: 67 aparece dos veces en Nocturna y también aparece en Vespertina; cada aparición corresponde a evidencia espacial propia.',
    'La marca aislada de una cifra en Matutina no se incorpora a VT2/VT3/VT4.',
    'Status partial: las coincidencias están transcritas, pero falta cerrar celda por celda todos sus recorridos superiores.',
  ],
};

export const OBSERVED_JU01_124: VTObservedMatchSheet = {
  id: 'real-2026-10-01', date: '2026-10-01', sequence: 124, status: 'partial',
  matchesByTurn: {
    Previa: ['57', '847'],
    Primera: ['708', '78', '05'],
    Matutina: ['743', '05', '94', '483', '548'],
    Vespertina: ['99', '89'],
    Nocturna: ['584', '39', '65'],
  },
  notes: [
    'Transcripción visual desde la hoja JU 1 / 124 en 1000574960.',
    '05 aparece en Primera y Matutina: se conserva en ambos turnos, sin deduplicar por valor.',
    'Status partial: falta cerrar celda por celda todos los recorridos superiores y su firma geométrica.',
  ],
};

export type VTObservedLengthSummary = { total: number; VT2: string[]; VT3: string[]; VT4: string[] };

export function summarizeObservedLengths(sheet: VTObservedMatchSheet): VTObservedLengthSummary {
  const all = Object.values(sheet.matchesByTurn).flat();
  return {
    total: all.length,
    VT2: all.filter(x => x.length === 2),
    VT3: all.filter(x => x.length === 3),
    VT4: all.filter(x => x.length === 4),
  };
}

export const OBSERVED_MATCH_SHEETS: VTObservedMatchSheet[] = [
  OBSERVED_MA29_122,
  OBSERVED_MI30_123,
  OBSERVED_JU01_124,
];
