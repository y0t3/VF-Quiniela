import { VTBoard, VTColumn, VT_JURISDICTIONS } from './vt0Board';

// Reconstrucción inversa del procedimiento manuscrito:
// 1) el tablero +11 ya existe antes del turno objetivo;
// 2) después del sorteo recibimos una cabeza real;
// 3) buscamos si sus últimas 2/3/4 cifras pueden formarse por roce continuo;
// 4) el resultado escrito debajo es etiqueta de validación, NO fuente del camino.

export type VTDigitNode = {
  column:number;
  row:number;
  digitIndex:number;
  digit:string;
  targetTurn:VTColumn;
  jurisdiction:string;
};

export type VTFoundPath = {
  value:string;
  nodes:VTDigitNode[];
};

function key(n:Pick<VTDigitNode,'column'|'row'|'digitIndex'>):string {
  return `${n.column}:${n.row}:${n.digitIndex}`;
}

export function flattenBoard(board:VTBoard):VTDigitNode[] {
  return board.flatMap(column => column.flatMap(cell =>
    cell.digits.map((digit,digitIndex)=>({
      column:cell.column,row:cell.row,digitIndex,digit,
      targetTurn:cell.targetTurn,jurisdiction:cell.jurisdiction,
    }))
  ));
}

// Dos cifras se rozan cuando sus posiciones gráficas son vecinas.
// Dentro de una misma celda, índices consecutivos se tocan horizontalmente.
// Entre celdas vecinas (incluida diagonal), permitimos el roce de posiciones
// equivalentes o adyacentes dentro del número escrito. No se permiten saltos.
export function touches(a:VTDigitNode,b:VTDigitNode):boolean {
  if(key(a)===key(b)) return false;
  const dc=Math.abs(a.column-b.column);
  const dr=Math.abs(a.row-b.row);
  const dd=Math.abs(a.digitIndex-b.digitIndex);

  if(dc===0 && dr===0) return dd===1;
  if(dc<=1 && dr<=1 && (dc+dr)>0) return dd<=1;
  return false;
}

export function findPathsForValue(board:VTBoard,value:string):VTFoundPath[] {
  if(!/^[0-9]{2,4}$/.test(value)) throw new Error(`VT sólo admite 2-4 cifras: ${value}`);
  const nodes=flattenBoard(board);
  const found:VTFoundPath[]=[];

  function walk(index:number,path:VTDigitNode[],used:Set<string>) {
    if(index===value.length) {
      found.push({value,nodes:[...path]});
      return;
    }
    const expected=value[index];
    for(const node of nodes) {
      const k=key(node);
      if(used.has(k) || node.digit!==expected) continue;
      if(path.length && !touches(path[path.length-1],node)) continue;
      used.add(k); path.push(node);
      walk(index+1,path,used);
      path.pop(); used.delete(k);
    }
  }

  walk(0,[],new Set());
  return found;
}

export function suffixesFromHead(head:string):string[] {
  const clean=String(head).replace(/\D/g,'');
  const out:string[]=[];
  for(const length of [2,3,4]) if(clean.length>=length) out.push(clean.slice(-length));
  return out;
}

export type VTHistoricalHeadMatch = {
  jurisdiction:string;
  head:string;
  matches:{value:string;paths:VTFoundPath[]}[];
};

export function matchRealHeadsAgainstBoard(
  board:VTBoard,
  realHeads:Partial<Record<(typeof VT_JURISDICTIONS)[number],string>>,
):VTHistoricalHeadMatch[] {
  return VT_JURISDICTIONS.flatMap(jurisdiction => {
    const head=realHeads[jurisdiction];
    if(!head) return [];
    const matches=suffixesFromHead(head)
      .map(value=>({value,paths:findPathsForValue(board,value)}))
      .filter(x=>x.paths.length>0);
    return [{jurisdiction,head,matches}];
  });
}

// Para validar una hoja histórica: comparar el conjunto producido aquí contra
// matchesByTurn del manuscrito. Si aparecen demasiados extras, falta aprender
// una regla humana de selección; no se deben borrar extras a mano.
export function matchedValues(matches:VTHistoricalHeadMatch[]):string[] {
  return matches.flatMap(m=>m.matches.map(x=>x.value));
}
