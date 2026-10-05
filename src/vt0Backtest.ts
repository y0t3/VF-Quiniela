import { VTObservedMatchSheet, VTObservedTurn } from './vt0ObservedMatches';
import { VTScoredCandidate } from './vt0Retrospective';

// Evaluador ciego para VT0.
// Los candidatos deben generarse ANTES de entregar el observedSheet a esta capa.
// Esta función sólo revela después qué candidatos coincidieron con la franja
// inferior histórica y cuántos falsos positivos produjo cada corte de score.

export type VTBacktestRow = {
  date: string;
  turn: VTObservedTurn;
  candidate: string;
  length: 2 | 3 | 4;
  score: number;
  hit: boolean;
  reasons: string[];
};

export type VTBacktestSummary = {
  threshold: number;
  candidates: number;
  hits: number;
  falsePositives: number;
  observedMatches: number;
  recoveredObserved: number;
  precision: number;
  recall: number;
};

export function evaluateBlindCandidates(
  candidates: VTScoredCandidate[],
  observedSheet: VTObservedMatchSheet,
): VTBacktestRow[] {
  return candidates.map(c => ({
    date: observedSheet.date,
    turn: c.turn,
    candidate: c.value,
    length: c.signature.length,
    score: c.score,
    hit: observedSheet.matchesByTurn[c.turn].includes(c.value),
    reasons: c.reasons,
  }));
}

export function summarizeAtThreshold(
  rows: VTBacktestRow[],
  observedSheet: VTObservedMatchSheet,
  threshold: number,
): VTBacktestSummary {
  const selected = rows.filter(r => r.score >= threshold);
  const hits = selected.filter(r => r.hit);
  const recovered = new Set(hits.map(r => `${r.turn}|${r.candidate}`));
  const observed = Object.entries(observedSheet.matchesByTurn)
    .flatMap(([turn, values]) => values.map(value => `${turn}|${value}`));
  const observedUnique = new Set(observed);

  return {
    threshold,
    candidates: selected.length,
    hits: hits.length,
    falsePositives: selected.length - hits.length,
    observedMatches: observedUnique.size,
    recoveredObserved: recovered.size,
    precision: selected.length ? hits.length / selected.length : 0,
    recall: observedUnique.size ? recovered.size / observedUnique.size : 0,
  };
}

export function thresholdSweep(
  rows: VTBacktestRow[],
  observedSheet: VTObservedMatchSheet,
  thresholds: number[] = [5, 8, 10, 12, 15, 18, 20, 25],
): VTBacktestSummary[] {
  return thresholds.map(t => summarizeAtThreshold(rows, observedSheet, t));
}

export function summarizeByLength(rows: VTBacktestRow[]) {
  return ([2, 3, 4] as const).map(length => {
    const group = rows.filter(r => r.length === length);
    const hits = group.filter(r => r.hit).length;
    return {
      length,
      candidates: group.length,
      hits,
      falsePositives: group.length - hits,
      precision: group.length ? hits / group.length : 0,
    };
  });
}

// Guard metodológico: no producir métricas hasta que existan candidatos
// espaciales pre-turno. Usar las coincidencias observadas como candidatos sería
// leakage y daría una falsa sensación de capacidad predictiva.
