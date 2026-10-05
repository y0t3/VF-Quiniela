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
    // Confirmado por explicación del usuario: la primera franja está vacía
    // porque en Previa no coincidió ningún resultado con formaciones de arriba.
    Previa: [],

    // Lectura de los bloques remarcados inferiores de la foto MA29/122.
    // Se conserva exactamente lo visible; todavía falta enlazar cada valor
    // con las celdas concretas de su recorrido superior.
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
  ],
};

export const OBSERVED_MATCH_SHEETS: VTObservedMatchSheet[] = [OBSERVED_MA29_122];
