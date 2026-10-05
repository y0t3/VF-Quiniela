// VT0 — staging de hojas REALES del método manuscrito.
// IMPORTANTE: acá sólo entran cifras/recorridos que podamos leer con seguridad.
// Una foto ambigua NO se completa por inferencia: queda pendiente de confirmación.

import { VTCalibrationSheet, calibrateSheet } from './vt0Calibration';
import { geometrySignature, extractVTAll } from './vt0';

export type VTRealSheetStatus = 'pending-transcription' | 'partial' | 'confirmed';
export type VTRealSheet = VTCalibrationSheet & {
  status: VTRealSheetStatus;
  day?: string;
  turn?: string;
  sourceRef?: string;
};

// Registro de la primera hoja/foto aportada. Todavía no transcribimos dígitos dudosos
// desde la imagen: el objetivo es preservar la geometría exacta antes que fabricar datos.
export const REAL_SHEET_01: VTRealSheet = {
  id: 'real-sheet-01',
  label: 'Foto real — hoja semanal / trazados resaltados',
  status: 'pending-transcription',
  sourceRef: 'foto enviada en conversación',
  cells: [],
  positives: [],
  negatives: [],
  notes: [
    'La hoja se interpreta por posición: cada +11 conserva fila y columna.',
    'Un candidato necesita roce continuo; no se permiten saltos entre cifras.',
    'Los trazados observados en turnos/días anteriores sirven como geometría de referencia.',
    'La misma geometría debe buscar respaldo en otras columnas disponibles del día.',
    'La repetición de una cifra dispersa no constituye respaldo.',
    'VT2, VT3 y VT4 se registran por separado.',
    'VT4 puede cerrar un cuadrado: la última celda puede tocar la primera.',
  ],
};

export const REAL_SHEETS: VTRealSheet[] = [REAL_SHEET_01];

export type VTRealSheetAudit = {
  id: string;
  status: VTRealSheetStatus;
  transcribedCells: number;
  markedPositiveTraces: number;
  markedNegativeTraces: number;
  calibration: ReturnType<typeof calibrateSheet> | null;
  signatures: { VT2:string[]; VT3:string[]; VT4:string[] } | null;
};

// Auditoría deliberadamente conservadora: una hoja pendiente no produce candidatos.
export function auditRealSheet(sheet: VTRealSheet): VTRealSheetAudit {
  if (sheet.status === 'pending-transcription' || sheet.cells.length === 0) {
    return {
      id: sheet.id,
      status: sheet.status,
      transcribedCells: sheet.cells.length,
      markedPositiveTraces: sheet.positives.length,
      markedNegativeTraces: sheet.negatives.length,
      calibration: null,
      signatures: null,
    };
  }

  const all = extractVTAll(sheet.cells);
  const uniq = (xs:string[]) => [...new Set(xs)].sort();
  return {
    id: sheet.id,
    status: sheet.status,
    transcribedCells: sheet.cells.length,
    markedPositiveTraces: sheet.positives.length,
    markedNegativeTraces: sheet.negatives.length,
    calibration: calibrateSheet(sheet),
    signatures: {
      VT2: uniq(all.VT2.map(geometrySignature)),
      VT3: uniq(all.VT3.map(geometrySignature)),
      VT4: uniq(all.VT4.map(geometrySignature)),
    },
  };
}

export function auditRealSheets(){ return REAL_SHEETS.map(auditRealSheet); }
