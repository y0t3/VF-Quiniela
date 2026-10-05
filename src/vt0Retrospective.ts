import { OBSERVED_MATCH_SHEETS, VTObservedMatchSheet, VTObservedTurn } from './vt0ObservedMatches';

// Retrospectiva temporal VT0.
// Esta capa es deliberadamente leakage-safe: para puntuar un turno sólo usa
// jornadas anteriores y turnos YA ocurridos de la jornada actual.
// El resultado del turno objetivo nunca participa en la generación del score.

export type VTRetrospectiveHit = {
  date: string;
  turn: VTObservedTurn;
  value: string;
  exactPreviousDay: boolean;
  reversePreviousDay: boolean;
  seenEarlierSameDay: boolean;
  reverseEarlierSameDay: boolean;
};

export type VTSpatialSignature = {
  length: 2 | 3 | 4;
  // Pasos normalizados entre celdas consecutivas. Ej.: N,N o E,S,W.
  // La firma canónica considera equivalentes camino y camino invertido.
  steps: string[];
  // Centro/posición normalizada dentro de la columna manuscrita.
  centerBand: 'top' | 'middle' | 'bottom';
  // Columna/jurisdicción relativa cuando pueda reconstruirse de la hoja.
  columnIndex?: number;
};

export type VTCandidateEvidence = {
  value: string;
  turn: VTObservedTurn;
  signature: VTSpatialSignature;
  priorGeometryMatches: number;
  sameCenterMatches: number;
  supportingColumns: number;
  exactValueHistory: number;
  reverseValueHistory: number;
};

export type VTScoredCandidate = VTCandidateEvidence & {
  score: number;
  reasons: string[];
};

const TURN_ORDER: VTObservedTurn[] = ['Previa','Primera','Matutina','Vespertina','Nocturna'];

function values(sheet: VTObservedMatchSheet): string[] {
  return TURN_ORDER.flatMap(t => sheet.matchesByTurn[t]);
}

export function buildTemporalRetrospective(
  sheets: VTObservedMatchSheet[] = OBSERVED_MATCH_SHEETS,
): VTRetrospectiveHit[] {
  const out: VTRetrospectiveHit[] = [];
  for (let i = 1; i < sheets.length; i++) {
    const current = sheets[i];
    const previousValues = values(sheets[i - 1]);
    const previous = new Set(previousValues);
    const previousReverse = new Set(previousValues.map(v => [...v].reverse().join('')));
    const earlierToday: string[] = [];

    for (const turn of TURN_ORDER) {
      for (const value of current.matchesByTurn[turn]) {
        const earlier = new Set(earlierToday);
        const earlierReverse = new Set(earlierToday.map(v => [...v].reverse().join('')));
        out.push({
          date: current.date,
          turn,
          value,
          exactPreviousDay: previous.has(value),
          reversePreviousDay: previousReverse.has(value),
          seenEarlierSameDay: earlier.has(value),
          reverseEarlierSameDay: earlierReverse.has(value),
        });
      }
      earlierToday.push(...current.matchesByTurn[turn]);
    }
  }
  return out;
}

export function summarizeTemporalRetrospective(hits = buildTemporalRetrospective()) {
  return {
    totalObserved: hits.length,
    exactPreviousDay: hits.filter(x => x.exactPreviousDay).length,
    reversePreviousDay: hits.filter(x => x.reversePreviousDay).length,
    seenEarlierSameDay: hits.filter(x => x.seenEarlierSameDay).length,
    reverseEarlierSameDay: hits.filter(x => x.reverseEarlierSameDay).length,
  };
}

// Score inicial para la capa espacial. La repetición literal tiene poco peso:
// la hipótesis central es forma + centro + respaldo, no frecuencia del número.
export function scoreCandidate(e: VTCandidateEvidence): VTScoredCandidate {
  let score = 0;
  const reasons: string[] = [];

  if (e.priorGeometryMatches > 0) {
    score += Math.min(e.priorGeometryMatches, 3) * 3;
    reasons.push(`geometría histórica x${e.priorGeometryMatches}`);
  }
  if (e.sameCenterMatches > 0) {
    score += Math.min(e.sameCenterMatches, 3) * 4;
    reasons.push(`mismo centro/zona x${e.sameCenterMatches}`);
  }
  if (e.supportingColumns > 0) {
    score += Math.min(e.supportingColumns, 4) * 5;
    reasons.push(`respaldo en ${e.supportingColumns} columna(s)`);
  }
  if (e.exactValueHistory > 0) {
    score += Math.min(e.exactValueHistory, 2);
    reasons.push('valor visto antes');
  }
  if (e.reverseValueHistory > 0) {
    score += Math.min(e.reverseValueHistory, 2);
    reasons.push('valor inverso visto antes');
  }

  return {...e, score, reasons};
}

export function canonicalSignature(sig: VTSpatialSignature): string {
  const forward = `${sig.length}|${sig.centerBand}|${sig.steps.join(',')}`;
  const reverseSteps = [...sig.steps].reverse().map(invertStep);
  const reverse = `${sig.length}|${sig.centerBand}|${reverseSteps.join(',')}`;
  return forward < reverse ? forward : reverse;
}

function invertStep(step: string): string {
  const opposite: Record<string,string> = {
    N:'S', S:'N', E:'W', W:'E', NE:'SW', SW:'NE', NW:'SE', SE:'NW',
  };
  return opposite[step] ?? step;
}

// Siguiente capa: poblar VTSpatialSignature desde las coordenadas reales de
// cada hoja. Sólo después se evalúa si los candidatos generados ANTES del turno
// aparecen entre las coincidencias inferiores. Así evitamos reconstrucción a
// posteriori y podemos medir hits, misses y falsos positivos.
