import {JURS,TURNOS,Tabla} from './engine';

export type CabezasDia=Record<string,Tabla>;
export const FUENTE='https://ww3.vivitusuerte.com/cabezas';

const aliases:Record<string,string>={
 'Ciudad':'Ciudad','Provincia':'Provincia','Córdoba':'Córdoba','Santa Fé':'Santa Fé','Entre Ríos':'Entre Ríos','Montevideo':'Montevideo'
};
const clean=(s:string)=>s.replace(/&nbsp;/g,' ').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const empty=():Tabla=>Object.fromEntries(JURS.map(j=>[j,'----']));

export async function descargarCabezas():Promise<CabezasDia>{
 const r=await fetch(FUENTE,{headers:{'Accept':'text/html','Cache-Control':'no-cache'}});
 if(!r.ok) throw new Error(`Viví tu Suerte respondió ${r.status}`);
 const html=await r.text();
 const text=clean(html);
 const out:CabezasDia=Object.fromEntries(TURNOS.map(t=>[t,empty()]));
 const names=[...JURS];
 for(let i=0;i<names.length;i++){
   const j=names[i], start=text.indexOf(j);
   if(start<0) continue;
   let end=text.length;
   for(const other of names){const p=text.indexOf(other,start+j.length);if(p>=0&&p<end)end=p;}
   const chunk=text.slice(start,end);
   const nums=(chunk.match(/(?:----|\b\d{4}\b)/g)||[]).slice(0,5);
   TURNOS.forEach((t,k)=>{if(nums[k])out[t][aliases[j]]=nums[k]});
 }
 const found=TURNOS.some(t=>JURS.some(j=>out[t][j]!=='----'));
 if(!found) throw new Error('No pude interpretar las cabezas publicadas. La página puede haber cambiado.');
 return out;
}

export function tablaTurno(data:CabezasDia|undefined,t:string):Tabla{
 return data?.[t]||empty();
}
