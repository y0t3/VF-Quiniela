// Tablero determinístico del método manuscrito VT0.
// La geometría NO se estima desde la foto: fila = jurisdicción; cada fuente/turno
// agrega DOS columnas, porque +11 se aplica a las últimas 2 cifras.
// PREVIA usa la última NOCTURNA efectivamente sorteada anterior a la fecha:
// como los domingos NO hay sorteo, el lunes toma la nocturna del sábado.

export const VT_JURISDICTIONS = [
  'Ciudad', 'Provincia', 'Córdoba', 'Santa Fe', 'Entre Ríos', 'Montevideo',
] as const;
export type VTJurisdiction = typeof VT_JURISDICTIONS[number];

export const VT_COLUMNS = ['Previa','Primera','Matutina','Vespertina','Nocturna'] as const;
export type VTColumn = typeof VT_COLUMNS[number];

export type VTHeads = Record<VTJurisdiction, string>;
export type VTDayHeads = Partial<Record<VTColumn, VTHeads>>;
export type VTDatedNocturna = { date:string; heads:VTHeads };

export type VTCell = {
  row:number;
  sourceIndex:number;
  digitColumn:number;
  digitIndex:0|1;
  jurisdiction:VTJurisdiction;
  targetTurn:VTColumn;
  sourceTurn:VTColumn|'NocturnaAnterior';
  sourceHead:string;
  plus11:string;
  digit:string;
};
export type VTBoard = VTCell[][];

// Regla histórica comprobada en motor_v7.py:
// tomar las últimas 2 cifras y sumar 11 módulo 100.
// Ej.: 48 -> 59; 90 -> 01; 99 -> 10.
export function plus11(head:string):string {
  const clean=String(head).trim();
  if(!/^\d{1,4}$/.test(clean)) throw new Error(`Cabeza inválida: ${head}`);
  const last2=Number(clean.padStart(4,'0').slice(-2));
  return String((last2+11)%100).padStart(2,'0');
}

function dayOfWeek(date:string):number { return new Date(`${date}T12:00:00Z`).getUTCDay(); }
export function isSunday(date:string):boolean { return dayOfWeek(date)===0; }

export function previousCalendarDate(date:string):string {
  const d=new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate()-1);
  return d.toISOString().slice(0,10);
}

export function expectedPreviousDrawDate(targetDate:string):string {
  let d=previousCalendarDate(targetDate);
  while(isSunday(d)) d=previousCalendarDate(d);
  return d;
}

export function resolvePreviousNocturna(targetDate:string, history:VTDatedNocturna[]):VTDatedNocturna {
  const eligible=history.filter(x=>x.date<targetDate && !isSunday(x.date)).sort((a,b)=>b.date.localeCompare(a.date));
  if(!eligible.length) throw new Error(`No hay nocturna anterior disponible para ${targetDate}`);
  return eligible[0];
}

function sourcesForTarget(
  target:VTColumn,
  previousNocturna:VTHeads,
  today:VTDayHeads,
): {sourceTurn:VTCell['sourceTurn']; heads:VTHeads}[] {
  const out:{sourceTurn:VTCell['sourceTurn'];heads:VTHeads}[]=[
    {sourceTurn:'NocturnaAnterior',heads:previousNocturna},
  ];
  for(const t of VT_COLUMNS){
    if(t===target) break;
    const heads=today[t];
    if(!heads) throw new Error(`Faltan cabezas de ${t} para construir ${target}`);
    out.push({sourceTurn:t,heads});
  }
  return out;
}

// Construye el tablero ACUMULADO disponible antes del turno objetivo.
// Previa: 1 fuente = 2 columnas.
// Primera: Nocturna anterior + Previa = 4 columnas.
// Matutina: + Primera = 6 columnas, etc.
export function buildVTBoardForTurn(previousNocturna:VTHeads,today:VTDayHeads,target:VTColumn):VTBoard {
  const sources=sourcesForTarget(target,previousNocturna,today);
  return VT_JURISDICTIONS.map((jurisdiction,row)=>{
    const cells:VTCell[]=[];
    sources.forEach(({sourceTurn,heads},sourceIndex)=>{
      const sourceHead=heads[jurisdiction];
      const transformed=plus11(sourceHead);
      ([0,1] as const).forEach(digitIndex=>{
        cells.push({
          row,sourceIndex,digitColumn:sourceIndex*2+digitIndex,digitIndex,
          jurisdiction,targetTurn:target,sourceTurn,sourceHead,plus11:transformed,
          digit:transformed[digitIndex],
        });
      });
    });
    return cells;
  });
}

export function buildVTBoardForDate(
  targetDate:string,
  targetTurn:VTColumn,
  nocturnaHistory:VTDatedNocturna[],
  today:VTDayHeads,
):VTBoard {
  if(isSunday(targetDate)) throw new Error(`No hay sorteo los domingos: ${targetDate}`);
  const previous=resolvePreviousNocturna(targetDate,nocturnaHistory);
  return buildVTBoardForTurn(previous.heads,today,targetTurn);
}

export function cellKey(cell:Pick<VTCell,'row'|'digitColumn'>):string{return `${cell.row}:${cell.digitColumn}`;}
