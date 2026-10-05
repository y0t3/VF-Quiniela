import {JURS,TURNOS,Tabla} from './engine';

export type CabezasDia=Record<string,Tabla>;
export const FUENTE='https://ww3.vivitusuerte.com/api/juegos/cabezasDiarias';

const empty=():Tabla=>Object.fromEntries(JURS.map(j=>[j,'----']));
const norm=(s:string)=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases:Record<string,string>={
 ciudad:'Ciudad',capital:'Ciudad',nacional:'Ciudad',
 provincia:'Provincia',buenosaires:'Provincia',
 cordoba:'Córdoba',santafe:'Santa Fé',entrerios:'Entre Ríos',montevideo:'Montevideo'
};
const num=(v:any)=>{if(v===null||v===undefined||v===''||v==='----')return '----';const m=String(v).match(/\d+/);return m?m[0].slice(-4).padStart(4,'0'):'----'};

function jurName(x:any):string|undefined{
 const vals=[x?.jurisdiccion,x?.provincia,x?.loteria,x?.nombre,x?.juego,x?.descripcion,x?.jurisdiccionNombre,x?.provinciaNombre];
 for(const v of vals){const k=norm(typeof v==='object'?(v?.nombre||v?.descripcion||''):v);if(aliases[k])return aliases[k];for(const [a,j] of Object.entries(aliases))if(k.includes(a))return j;}
}
function turnName(x:any):string|undefined{
 const vals=[x?.turno,x?.sorteo,x?.nombreTurno,x?.turnoNombre,x?.descripcionTurno];
 for(const v of vals){const k=norm(typeof v==='object'?(v?.nombre||v?.descripcion||''):v);if(k.includes('previa'))return 'Previa';if(k.includes('primera'))return 'Primera';if(k.includes('matut'))return 'Matutino';if(k.includes('vespert'))return 'Vespertino';if(k.includes('noct'))return 'Nocturno';}
}
function headValue(x:any){return num(x?.cabeza??x?.numero??x?.nro??x?.primerPremio??x?.primero??x?.resultado??x?.valor);}
function walk(x:any,out:CabezasDia){
 if(Array.isArray(x)){x.forEach(v=>walk(v,out));return;}
 if(!x||typeof x!=='object')return;
 const j=jurName(x),t=turnName(x),v=headValue(x);if(j&&t&&v!=='----')out[t][j]=v;
 // Soporta respuestas agrupadas por jurisdicción: {nombre:'Ciudad', previa:'1234', ...}
 if(j){for(const [k,val] of Object.entries(x)){const nk=norm(k);let tt:string|undefined;if(nk.includes('previa'))tt='Previa';else if(nk.includes('primera'))tt='Primera';else if(nk.includes('matut'))tt='Matutino';else if(nk.includes('vespert'))tt='Vespertino';else if(nk.includes('noct'))tt='Nocturno';if(tt){const n=num(typeof val==='object'?(val as any)?.numero??(val as any)?.cabeza??(val as any)?.resultado:val);if(n!=='----')out[tt][j]=n;}}}
 Object.values(x).forEach(v=>{if(v&&typeof v==='object')walk(v,out)});
}

export async function descargarCabezas(fecha?:string):Promise<CabezasDia>{
 const f=fecha||new Date().toISOString().slice(0,10);
 const url=`${FUENTE}?fecha=${encodeURIComponent(f)}`;
 const r=await fetch(url,{headers:{Accept:'application/json','Cache-Control':'no-cache'}});
 if(!r.ok)throw new Error(`Viví tu Suerte respondió ${r.status}`);
 const raw=await r.text();let data:any;try{data=JSON.parse(raw)}catch{throw new Error('La API de cabezas no devolvió JSON válido.');}
 const out:CabezasDia=Object.fromEntries(TURNOS.map(t=>[t,empty()]));walk(data,out);
 const count=TURNOS.reduce((n,t)=>n+JURS.filter(j=>out[t][j]!=='----').length,0);
 if(!count)throw new Error(`La API respondió, pero no pude reconocer cabezas para ${f}.`);
 return out;
}
export function tablaTurno(data:CabezasDia|undefined,t:string):Tabla{return data?.[t]||empty();}
