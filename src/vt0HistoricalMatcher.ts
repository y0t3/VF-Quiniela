import { VTBoard, VTColumn, VT_JURISDICTIONS } from './vt0Board';

// Reconstrucción inversa:
// tablero acumulado existente ANTES del turno -> cabezas reales -> sufijos 2/3/4
// -> caminos de roce continuo. Lo anotado abajo sólo valida el hallazgo.

export type VTDigitNode = {
  column:number;
  row:number;
  digit:string;
  targetTurn:VTColumn;
  jurisdiction:string;
};

export type VTFoundPath = { value:string; nodes:VTDigitNode[] };

function key(n:Pick<VTDigitNode,'column'|'row'>):string { return `${n.row}:${n.column}`; }

export function flattenBoard(board:VTBoard):VTDigitNode[] {
  return board.flatMap(row => row.map(cell=>({
    column:cell.digitColumn,
    row:cell.row,
    digit:cell.digit,
    targetTurn:cell.targetTurn,
    jurisdiction:cell.jurisdiction,
  })));
}

// El tablero físico es una grilla de 6 filas x (2 columnas por fuente).
// Hay roce horizontal, vertical y diagonal (vecindad de rey). No hay saltos.
export function touches(a:VTDigitNode,b:VTDigitNode):boolean {
  if(key(a)===key(b)) return false;
  const dc=Math.abs(a.column-b.column);
  const dr=Math.abs(a.row-b.row);
  return dc<=1 && dr<=1 && (dc+dr)>0;
}

export function findPathsForValue(board:VTBoard,value:string):VTFoundPath[] {
  if(!/^[0-9]{2,4}$/.test(value)) throw new Error(`VT sólo admite 2-4 cifras: ${value}`);
  const nodes=flattenBoard(board);
  const found:VTFoundPath[]=[];

  function walk(index:number,path:VTDigitNode[],used:Set<string>) {
    if(index===value.length){ found.push({value,nodes:[...path]}); return; }
    const expected=value[index];
    for(const node of nodes){
      const k=key(node);
      if(used.has(k)||node.digit!==expected) continue;
      if(path.length&&!touches(path[path.length-1],node)) continue;
      used.add(k); path.push(node); walk(index+1,path,used); path.pop(); used.delete(k);
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
  return VT_JURISDICTIONS.flatMap(jurisdiction=>{
    const head=realHeads[jurisdiction];
    if(!head||head==='----') return [];
    const matches=suffixesFromHead(head)
      .map(value=>({value,paths:findPathsForValue(board,value)}))
      .filter(x=>x.paths.length>0);
    return [{jurisdiction,head,matches}];
  });
}

export function matchedValues(matches:VTHistoricalHeadMatch[]):string[] {
  return matches.flatMap(m=>m.matches.map(x=>x.value));
}
