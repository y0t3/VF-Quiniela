import {JURS,TURNOS,Tabla} from './engine';

export type CabezasDia=Record<string,Tabla>;
export const FUENTE='https://ww3.vivitusuerte.com/cabezas';

const empty=():Tabla=>Object.fromEntries(JURS.map(j=>[j,'----']));
const decode=(s:string)=>s
 .replace(/&nbsp;/gi,' ').replace(/&aacute;/gi,'á').replace(/&eacute;/gi,'é')
 .replace(/&iacute;/gi,'í').replace(/&oacute;/gi,'ó').replace(/&uacute;/gi,'ú')
 .replace(/&#225;/g,'á').replace(/&#233;/g,'é').replace(/&#237;/g,'í')
 .replace(/&#243;/g,'ó').replace(/&#250;/g,'ú').replace(/&oacute;/gi,'ó');
const strip=(s:string)=>decode(s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

export async function descargarCabezas():Promise<CabezasDia>{
 const r=await fetch(FUENTE,{headers:{Accept:'text/html','Cache-Control':'no-cache'}});
 if(!r.ok) throw new Error(`Viví tu Suerte respondió ${r.status}`);
 const html=await r.text();
 const text=strip(html), low=norm(text);
 const out:CabezasDia=Object.fromEntries(TURNOS.map(t=>[t,empty()]));
 const markers=['Ciudad','Provincia','Córdoba','Santa Fé','Entre Ríos','Montevideo','Mendoza'];
 for(let i=0;i<6;i++){
   const j=markers[i];
   const start=low.indexOf(norm(j));
   if(start<0) continue;
   let end=text.length;
   for(let k=i+1;k<markers.length;k++){
     const p=low.indexOf(norm(markers[k]),start+norm(j).length);
     if(p>=0){end=p;break;}
   }
   const chunk=text.slice(start,end);
   // La página publica: jurisdicción + "Ver pizarra" + exactamente cinco cabezas.
   const nums=(chunk.match(/----|\d{4}/g)||[]).slice(0,5);
   TURNOS.forEach((t,k)=>{out[t][j]=nums[k]||'----'});
 }
 const count=TURNOS.reduce((n,t)=>n+JURS.filter(j=>out[t][j]!=='----').length,0);
 if(!count) throw new Error('No pude interpretar las cabezas publicadas. La página puede haber cambiado.');
 return out;
}

export function tablaTurno(data:CabezasDia|undefined,t:string):Tabla{return data?.[t]||empty();}
