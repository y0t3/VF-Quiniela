// VT0 — constructor de hoja digital.
// Convierte columnas de valores base + su +11 en celdas con coordenadas estables.
// No pronostica: prepara la geometría para calibración y backtest.

import { VTCell, VTLength, VTPath, extractVTPaths, geometrySignature } from './vt0';

export type VTRowInput = {
  value: string;       // valor base tal como se anota, preservando ceros iniciales
  plus11?: string;     // si se omite, se calcula dígito a dígito módulo 10
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

// +11 visual: cada dígito avanza 1 y conserva su posición. 9 -> 0.
export function digitPlus11(value: string): string {
  return value.replace(/\d/g, d => String((Number(d) + 1) % 10));
}

export function buildVTSheet(columns: VTColumnInput[]): VTSheet {
  const cells: VTCell[] = [];
  columns.forEach((column, columnIndex) => {
    column.rows.forEach((row, rowIndex) => {
      const base = row.value.replace(/\D/g, '');
      const p11 = (row.plus11 ?? digitPlus11(base)).replace(/\D/g, '');
      // Cada columna lógica reserva dos subcolumnas: base y +11.
      // Dentro de cada número, los dígitos se apilan verticalmente para conservar
      // la lectura/roce que luego calibraremos contra las hojas reales.
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
  geometry: string;
  anchor: { row:number; col:number };
  directPlus11: boolean;
  cellIds: string[];
};

export function listFormations(sheet: VTSheet, length: VTLength): VTFormationSummary[] {
  return extractVTPaths(sheet.cells, length).map((p: VTPath) => ({
    digits: p.digits,
    reverse: p.reverseDigits,
    geometry: geometrySignature(p),
    anchor: p.anchor,
    directPlus11: p.directPlus11,
    cellIds: p.cellIds,
  }));
}

// Agrupa por huella geométrica para detectar formas que reaparecen sin exigir
// que repitan los mismos números.
export function groupByGeometry(paths: VTPath[]): Map<string, VTPath[]> {
  const groups = new Map<string, VTPath[]>();
  for (const path of paths) {
    const key = geometrySignature(path);
    groups.set(key, [...(groups.get(key) ?? []), path]);
  }
  return groups;
}

// Compara dos hojas y devuelve geometrías presentes en ambas. Esto será la base
// para medir la réplica semana anterior -> semana actual conservando posición.
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
