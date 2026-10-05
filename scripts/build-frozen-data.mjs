import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
function parseCSV(text){
  const rows=[]; let row=[],field='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i]; if(q){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"')q=false;else field+=c;}else{if(c==='"')q=true;else if(c===','){row.push(field);field='';}else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field='';}else field+=c;}}
  if(field.length||row.length){row.push(field.replace(/\r$/,''));rows.push(row)}
  const head=rows.shift(); return rows.filter(r=>r.length>=head.length).map(r=>Object.fromEntries(head.map((h,i)=>[h,r[i]])));
}
const V11=['v7_gap12','v7_gap15','v7_sd','v8_gap12','v8_gap15','v8_sd','v9_gap12','v9_gap15','v9_sd','v8_paths1','v8_c0','v8_sources','v8_horizontal','v9_paths1','v9_birth','v9_persist','v9_gains','v9_last_gain','v9_sources','v9_source_gain','v9_c0','v9_stale'];
const V13=['r7','r8','r9','p7','p8','p9','sources','best_rank','rank_sum','rr_sum','s7_z','s8_z','s9_z'];
const V14=['margin','max_conf','conf_spread','conf_V7','conf_V8','conf_V9','challenger_is_v8','challenger_is_v9',...V11];
function compact(file,features,targets){const rows=parseCSV(fs.readFileSync(path.join(root,file),'utf8')); return rows.map(r=>[...features.map(f=>Number(r[f])),...targets.map(t=>Number(r[t]))]);}
const model=JSON.parse(fs.readFileSync(path.join(root,'modelo_v7.json'),'utf8'));
const out=`// AUTO-GENERATED during build. Do not edit.\nexport const MODEL_V7=${JSON.stringify(model)} as const;\nexport const TRAIN_V11=${JSON.stringify(compact('vf_v11_training_2025.csv',V11,['V7_T5','V8_T5','V9_T5']))} as number[][];\nexport const TRAIN_V13=${JSON.stringify(compact('vf_v13_training_2024_q2_q3.csv',V13,['y']))} as number[][];\nexport const TRAIN_V14=${JSON.stringify(compact('vf_v14_training_2025_eneago2026.csv',V14,['A_V7','A_V11','A_V13']))} as number[][];\n`;
fs.mkdirSync(path.join(root,'src'),{recursive:true}); fs.writeFileSync(path.join(root,'src','frozenData.ts'),out); console.log('Frozen VF data generated:',Math.round(out.length/1024),'KB');