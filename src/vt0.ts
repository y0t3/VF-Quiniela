// VT0 — extractor geométrico experimental del método de trazados.
// IMPORTANTE: este módulo NO predice ni asigna pesos. Sólo representa la hoja,
// contactos reales y recorridos continuos de 2, 3 y 4 cifras.

export type VTLength = 2 | 3 | 4;

export type VTCell = {
  id: string;
  digit: number;
  row: number;
  col: number;
  // Permite conservar de dónde vino el dígito sin alterar su geometría.
  source?: string;
  turn?: string;
  day?: string;
  plus11?: boolean;
};

export type VTStep = { dr: number; dc: number };

export type VTPath = {
  length: VTLength;
  digits: string;
  reverseDigits: string;
  cellIds: string[];
  cells: VTCell[];
  steps: VTStep[];
  anchor: { row: number; col: number };
  directPlus11: boolean;
};

export type VTEcho = {
  candidate: string;
  column: number;
  paths: VTPath[];
};

export type VTGridOptions = {
  // Por ahora usamos vecindad inmediata de 8 direcciones: lateral, vertical y diagonal.
  // No hay saltos: |dr| y |dc| nunca pueden superar 1.
  allowHorizontal?: boolean;
  allowVertical?: boolean;
  allowDiagonal?: boolean;
};

const DEFAULT_OPTIONS: Required<VTGridOptions> = {
  allowHorizontal: true,
  allowVertical: true,
  allowDiagonal: true,
};

function touching(a: VTCell, b: VTCell, options: Required<VTGridOptions>): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  if (dr === 0 && dc === 0) return false;
  if (dr > 1 || dc > 1) return false; // regla central: jamás saltar casillas
  if (dr === 0 && dc === 1) return options.allowHorizontal;
  if (dr === 1 && dc === 0) return options.allowVertical;
  if (dr === 1 && dc === 1) return options.allowDiagonal;
  return false;
}

function pathKey(ids: string[]): string {
  const fwd = ids.join('>');
  const rev = [...ids].reverse().join('>');
  return fwd < rev ? fwd : rev;
}

function makePath(cells: VTCell[]): VTPath {
  const digits = cells.map(c => c.digit).join('');
  const reverseDigits = [...cells].reverse().map(c => c.digit).join('');
  const steps = cells.slice(1).map((cell, i) => ({
    dr: cell.row - cells[i].row,
    dc: cell.col - cells[i].col,
  }));
  const middle = cells[Math.floor((cells.length - 1) / 2)];
  return {
    length: cells.length as VTLength,
    digits,
    reverseDigits,
    cellIds: cells.map(c => c.id),
    cells,
    steps,
    anchor: { row: middle.row, col: middle.col },
    // Caso VT2 especial: ambas cifras pertenecen al mismo +11/origen.
    directPlus11:
      cells.length === 2 &&
      cells.every(c => c.plus11 === true) &&
      !!cells[0].source &&
      cells[0].source === cells[1].source,
  };
}

/**
 * Enumera TODOS los recorridos continuos de longitud 2, 3 o 4.
 * Un recorrido y su inverso se guardan una sola vez; VTPath conserva ambos números.
 * No se puede reutilizar una celda dentro del mismo recorrido.
 */
export function extractVTPaths(
  cells: VTCell[],
  length: VTLength,
  opts: VTGridOptions = {},
): VTPath[] {
  const options = { ...DEFAULT_OPTIONS, ...opts };
  const neighbours = new Map<string, VTCell[]>();
  for (const a of cells) {
    neighbours.set(a.id, cells.filter(b => touching(a, b, options)));
  }

  const seen = new Set<string>();
  const out: VTPath[] = [];

  const walk = (path: VTCell[]) => {
    if (path.length === length) {
      const key = pathKey(path.map(c => c.id));
      if (!seen.has(key)) {
        seen.add(key);
        out.push(makePath(path));
      }
      return;
    }
    const last = path[path.length - 1];
    for (const next of neighbours.get(last.id) ?? []) {
      if (path.some(c => c.id === next.id)) continue;
      walk([...path, next]);
    }
  };

  for (const cell of cells) walk([cell]);
  return out;
}

export function extractVTAll(cells: VTCell[], opts: VTGridOptions = {}) {
  return {
    VT2: extractVTPaths(cells, 2, opts),
    VT3: extractVTPaths(cells, 3, opts),
    VT4: extractVTPaths(cells, 4, opts),
  };
}

/**
 * Busca respaldo espacial del MISMO conjunto/orden de cifras en otras columnas.
 * Sólo cuenta caminos válidos: las apariciones dispersas no entran nunca.
 * Por ahora acepta candidato directo o invertido; esto queda explícito para poder
 * medir después si el orden debe exigirse o no.
 */
export function findSpatialEchoes(
  candidate: string,
  paths: VTPath[],
  excludedColumns: number[] = [],
): VTEcho[] {
  const byColumn = new Map<number, VTPath[]>();
  for (const path of paths) {
    if (excludedColumns.includes(path.anchor.col)) continue;
    if (path.digits !== candidate && path.reverseDigits !== candidate) continue;
    const list = byColumn.get(path.anchor.col) ?? [];
    list.push(path);
    byColumn.set(path.anchor.col, list);
  }
  return [...byColumn.entries()].map(([column, matching]) => ({
    candidate,
    column,
    paths: matching,
  }));
}

/** Huella geométrica independiente de los dígitos. */
export function geometrySignature(path: VTPath): string {
  const fwd = path.steps.map(s => `${s.dr},${s.dc}`).join('|');
  const rev = [...path.steps]
    .reverse()
    .map(s => `${-s.dr},${-s.dc}`)
    .join('|');
  return fwd < rev ? fwd : rev;
}
