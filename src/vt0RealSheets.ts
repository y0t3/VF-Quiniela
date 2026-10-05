// VT0 — staging de hojas REALES del método manuscrito.
// IMPORTANTE: acá sólo entran cifras/recorridos que podamos leer con seguridad.
// Una foto ambigua NO se completa por inferencia: queda pendiente de confirmación.

import { VTCalibrationSheet, calibrateSheet } from './vt0Calibration';
import { geometrySignature, extractVTAll } from './vt0';

export type VTRealSheetStatus = 'pending-transcription' | 'partial' | 'confirmed';
export type VTRealSheet = VTCalibrationSheet & {
  status: VTRealSheetStatus;
  day?: string;
  date?: string;
  turn?: string;
  sourceRef?: string;
  sequence?: number;
};

const METHOD_NOTES = [
  'La hoja se interpreta por posición: cada +11 conserva fila y columna.',
  'Un candidato necesita roce continuo; no se permiten saltos entre cifras.',
  'Los trazados observados en turnos/días anteriores sirven como geometría de referencia.',
  'La misma geometría debe buscar respaldo en otras columnas disponibles del día.',
  'La repetición de una cifra dispersa no constituye respaldo.',
  'VT2, VT3 y VT4 se registran por separado.',
  'VT4 puede cerrar un cuadrado: la última celda puede tocar la primera.',
];

function pendingSheet(
  id:string,
  label:string,
  day:string,
  date:string,
  sequence:number,
  sourceRef:string,
):VTRealSheet {
  return {
    id, label, day, date, sequence, sourceRef,
    status:'pending-transcription',
    cells:[], positives:[], negatives:[],
    notes:[...METHOD_NOTES],
  };
}

// Cronología identificada visualmente por la anotación del margen inferior derecho.
// Fechas: semana que cruza septiembre/octubre de 2026; domingo 04/10 no tiene sorteo.
// Varias fotos contienen dos hojas superpuestas: se registran por HOJA/DÍA, no por foto.
export const REAL_SHEET_TUE_29 = pendingSheet(
  'real-2026-09-29','Hoja real — martes 29','Martes','2026-09-29',122,
  'foto 1000574961 — hoja superior (marca MA 29 / 122)',
);
export const REAL_SHEET_WED_30 = pendingSheet(
  'real-2026-09-30','Hoja real — miércoles 30','Miércoles','2026-09-30',123,
  'fotos 1000574961 y 1000574960 — hoja marcada MI 30 / 123',
);
export const REAL_SHEET_THU_01 = pendingSheet(
  'real-2026-10-01','Hoja real — jueves 1','Jueves','2026-10-01',124,
  'foto 1000574960 — hoja marcada JU 1 / 124',
);
export const REAL_SHEET_FRI_02 = pendingSheet(
  'real-2026-10-02','Hoja real — viernes 2','Viernes','2026-10-02',125,
  'foto 1000574959 — hoja superior marcada VI 2 / 125',
);
export const REAL_SHEET_SAT_03 = pendingSheet(
  'real-2026-10-03','Hoja real — sábado 3','Sábado','2026-10-03',126,
  'foto 1000574959 — hoja inferior marcada SA 3 / 126',
);
export const REAL_SHEET_MON_05 = pendingSheet(
  'real-2026-10-05','Hoja real — lunes 5','Lunes','2026-10-05',127,
  'foto 1000574962 — marca LUN 5; secuencia inferida 127, pendiente de confirmar si se necesita',
);

export const REAL_SHEETS: VTRealSheet[] = [
  REAL_SHEET_TUE_29,
  REAL_SHEET_WED_30,
  REAL_SHEET_THU_01,
  REAL_SHEET_FRI_02,
  REAL_SHEET_SAT_03,
  REAL_SHEET_MON_05,
];

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
