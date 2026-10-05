// VT0 calibration harness — transcripción MANUAL de hojas reales.
// Este archivo NO alimenta pronósticos. Su objetivo es comparar lo que marca la hoja
// con las reglas geométricas de VT0 antes de conectar históricos.

import { VTCell, VTMarkedTrace, VTGridOptions, validateMarkedTraces, geometryCalibration } from './vt0';

export type VTCalibrationSheet = { id:string; label:string; cells:VTCell[]; positives:VTMarkedTrace[]; negatives:VTMarkedTrace[]; notes?:string[] };
export type VTCalibrationModeResult = { mode:string; positivesDetected:number; positivesTotal:number; negativesRejected:number; negativesTotal:number; falsePositives:string[]; missedPositives:string[] };

const MODES:{name:string;opts:VTGridOptions}[]=[
 {name:'vertical',opts:{allowHorizontal:false,allowVertical:true,allowDiagonal:false}},
 {name:'vertical+diagonal',opts:{allowHorizontal:false,allowVertical:true,allowDiagonal:true}},
 {name:'8-direcciones',opts:{allowHorizontal:true,allowVertical:true,allowDiagonal:true}},
];

export function calibrateSheet(sheet:VTCalibrationSheet):VTCalibrationModeResult[]{
 return MODES.map(({name,opts})=>{
  const positives=validateMarkedTraces(sheet.cells,sheet.positives,opts);
  const negatives=validateMarkedTraces(sheet.cells,sheet.negatives,opts);
  return {mode:name,positivesDetected:positives.filter(x=>x.detected&&(x.exactOrder||x.reverseOrder)).length,positivesTotal:positives.length,negativesRejected:negatives.filter(x=>!x.detected).length,negativesTotal:negatives.length,falsePositives:negatives.filter(x=>x.detected).map(x=>x.id),missedPositives:positives.filter(x=>!x.detected||(!x.exactOrder&&!x.reverseOrder)).map(x=>x.id)};
 });
}
export function inspectSheet(sheet:VTCalibrationSheet){return{sheet:sheet.id,label:sheet.label,pathExplosion:geometryCalibration(sheet.cells),calibration:calibrateSheet(sheet),notes:sheet.notes??[]}}

/* Reglas: una cifra por celda; no inventar cifras dudosas; positives son marcas confirmadas;
negatives son combinaciones cercanas que el método NO toma; conservar posición/turno;
inverso del mismo camino es válido. */

export const CONTROL_570:VTCalibrationSheet={
 id:'control-570',label:'VT3: continuidad 570 ↔ 075',
 cells:[
  {id:'c0',digit:5,row:0,col:0,source:'+11-A',plus11:true},
  {id:'c1',digit:7,row:1,col:0,source:'+11-A',plus11:true},
  {id:'c2',digit:0,row:2,col:0,source:'+11-A',plus11:true},
 ],
 positives:[{id:'570-directo',expected:'570',cellIds:['c0','c1','c2']},{id:'075-inverso',expected:'075',cellIds:['c2','c1','c0']}],
 negatives:[{id:'507-salteado',expected:'507',cellIds:['c0','c2','c1']},{id:'057-salteado',expected:'057',cellIds:['c2','c0','c1']}],
 notes:['El orden espacial manda; no alcanza con contener las mismas cifras.'],
};

// VT2: dos cifras sólo valen cuando realmente se tocan. El caso vertical representa
// además el caso frecuente de dos cifras que ya aparecen contiguas dentro del +11.
export const CONTROL_VT2:VTCalibrationSheet={
 id:'control-vt2',label:'VT2: roce directo sin salto',
 cells:[
  {id:'a',digit:3,row:0,col:0,source:'+11-A',plus11:true},
  {id:'b',digit:4,row:1,col:0,source:'+11-A',plus11:true},
  {id:'gap',digit:9,row:2,col:2,source:'+11-B',plus11:true},
 ],
 positives:[{id:'34-directo',expected:'34',cellIds:['a','b']},{id:'43-inverso',expected:'43',cellIds:['b','a']}],
 negatives:[{id:'39-sin-roce',expected:'39',cellIds:['a','gap']}],
 notes:['VT2 no necesita un recorrido rebuscado: contacto real y lectura directa/inversa.'],
};

// VT4 cerrado: A toca B, B toca C, C toca D y D vuelve a tocar A.
// Por eso 6543 y 5436 son lecturas válidas del mismo cuadrado, como indicó el usuario.
export const CONTROL_VT4_CLOSED:VTCalibrationSheet={
 id:'control-vt4-closed',label:'VT4: cuadrado cerrado y lecturas rotadas',
 cells:[
  {id:'A',digit:6,row:0,col:0,source:'+11-A',plus11:true},
  {id:'B',digit:5,row:0,col:1,source:'+11-B',plus11:true},
  {id:'C',digit:4,row:1,col:1,source:'+11-B',plus11:true},
  {id:'D',digit:3,row:1,col:0,source:'+11-A',plus11:true},
  {id:'far',digit:8,row:3,col:3,source:'+11-C',plus11:true},
 ],
 positives:[
  {id:'6543',expected:'6543',cellIds:['A','B','C','D']},
  {id:'5436',expected:'5436',cellIds:['B','C','D','A']},
  {id:'4365',expected:'4365',cellIds:['C','D','A','B']},
  {id:'3654',expected:'3654',cellIds:['D','A','B','C']},
 ],
 negatives:[
  {id:'6548-salto',expected:'6548',cellIds:['A','B','C','far']},
  {id:'6354-cruce',expected:'6354',cellIds:['A','D','B','C']},
 ],
 notes:['En un VT4 cerrado la lectura puede comenzar en cualquiera de las cuatro esquinas y recorrer ambos sentidos; no se permiten saltos/reordenamientos.'],
};

export const CONTROL_SHEETS:VTCalibrationSheet[]=[CONTROL_VT2,CONTROL_570,CONTROL_VT4_CLOSED];
export function inspectControls(){return CONTROL_SHEETS.map(inspectSheet)}
