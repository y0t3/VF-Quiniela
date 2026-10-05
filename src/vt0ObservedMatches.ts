// Evidencia histórica observada en las hojas manuscritas.
// Abajo NO están todos los resultados: sólo las coincidencias que, después de
// salir, fueron localizadas por roce en la matriz superior y resaltadas.

export type VTObservedTurn = 'Previa' | 'Primera' | 'Matutina' | 'Vespertina' | 'Nocturna';
export type VTObservedMatchSheet = {
  id: string;
  date: string;
  sequence: number;
  status: 'partial' | 'confirmed';
  matchesByTurn: Record<VTObservedTurn, string[]>;
  notes: string[];
};
export type VTObservedPath = {
  value: string;
  turn?: VTObservedTurn;
  reverseOf?: string;
  geometry: 'contact' | 'chain' | 'turning-chain' | 'connected-path';
  confirmedNoJump: boolean;
  notes?: string;
};

export const OBSERVED_MA29_122: VTObservedMatchSheet = {
  id:'real-2026-09-29', date:'2026-09-29', sequence:122, status:'confirmed',
  matchesByTurn:{
    Previa:[], Primera:['54','983'], Matutina:['389','86','468'],
    Vespertina:['26','62','31'], Nocturna:['894','907','796','7942','22'],
  },
  notes:[
    'Previa vacía = cero coincidencias observadas en ese turno.',
    'Corrección por ampliación: Matutina es 468, no 463.',
    '983/389 reutilizan el mismo eje en sentidos opuestos; 26/62 el mismo contacto.',
    '22 confirma repetición de cifra en celdas distintas; 7942 confirma VT4.',
  ],
};
export const PATHS_MA29_122: VTObservedPath[] = [
  {value:'54',turn:'Primera',geometry:'contact',confirmedNoJump:true},
  {value:'983',turn:'Primera',geometry:'chain',confirmedNoJump:true},
  {value:'389',turn:'Matutina',reverseOf:'983',geometry:'chain',confirmedNoJump:true},
  {value:'86',turn:'Matutina',geometry:'contact',confirmedNoJump:true},
  {value:'468',turn:'Matutina',geometry:'chain',confirmedNoJump:true},
  {value:'26',turn:'Vespertina',geometry:'contact',confirmedNoJump:true},
  {value:'62',turn:'Vespertina',reverseOf:'26',geometry:'contact',confirmedNoJump:true},
  {value:'31',turn:'Vespertina',geometry:'contact',confirmedNoJump:true},
  {value:'894',turn:'Nocturna',geometry:'chain',confirmedNoJump:true},
  {value:'907',turn:'Nocturna',geometry:'chain',confirmedNoJump:true},
  {value:'796',turn:'Nocturna',geometry:'chain',confirmedNoJump:true},
  {value:'7942',turn:'Nocturna',geometry:'turning-chain',confirmedNoJump:true},
  {value:'22',turn:'Nocturna',geometry:'contact',confirmedNoJump:true},
];

export const OBSERVED_MI30_123: VTObservedMatchSheet = {
  id:'real-2026-09-30', date:'2026-09-30', sequence:123, status:'confirmed',
  matchesByTurn:{
    Previa:['53'], Primera:['04','70','07'], Matutina:['371','859','778','718'],
    Vespertina:['67','51','93'], Nocturna:['67','90','786','67','83'],
  },
  notes:[
    'Lectura de los segmentos resaltados; se conservan duplicados por posición/turno.',
    'La marca aislada de una cifra en Matutina queda fuera de VT2/VT3/VT4.',
    '67 reaparece en más de una evidencia espacial; no se deduplica por valor.',
  ],
};

export const OBSERVED_JU01_124: VTObservedMatchSheet = {
  id:'real-2026-10-01', date:'2026-10-01', sequence:124, status:'confirmed',
  matchesByTurn:{
    Previa:['57','847'], Primera:['705','73','85'], Matutina:['43','105','94','483','548'],
    Vespertina:['99','89'], Nocturna:['584','39','65'],
  },
  notes:[
    'La transcripción toma sólo el segmento resaltado de cada resultado escrito debajo.',
    'Los trazos superiores pueden compartir celdas y cruzarse: cada coincidencia se conserva como recorrido independiente.',
  ],
};

