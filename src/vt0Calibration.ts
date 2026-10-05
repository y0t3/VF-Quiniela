// VT0 calibration harness — transcripción MANUAL de hojas reales.
// Este archivo NO alimenta pronósticos. Su objetivo es comparar lo que marca la hoja
// con las reglas geométricas de VT0 antes de conectar históricos.

import {
  VTCell,
  VTMarkedTrace,
  VTGridOptions,
  validateMarkedTraces,
  geometryCalibration,
} from './vt0';

export type VTCalibrationSheet = {
  id: string;
  label: string;
  cells: VTCell[];
  positives: VTMarkedTrace[];
  negatives: VTMarkedTrace[];
  notes?: string[];
};

export type VTCalibrationModeResult = {
  mode: string;
  positivesDetected: number;
  positivesTotal: number;
  negativesRejected: number;
  negativesTotal: number;
  falsePositives: string[];
  missedPositives: string[];
};

const MODES: { name: string; opts: VTGridOptions }[] = [
  { name: 'vertical', opts: { allowHorizontal: false, allowVertical: true, allowDiagonal: false } },
  { name: 'vertical+diagonal', opts: { allowHorizontal: false, allowVertical: true, allowDiagonal: true } },
  { name: '8-direcciones', opts: { allowHorizontal: true, allowVertical: true, allowDiagonal: true } },
];

/**
 * Compara marcas positivas (lo que sí considera el método) y negativas
 * (combinaciones cercanas que NO deben aceptarse). Una regla útil debe recuperar
 * muchos positivos sin empezar a aceptar los negativos.
 */
export function calibrateSheet(sheet: VTCalibrationSheet): VTCalibrationModeResult[] {
  return MODES.map(({ name, opts }) => {
    const positives = validateMarkedTraces(sheet.cells, sheet.positives, opts);
    const negatives = validateMarkedTraces(sheet.cells, sheet.negatives, opts);
    return {
      mode: name,
      positivesDetected: positives.filter(x => x.detected && (x.exactOrder || x.reverseOrder)).length,
      positivesTotal: positives.length,
      negativesRejected: negatives.filter(x => !x.detected).length,
      negativesTotal: negatives.length,
      falsePositives: negatives.filter(x => x.detected).map(x => x.id),
      missedPositives: positives.filter(x => !x.detected || (!x.exactOrder && !x.reverseOrder)).map(x => x.id),
    };
  });
}

export function inspectSheet(sheet: VTCalibrationSheet) {
  return {
    sheet: sheet.id,
    label: sheet.label,
    pathExplosion: geometryCalibration(sheet.cells),
    calibration: calibrateSheet(sheet),
    notes: sheet.notes ?? [],
  };
}

/*
TRANSCRIPCIÓN REAL — REGLAS

1. Cada cifra escrita en el +11 ocupa UNA celda con fila/columna propia.
2. No inventar una cifra dudosa desde una foto/video: marcarla primero fuera del dataset.
3. positives = trazados que la marca/resaltado o la explicación confirma.
4. negatives = combinaciones que visualmente están cerca pero que el método NO toma
   (por ejemplo, requieren saltear una posición).
5. Conservar columnas/turnos: la posición es información, no decoración.
6. Las dos orientaciones de un mismo camino se consideran el mismo camino geométrico,
   pero validateMarkedTraces conserva si el número se leyó directo o invertido.

Los fotogramas 12_60 y 14_80 confirman visualmente varias marcas continuas y pequeños
cambios de dirección. No se transcriben aquí dígitos ambiguos: para calibrar el motor
preferimos menos casos, pero inequívocos, antes que contaminar el patrón con una lectura
incierta de la escritura manuscrita.
*/

// Caso sintético de control basado en la explicación explícita 570 / 075:
// tres casillas contiguas forman 5→7→0; 507 y 057 requerirían saltear/reordenar.
export const CONTROL_570: VTCalibrationSheet = {
  id: 'control-570',
  label: 'Control de continuidad 570 ↔ 075',
  cells: [
    { id: 'c0', digit: 5, row: 0, col: 0, source: '+11-A', plus11: true },
    { id: 'c1', digit: 7, row: 1, col: 0, source: '+11-A', plus11: true },
    { id: 'c2', digit: 0, row: 2, col: 0, source: '+11-A', plus11: true },
  ],
  positives: [
    { id: '570-directo', expected: '570', cellIds: ['c0', 'c1', 'c2'] },
    { id: '075-inverso', expected: '075', cellIds: ['c2', 'c1', 'c0'] },
  ],
  negatives: [
    { id: '507-salteado', expected: '507', cellIds: ['c0', 'c2', 'c1'] },
    { id: '057-salteado', expected: '057', cellIds: ['c2', 'c0', 'c1'] },
  ],
  notes: ['Control mínimo: el orden espacial manda; no alcanza con contener las mismas cifras.'],
};
