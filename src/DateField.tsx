import React,{useMemo,useState} from 'react';
import {Modal,Pressable,StyleSheet,Text,TextInput,View} from 'react-native';

const MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS=['L','M','X','J','V','S','D'];
const maskDate=(v:string)=>{const n=v.replace(/\D/g,'').slice(0,8);return n.length<=2?n:n.length<=4?`${n.slice(0,2)}/${n.slice(2)}`:`${n.slice(0,2)}/${n.slice(2,4)}/${n.slice(4)}`};
const parse=(v:string)=>{const m=v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);if(!m)return null;const d=+m[1],mo=+m[2]-1,y=+m[3];const x=new Date(y,mo,d,12);return x.getFullYear()===y&&x.getMonth()===mo&&x.getDate()===d?x:null};
const fmt=(d:number,m:number,y:number)=>`${String(d).padStart(2,'0')}/${String(m+1).padStart(2,'0')}/${y}`;

export default function DateField({value,onChange}:{value:string,onChange:(v:string)=>void}){
 const initial=parse(value)||new Date();
 const [open,setOpen]=useState(false),[year,setYear]=useState(initial.getFullYear()),[month,setMonth]=useState(initial.getMonth());
 const selected=parse(value);
 const cells=useMemo(()=>{const first=new Date(year,month,1,12);const offset=(first.getDay()+6)%7;const total=new Date(year,month+1,0,12).getDate();return [...Array(offset).fill(null),...Array.from({length:total},(_,i)=>i+1)];},[year,month]);
 const move=(delta:number)=>{let m=month+delta,y=year;if(m<0){m=11;y--}if(m>11){m=0;y++}setMonth(m);setYear(y)};
 const show=()=>{const d=parse(value)||new Date();setYear(d.getFullYear());setMonth(d.getMonth());setOpen(true)};
 return <>
  <View style={s.fieldRow}><TextInput keyboardType="number-pad" maxLength={10} style={s.input} value={value} onChangeText={v=>onChange(maskDate(v))} placeholder="DD/MM/AAAA" placeholderTextColor="#777"/><Pressable accessibilityLabel="Abrir calendario" style={s.calendarBtn} onPress={show}><Text style={s.calendarIcon}>📅</Text></Pressable></View>
  <Text style={s.hint}>Formato: DD/MM/AAAA · o tocá el calendario</Text>
  <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
   <View style={s.backdrop}><View style={s.modal}>
    <View style={s.monthRow}><Pressable style={s.arrow} onPress={()=>move(-1)}><Text style={s.arrowTxt}>‹</Text></Pressable><Text style={s.month}>{MONTHS[month]} {year}</Text><Pressable style={s.arrow} onPress={()=>move(1)}><Text style={s.arrowTxt}>›</Text></Pressable></View>
    <View style={s.week}>{DAYS.map(d=><Text key={d} style={s.dayName}>{d}</Text>)}</View>
    <View style={s.grid}>{cells.map((d,i)=>{if(!d)return <View key={`e${i}`} style={s.cell}/>;const sunday=new Date(year,month,d,12).getDay()===0;const isSel=!!selected&&selected.getFullYear()===year&&selected.getMonth()===month&&selected.getDate()===d;return <Pressable key={d} style={[s.cell,isSel&&s.selected]} onPress={()=>{onChange(fmt(d,month,year));setOpen(false)}}><Text style={[s.day,isSel&&s.selectedTxt,sunday&&s.sunday]}>{d}</Text></Pressable>})}</View>
    <View style={s.actions}><Pressable onPress={()=>{const d=new Date();onChange(fmt(d.getDate(),d.getMonth(),d.getFullYear()));setOpen(false)}}><Text style={s.today}>HOY</Text></Pressable><Pressable onPress={()=>setOpen(false)}><Text style={s.close}>CERRAR</Text></Pressable></View>
   </View></View>
  </Modal>
 </>;
}

const s=StyleSheet.create({fieldRow:{flexDirection:'row',alignItems:'stretch',gap:8},input:{flex:1,backgroundColor:'#17131f',borderWidth:1,borderColor:'#382a4b',color:'#fff',borderRadius:10,padding:12,fontSize:18},calendarBtn:{width:58,borderRadius:10,backgroundColor:'#4c1d95',alignItems:'center',justifyContent:'center'},calendarIcon:{fontSize:25},hint:{color:'#888',fontSize:12,marginTop:5,marginLeft:3},backdrop:{flex:1,backgroundColor:'rgba(0,0,0,.72)',alignItems:'center',justifyContent:'center',padding:18},modal:{width:'100%',maxWidth:430,backgroundColor:'#17131f',borderRadius:18,padding:16,borderWidth:1,borderColor:'#493263'},monthRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},arrow:{width:48,height:48,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:'#2a1b38'},arrowTxt:{color:'#fff',fontSize:34,lineHeight:38},month:{color:'#fff',fontSize:21,fontWeight:'900'},week:{flexDirection:'row'},dayName:{width:'14.2857%',textAlign:'center',color:'#a78bfa',fontSize:15,fontWeight:'800',paddingVertical:8},grid:{flexDirection:'row',flexWrap:'wrap'},cell:{width:'14.2857%',aspectRatio:1,alignItems:'center',justifyContent:'center',borderRadius:30},day:{color:'#fff',fontSize:18,fontWeight:'700'},selected:{backgroundColor:'#7c3aed'},selectedTxt:{fontWeight:'900'},sunday:{color:'#8b7d91'},actions:{flexDirection:'row',justifyContent:'space-between',marginTop:14,paddingHorizontal:8},today:{color:'#c4b5fd',fontSize:16,fontWeight:'900',padding:10},close:{color:'#aaa',fontSize:16,fontWeight:'800',padding:10}});
