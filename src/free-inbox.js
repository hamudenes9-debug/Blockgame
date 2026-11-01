import {dayKey,previousDay} from '../shared/practice.js';
export function inboxDays(date=new Date()){const days=[dayKey(date)];while(days.length<7)days.push(previousDay(days.at(-1)));return days;}
export const readKey=uid=>'seyyah-like-read-'+uid;
export function readIds(storage,uid){try{const value=JSON.parse(storage.getItem(readKey(uid))||'[]');return new Set(Array.isArray(value)?value.filter(v=>typeof v==='string').slice(-500):[]);}catch{return new Set();}}
export function saveRead(storage,uid,id){const ids=readIds(storage,uid);ids.delete(id);ids.add(id);storage.setItem(readKey(uid),JSON.stringify([...ids].slice(-500)));}
export function buildInbox(records,names,read){return records.map(r=>{const name=names.get(r.fromUid)||'Bir seyyah';return {...r,body:`${name} seni beğendi.`,read:read.has(r.id)};}).sort((a,b)=>b.time-a.time||a.id.localeCompare(b.id));}
