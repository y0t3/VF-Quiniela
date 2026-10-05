// VT0 — extractor geométrico experimental del método de trazados.
// NO predice ni asigna pesos: representa hoja, contactos y recorridos de 2/3/4 cifras.

export type VTLength = 2 | 3 | 4;
export type VTCell = { id:string; digit:number; row:number; col:number; source?:string; turn?:string; day?:string; plus11?:boolean };
export type VTStep = { dr:number; dc:number };
export type VTPath = { length:VTLength; digits:string; reverseDigits:string; cellIds:string[]; cells:VTCell[]; steps:VTStep[]; anchor:{row:number;col:number}; directPlus11:boolean };
export type VTEcho = { candidate:string; column:number; paths:VTPath[] };
export type VTGridOptions = { allowHorizontal?:boolean; allowVertical?:boolean; allowDiagonal?:boolean };
export type VTMarkedTrace = { id:string; expected:string; cellIds:string[]; note?:string };
export type VTTraceCheck = { id:string; expected:string; detected:boolean; exactOrder:boolean; reverseOrder:boolean; geometry?:string; reason?:string };

const DEFAULT_OPTIONS:Required<VTGridOptions>={allowHorizontal:true,allowVertical:true,allowDiagonal:true};

function touching(a:VTCell,b:VTCell,o:Required<VTGridOptions>):boolean{
 const dr=Math.abs(a.row-b.row),dc=Math.abs(a.col-b.col);
 if((dr===0&&dc===0)||dr>1||dc>1)return false;
 if(dr===0&&dc===1)return o.allowHorizontal;
 if(dr===1&&dc===0)return o.allowVertical;
 if(dr===1&&dc===1)return o.allowDiagonal;
 return false;
}
function pathKey(ids:string[]):string{const f=ids.join('>'),r=[...ids].reverse().join('>');return f<r?f:r}
function makePath(cells:VTCell[]):VTPath{
 const digits=cells.map(c=>c.digit).join(''),reverseDigits=[...cells].reverse().map(c=>c.digit).join('');
 const steps=cells.slice(1).map((c,i)=>({dr:c.row-cells[i].row,dc:c.col-cells[i].col}));
 const middle=cells[Math.floor((cells.length-1)/2)];
 return{length:cells.length as VTLength,digits,reverseDigits,cellIds:cells.map(c=>c.id),cells,steps,anchor:{row:middle.row,col:middle.col},directPlus11:cells.length===2&&cells.every(c=>c.plus11===true)&&!!cells[0].source&&cells[0].source===cells[1].source};
}
export function extractVTPaths(cells:VTCell[],length:VTLength,opts:VTGridOptions={}):VTPath[]{
 const o={...DEFAULT_OPTIONS,...opts},neighbours=new Map<string,VTCell[]>();
 for(const a of cells)neighbours.set(a.id,cells.filter(b=>touching(a,b,o)));
 const seen=new Set<string>(),out:VTPath[]=[];
 const walk=(path:VTCell[])=>{if(path.length===length){const k=pathKey(path.map(c=>c.id));if(!seen.has(k)){seen.add(k);out.push(makePath(path))}return}const last=path[path.length-1];for(const next of neighbours.get(last.id)??[]){if(path.some(c=>c.id===next.id))continue;walk([...path,next])}};
 for(const c of cells)walk([c]);return out;
}
export function extractVTAll(cells:VTCell[],opts:VTGridOptions={}){return{VT2:extractVTPaths(cells,2,opts),VT3:extractVTPaths(cells,3,opts),VT4:extractVTPaths(cells,4,opts)}}
export function findSpatialEchoes(candidate:string,paths:VTPath[],excludedColumns:number[]=[]):VTEcho[]{
 const byColumn=new Map<number,VTPath[]>();
 for(const p of paths){if(excludedColumns.includes(p.anchor.col))continue;if(p.digits!==candidate&&p.reverseDigits!==candidate)continue;const list=byColumn.get(p.anchor.col)??[];list.push(p);byColumn.set(p.anchor.col,list)}
 return[...byColumn.entries()].map(([column,matching])=>({candidate,column,paths:matching}));
}
export function geometrySignature(path:VTPath):string{
 const f=path.steps.map(s=>`${s.dr},${s.dc}`).join('|');
 const r=[...path.steps].reverse().map(s=>`${-s.dr},${-s.dc}`).join('|');return f<r?f:r;
}

// Compara trazados marcados manualmente con lo que VT0 detecta. Sirve para calibrar
// el significado de “roce” ANTES de usar resultados históricos o crear pronósticos.
export function validateMarkedTraces(cells:VTCell[],marks:VTMarkedTrace[],opts:VTGridOptions={}):VTTraceCheck[]{
 const cache=new Map<VTLength,VTPath[]>();
 return marks.map(mark=>{
  const length=mark.cellIds.length as VTLength;
  if(length<2||length>4)return{id:mark.id,expected:mark.expected,detected:false,exactOrder:false,reverseOrder:false,reason:'VT0 sólo admite 2, 3 o 4 cifras'};
  if(!cache.has(length))cache.set(length,extractVTPaths(cells,length,opts));
  const wanted=pathKey(mark.cellIds);
  const path=(cache.get(length)??[]).find(p=>pathKey(p.cellIds)===wanted);
  if(!path)return{id:mark.id,expected:mark.expected,detected:false,exactOrder:false,reverseOrder:false,reason:'Las casillas no forman un recorrido continuo con estas reglas de roce'};
  return{id:mark.id,expected:mark.expected,detected:true,exactOrder:path.digits===mark.expected,reverseOrder:path.reverseDigits===mark.expected,geometry:geometrySignature(path)};
 });
}

// Resume cuántos caminos genera cada configuración. Si una regla de contacto hace
// explotar los candidatos, podremos detectarlo antes del backtest.
export function geometryCalibration(cells:VTCell[]){
 const modes:{name:string;opts:VTGridOptions}[]=[
  {name:'vertical',opts:{allowHorizontal:false,allowVertical:true,allowDiagonal:false}},
  {name:'vertical+diagonal',opts:{allowHorizontal:false,allowVertical:true,allowDiagonal:true}},
  {name:'8-direcciones',opts:{allowHorizontal:true,allowVertical:true,allowDiagonal:true}},
 ];
 return modes.map(m=>{const x=extractVTAll(cells,m.opts);return{name:m.name,VT2:x.VT2.length,VT3:x.VT3.length,VT4:x.VT4.length,directPlus11:x.VT2.filter(p=>p.directPlus11).length}});
}
