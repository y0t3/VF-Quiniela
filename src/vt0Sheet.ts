// VT0 — constructor de hoja digital.
// Convierte columnas de valores base + su +11 en celdas con coordenadas estables.
// No pronostica: prepara la geometría para calibración y backtest.

import { VTCell, VTLength, VTPath, extractVTPaths, geometrySignature } from './vt0';

export type VTRowInput = {
  value: string;
  plus11?: string;
  source?: string;
};

export type VTColumnInput = {
  id: string;
  turn?: string;
  day?: string;
  rows: VTRowInput[];
};

export type VTSheet = {
  cells: VTCell[];
  columns: VTColumnInput[];
};

export function digitPlus11(value: string): string {
  return value.replace(/\d/g, d => String((Number(d) + 1) % 10));
}

export function buildVTSheet(columns: VTColumnInput[]): VTSheet {
  const cells: VTCell[] = [];
  columns.forEach((column, columnIndex) => {
    column.rows.forEach((row, rowIndex) => {
      const base = row.value.replace(/\D/g, '');
      const p11 = (row.plus11 ?? digitPlus11(base)).replace(/\D/g, '');
      [...base].forEach((d, digitIndex) => cells.push({
        id: `${column.id}:r${rowIndex}:b${digitIndex}`,
        digit: Number(d), row: rowIndex * 6 + digitIndex, col: columnIndex * 4,
        source: row.source ?? `${column.id}:r${rowIndex}`, turn: column.turn, day: column.day,
        plus11: false,
      }));
      [...p11].forEach((d, digitIndex) => cells.push({
        id: `${column.id}:r${rowIndex}:p${digitIndex}`,
        digit: Number(d), row: rowIndex * 6 + digitIndex, col: columnIndex * 4 + 1,
        source: row.source ?? `${column.id}:r${rowIndex}`, turn: column.turn, day: column.day,
        plus11: true,
      }));
    });
  });
  return { cells, columns };
}

export type VTFormationSummary = {
  digits: string;
  reverse: string;
  readings: string[];
  geometry: string;
  anchor: { row:number; col:number };
  directPlus11: boolean;
  closed: boolean;
  cellIds: string[];
};

export function listFormations(sheet: VTSheet, length: VTLength): VTFormationSummary[] {
  return extractVTPaths(sheet.cells, length).map((p: VTPath) => ({
    digits: p.digits,
    reverse: p.reverseDigits,
    readings: p.readings,
    geometry: geometrySignature(p),
    anchor: p.anchor,
    directPlus11: p.directPlus11,
    closed: p.closed,
    cellIds: p.cellIds,
  }));
}

export type VTSheetFormationReport = {
  VT2: VTFormationSummary[];
  VT3: VTFormationSummary[];
  VT4Open: VTFormationSummary[];
  VT4Closed: VTFormationSummary[];
  counts: { VT2:number; VT3:number; VT4Open:number; VT4Closed:number; directPlus11:number };
};

// Informe base de una hoja: todavía no asigna probabilidades ni pronostica.
// Separa las estructuras que luego cruzaremos contra las marcas/resultados reales.
export function analyzeVTSheet(sheet: VTSheet): VTSheetFormationReport {
  const VT2=listFormations(sheet,2);
  const VT3=listFormations(sheet,3);
  const VT4=listFormations(sheet,4);
  const VT4Open=VT4.filter(p=>!p.closed);
  const VT4Closed=VT4.filter(p=>p.closed);
  return {
    VT2,VT3,VT4Open,VT4Closed,
    counts:{VT2:VT2.length,VT3:VT3.length,VT4Open:VT4Open.length,VT4Closed:VT4Closed.length,directPlus11:VT2.filter(p=>p.directPlus11).length},
  };
}

export function groupByGeometry(paths: VTPath[]): Map<string, VTPath[]> {
  const groups = new Map<string, VTPath[]>();
  for (const path of paths) {
    const key = geometrySignature(path);
    groups.set(key, [...(groups.get(key) ?? []), path]);
  }
  return groups;
}

export function sharedGeometries(a: VTSheet, b: VTSheet, length: VTLength) {
  const pa = extractVTPaths(a.cells, length);
  const pb = extractVTPaths(b.cells, length);
  const ga = groupByGeometry(pa), gb = groupByGeometry(pb);
  return [...ga.keys()].filter(k => gb.has(k)).map(geometry => ({
    geometry,
    previous: ga.get(geometry) ?? [],
    current: gb.get(geometry) ?? [],
  }));
}
