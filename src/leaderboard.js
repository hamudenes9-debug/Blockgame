// Identity is the Firebase UID, never a display name. Old local-only records
// had no UID; keep those in explicitly labelled legacy groups instead.
function addRecord(totals,record,allowLegacy=false){
 if(record.mode!=='word'||!Number.isSafeInteger(record.score)||record.score<0)return;
 const uid=typeof record.uid==='string'&&record.uid?record.uid:null;
 if(!uid&&!allowLegacy)return;
 const name=typeof record.name==='string'&&record.name?record.name:'Oyuncu';
 const key=uid?'uid:'+uid:'legacy:'+name;
 const date=Number.isFinite(record.date)?record.date:0;
 let row=totals.get(key);
 if(!row){row={uid,name,score:0,games:0,date,legacy:!uid};totals.set(key,row);}
 if(!Number.isSafeInteger(row.score+record.score))throw Error('Toplam puan desteklenen aralığı aştı.');
 row.score+=record.score;row.games++;
 if(date>row.date||(date===row.date&&name.localeCompare(row.name,'tr')<0)){row.name=name;row.date=date;}
}
function ranked(totals){return [...totals.values()].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'tr')||String(a.uid||'').localeCompare(String(b.uid||'')));}
export function aggregateScores(records,{allowLegacy=false}={}){const totals=new Map();for(const record of records)addRecord(totals,record,allowLegacy);return ranked(totals);}
export async function collectScoreTotals(fetchPage,isActive=()=>true){
 const totals=new Map();let cursor=null;const seen=new Set();
 while(true){
  if(!isActive())throw Error('Sıralama isteği sona erdi.');
  const page=await fetchPage(cursor);
  if(!isActive())throw Error('Sıralama isteği sona erdi.');
  for(const doc of page.records){if(seen.has(doc.id))continue;seen.add(doc.id);addRecord(totals,doc.data);}
  if(!page.nextCursor)return ranked(totals);
  if(page.nextCursor===cursor)throw Error('Sıralama sayfası ilerlemedi.');
  cursor=page.nextCursor;
 }
}
