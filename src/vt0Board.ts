// Tablero determinístico del método manuscrito VT0.
// La geometría NO se estima desde la foto: fila = jurisdicción, columna = turno.
// Cada columna se construye con las 6 cabezas del turno fuente aplicando +11.
// PREVIA usa la NOCTURNA del día anterior; las siguientes usan el turno
// inmediatamente anterior del mismo día.

export const VT_JURISDICTIONS = [
  'Ciudad', 'Provincia', 'Córdoba', 'Santa Fe', 'Entre Ríos', 'Montevideo',
] as const;
export type VTJurisdiction = typeof VT_JURISDICTIONS[number];

export const VT_COLUMNS = ['Previa','Primera','Matutina','Vespertina','Nocturna'] as const;
export type VTColumn = typeof VT_COLUMNS[number];

export type VTHeads = Record<VTJurisdiction, string>;
export type VTDayHeads = Partial<Record<VTColumn, VTHeads>>;

export type VTCell = {
  row: number;
  column: number;
  jurisdiction: VTJurisdiction;
  targetTurn: VTColumn;
  sourceTurn: VTColumn | 'NocturnaAnterior';
  sourceHead: string;
  plus11: string;
  digits: string[];
};

export type VTBoard = VTCell[][];

// El +11 manuscrito se conserva como transformación separada para poder
// reemplazarla si la implementación histórica concreta difiere en algún borde.
export function plus11(head: string): string {
  const n = Number(head);
  if (!Number.isInteger(n)) throw new Error(`Cabeza inválida: ${head}`);
  const width = Math.max(2, head.length);
  const modulus = 10 ** width;
  return String((n + 11) % modulus).padStart(width, '0');
}

function sourceForColumn(
  target: VTColumn,
  previousNocturna: VTHeads,
  today: VTDayHeads,
): {sourceTurn: VTCell['sourceTurn']; heads: VTHeads} {
  if (target === 'Previa') return {sourceTurn:'NocturnaAnterior', heads:previousNocturna};
  const source: Record<Exclude<VTColumn,'Previa'>,VTColumn> = {
    Primera:'Previa', Matutina:'Primera', Vespertina:'Matutina', Nocturna:'Vespertina',
  };
  const sourceTurn = source[target];
  const heads = today[sourceTurn];
  if (!heads) throw new Error(`Faltan cabezas de ${sourceTurn} para construir ${target}`);
  return {sourceTurn, heads};
}

export function buildVTBoard(previousNocturna: VTHeads, today: VTDayHeads): VTBoard {
  return VT_COLUMNS.map((targetTurn, column) => {
    const {sourceTurn, heads} = sourceForColumn(targetTurn, previousNocturna, today);
    return VT_JURISDICTIONS.map((jurisdiction, row) => {
      const sourceHead = heads[jurisdiction];
      const transformed = plus11(sourceHead);
      return {row,column,jurisdiction,targetTurn,sourceTurn,sourceHead,plus11:transformed,digits:[...transformed]};
    });
  });
}

// Coordenada estable de una celda. Ya no usamos top/middle/bottom.
export function cellKey(cell: Pick<VTCell,'row'|'column'>): string {
  return `${cell.column}:${cell.row}`;
}

export function getCell(board: VTBoard, turn: VTColumn, jurisdiction: VTJurisdiction): VTCell {
  return board[VT_COLUMNS.indexOf(turn)][VT_JURISDICTIONS.indexOf(jurisdiction)];
}
