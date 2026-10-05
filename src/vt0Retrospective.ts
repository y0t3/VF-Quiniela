import { OBSERVED_MATCH_SHEETS, VTObservedMatchSheet, VTObservedTurn } from './vt0ObservedMatches';

// Primera simulación retrospectiva temporal de VT0.
// IMPORTANTE: esta capa NO pretende sustituir la geometría manuscrita.
// Sólo mide señales que pueden calcularse sin mirar el resultado futuro:
// persistencia exacta/invertida del día anterior y respaldo dentro del día.
// La firma espacial (centro + forma) se incorporará como evidencia separada.

export type VTRetrospectiveHit = {
  date: string;
  turn: VTObservedTurn;
  value: string;
  exactPreviousDay: boolean;
  reversePreviousDay: boolean;
  seenEarlierSameDay: boolean;
  reverseEarlierSameDay: boolean;
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
    const previous = new Set(values(sheets[i - 1]));
    const previousReverse = new Set(values(sheets[i - 1]).map(v => [...v].reverse().join('')));
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

// Regla metodológica para la siguiente capa:
// un candidato espacial sólo podrá recibir respaldo geométrico cuando su camino
// continuo (sin saltos) reproduzca una firma previa en la misma zona/centro o
// una zona equivalente y, además, tenga apoyo de otra columna del día.
// Nunca se inferirá la geometría a partir del valor que terminó saliendo.