export const OBSERVED_VI02_125: VTObservedMatchSheet = {
  id:'real-2026-10-02', date:'2026-10-02', sequence:125, status:'confirmed',
  matchesByTurn:{
    Previa:['379','303','39','035','70'], Primera:['63','97'], Matutina:['97','66','70','06'],
    Vespertina:['313','97','586'], Nocturna:['00','823','343','9979'],
  },
  notes:[
    'VI2/125 muestra mucha superposición de resaltados: eso se interpreta como reutilización de núcleos, no como conflicto.',
    '00 confirma nuevamente que un VT2 puede usar dos celdas contiguas con la misma cifra.',
    '9979 aporta otro VT4 observado.',
  ],
};

export const OBSERVED_SA03_126: VTObservedMatchSheet = {
  id:'real-2026-10-03', date:'2026-10-03', sequence:126, status:'confirmed',
  matchesByTurn:{
    Previa:['24','11','83','14'], Primera:['2542','5832'], Matutina:['234','429','10','29'],
    Vespertina:['22','77','00','867'], Nocturna:[],
  },
  notes:[
    'SA3/126 aporta dos VT4 en Primera (2542 y 5832).',
    '11, 22, 77 y 00 refuerzan que pares iguales son contactos válidos entre celdas distintas.',
    'Nocturna aparece sin coincidencias anotadas en la foto usada.',
  ],
};

export const OBSERVED_LU05_127: VTObservedMatchSheet = {
  id:'real-2026-10-05', date:'2026-10-05', sequence:127, status:'partial',
  matchesByTurn:{
    Previa:['71','03'], Primera:['18'], Matutina:['13','17','729','71'], Vespertina:[], Nocturna:[],
  },
  notes:[
    'Hoja LUN5 fotografiada durante la jornada: Vespertina/Nocturna todavía no deben tratarse como evidencia negativa.',
    '71 reaparece en Previa y Matutina y se conserva como dos evidencias de turno/posición.',
  ],
};

function pathsFromSheet(sheet: VTObservedMatchSheet): VTObservedPath[] {
  return (Object.entries(sheet.matchesByTurn) as [VTObservedTurn,string[]][]).flatMap(([turn,values]) =>
    values.map(value => ({
      value, turn,
      geometry: value.length === 2 ? 'contact' as const : 'connected-path' as const,
      confirmedNoJump: true,
      notes: 'El resaltado histórico confirma una cadena de roce continua; orientación/firma espacial fina se conserva para la etapa de geometría.',
    }))
  );
}

export const PATHS_MI30_123 = pathsFromSheet(OBSERVED_MI30_123);
export const PATHS_JU01_124 = pathsFromSheet(OBSERVED_JU01_124);
export const PATHS_VI02_125 = pathsFromSheet(OBSERVED_VI02_125);
export const PATHS_SA03_126 = pathsFromSheet(OBSERVED_SA03_126);
export const PATHS_LU05_127 = pathsFromSheet(OBSERVED_LU05_127);

export type VTObservedLengthSummary = {total:number; VT2:string[]; VT3:string[]; VT4:string[]};
export function summarizeObservedLengths(sheet:VTObservedMatchSheet):VTObservedLengthSummary {
  const all=Object.values(sheet.matchesByTurn).flat();
  return {total:all.length,VT2:all.filter(x=>x.length===2),VT3:all.filter(x=>x.length===3),VT4:all.filter(x=>x.length===4)};
}

export const OBSERVED_MATCH_SHEETS:VTObservedMatchSheet[] = [
  OBSERVED_MA29_122, OBSERVED_MI30_123, OBSERVED_JU01_124,
  OBSERVED_VI02_125, OBSERVED_SA03_126, OBSERVED_LU05_127,
];
