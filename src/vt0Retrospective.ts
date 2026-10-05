import { OBSERVED_MATCH_SHEETS, VTObservedMatchSheet, VTObservedTurn } from './vt0ObservedMatches';
import { VTColumn, VTJurisdiction } from './vt0Board';

// Retrospectiva temporal VT0.
// Leakage-safe: para puntuar un turno sólo usa jornadas anteriores y turnos
// ya ocurridos. El resultado objetivo nunca genera su propio candidato.

export type VTRetrospectiveHit = {
  date:string; turn:VTObservedTurn; value:string;
  exactPreviousDay:boolean; reversePreviousDay:boolean;
  seenEarlierSameDay:boolean; reverseEarlierSameDay:boolean;
};

// Coordenada lógica real del tablero manuscrito.
// Ya no existen bandas visuales top/middle/bottom: la posición está fijada por
// turno/columna + jurisdicción/fila. digitIndex permite ubicar cada cifra dentro
// del valor +11 escrito en esa celda.
export type VTNodeCoordinate = {
  turn: VTColumn;
  jurisdiction: VTJurisdiction;
  column: number;
  row: number;
  digitIndex: number;
};

export type VTSpatialSignature = {
  length:2|3|4;
  steps:string[];
  nodes:VTNodeCoordinate[];
  anchor:{column:number;row:number};
};

export type VTCandidateEvidence = {
  value:string; turn:VTObservedTurn; signature:VTSpatialSignature;
  priorGeometryMatches:number; sameCenterMatches:number; supportingColumns:number;
  exactValueHistory:number; reverseValueHistory:number;
};
export type VTScoredCandidate = VTCandidateEvidence & {score:number;reasons:string[]};

const TURN_ORDER:VTObservedTurn[]=['Previa','Primera','Matutina','Vespertina','Nocturna'];
function values(s:VTObservedMatchSheet){return TURN_ORDER.flatMap(t=>s.matchesByTurn[t]);}

export function buildTemporalRetrospective(sheets:VTObservedMatchSheet[]=OBSERVED_MATCH_SHEETS):VTRetrospectiveHit[]{
  const out:VTRetrospectiveHit[]=[];
  for(let i=1;i<sheets.length;i++){
    const current=sheets[i]; const pv=values(sheets[i-1]);
    const previous=new Set(pv); const previousReverse=new Set(pv.map(v=>[...v].reverse().join('')));
    const earlierToday:string[]=[];
    for(const turn of TURN_ORDER){
      for(const value of current.matchesByTurn[turn]){
        const earlier=new Set(earlierToday);
        const earlierReverse=new Set(earlierToday.map(v=>[...v].reverse().join('')));
        out.push({date:current.date,turn,value,exactPreviousDay:previous.has(value),reversePreviousDay:previousReverse.has(value),seenEarlierSameDay:earlier.has(value),reverseEarlierSameDay:earlierReverse.has(value)});
      }
      earlierToday.push(...current.matchesByTurn[turn]);
    }
  }
  return out;
}

export function summarizeTemporalRetrospective(hits=buildTemporalRetrospective()){
  return {totalObserved:hits.length,exactPreviousDay:hits.filter(x=>x.exactPreviousDay).length,reversePreviousDay:hits.filter(x=>x.reversePreviousDay).length,seenEarlierSameDay:hits.filter(x=>x.seenEarlierSameDay).length,reverseEarlierSameDay:hits.filter(x=>x.reverseEarlierSameDay).length};
}

export function scoreCandidate(e:VTCandidateEvidence):VTScoredCandidate{
  let score=0; const reasons:string[]=[];
  if(e.priorGeometryMatches>0){score+=Math.min(e.priorGeometryMatches,3)*3;reasons.push(`geometría histórica x${e.priorGeometryMatches}`);}
  if(e.sameCenterMatches>0){score+=Math.min(e.sameCenterMatches,3)*4;reasons.push(`misma coordenada/centro x${e.sameCenterMatches}`);}
  if(e.supportingColumns>0){score+=Math.min(e.supportingColumns,4)*5;reasons.push(`respaldo en ${e.supportingColumns} columna(s)`);}
  if(e.exactValueHistory>0){score+=Math.min(e.exactValueHistory,2);reasons.push('valor visto antes');}
  if(e.reverseValueHistory>0){score+=Math.min(e.reverseValueHistory,2);reasons.push('valor inverso visto antes');}
  return {...e,score,reasons};
}

// Firma canónica: un camino y el mismo camino recorrido al revés son la misma
// geometría. Conservamos coordenadas reales, no aproximaciones visuales.
export function canonicalSignature(sig:VTSpatialSignature):string{
  const encode=(nodes:VTNodeCoordinate[])=>nodes.map(n=>`${n.column}:${n.row}:${n.digitIndex}`).join('>');
  const f=encode(sig.nodes); const r=encode([...sig.nodes].reverse());
  return f<r?f:r;
}

export function sameAnchor(a:VTSpatialSignature,b:VTSpatialSignature):boolean{
  return a.anchor.column===b.anchor.column && a.anchor.row===b.anchor.row;
}
