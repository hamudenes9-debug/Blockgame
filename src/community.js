import {inboxDays,readIds,saveRead,buildInbox} from './free-inbox.js';
import {collection,query,where,orderBy,limit,startAfter,getDocsFromServer,doc,runTransaction,serverTimestamp,onSnapshot,deleteDoc} from 'firebase/firestore';
import {requireCloudUser} from './firebase.js';
import {withTimeout} from './cloud-status.js';
import {dayWindow,aggregateToday} from '../shared/practice.js';
function likesRef(db,day,uid){return collection(db,'communityLikes',day,'players',uid,'likes');}
export async function loadCommunity(){return withTimeout((async()=>{
 const {db,user}=await requireCloudUser(),window=dayWindow(),records=[];let cursor=null;
 const deadline=Date.now()+11000;
 do{if(Date.now()>deadline){const e=Error('Topluluk yükleme süresi doldu.');e.code='client-timeout';throw e;}const parts=[where('date','>=',window.start),where('date','<',window.end),orderBy('date','desc'),limit(500)];if(cursor)parts.push(startAfter(cursor));const snapshot=await getDocsFromServer(query(collection(db,'wordScores'),...parts));records.push(...snapshot.docs.map(d=>({id:d.id,data:d.data()})));cursor=snapshot.size===500?snapshot.docs.at(-1):null;}while(cursor);
 const people=aggregateToday(records,window).slice(0,20);
 return await Promise.all(people.map(async p=>{try{const likes=await getDocsFromServer(likesRef(db,p.day,p.uid));return {...p,likes:likes.size,liked:likes.docs.some(d=>d.id===user.uid),own:p.uid===user.uid};}catch(e){return {...p,likes:null,liked:false,own:p.uid===user.uid,likesError:e.code||'unavailable'};}}));
 })());}
export async function likeActivity(activity){return withTimeout((async()=>{
 const {db,user}=await requireCloudUser();if(user.uid===activity.uid)throw Error('Kendi paylaşımını beğenemezsin.');if(activity.day!==dayWindow().day)throw Error('Gün değişti. Topluluğu yenileyip tekrar dene.');
 const ref=doc(likesRef(db,activity.day,activity.uid),user.uid);
 return runTransaction(db,async tx=>{const existing=await tx.get(ref);if(existing.exists())return false;tx.set(ref,{fromUid:user.uid,toUid:activity.uid,day:activity.day,scoreId:activity.scoreId,createdAt:serverTimestamp()});return true;});
 })());}
// Spark-compatible inbox: read the existing likes, never create recipient messages.
// Seven bounded per-day queries need no collection-group index or new rules.
export async function watchInbox(onRows,onError,onNew=()=>{}){
 const {db,user}=await requireCloudUser();let stopped=false,failed=false,stops=[],days=[],timer,epoch=0;
 const records=new Map(),names=new Map(),pendingNames=new Map();
 const emit=()=>{if(!stopped&&!failed)onRows(buildInbox([...records.values()].flat(),names,readIds(localStorage,user.uid)));};
 async function resolveName(uid){if(names.has(uid))return;if(!pendingNames.has(uid))pendingNames.set(uid,(async()=>{try{const result=await withTimeout(getDocsFromServer(query(collection(db,'wordScores'),where('uid','==',uid),limit(1))));const value=result.docs[0]?.data().name;if(typeof value==='string'&&value.trim())names.set(uid,value.slice(0,100));}catch{}finally{if(!names.has(uid))names.set(uid,'Bir seyyah');}})());await pendingNames.get(uid);}
 function fail(error){if(stopped||failed)return;failed=true;stops.forEach(stop=>stop());onError(error);}
 function subscribe(){const generation=++epoch;stops.forEach(stop=>stop());stops=[];records.clear();days=inboxDays();
  for(const day of days){let initial=true,revision=0;
   stops.push(onSnapshot(query(likesRef(db,day,user.uid),orderBy('createdAt','desc'),limit(30)),{includeMetadataChanges:true},snapshot=>{
    if(stopped||generation!==epoch)return;const version=++revision;const fresh=!snapshot.metadata.fromCache&&!initial?snapshot.docChanges().filter(c=>c.type==='added').map(c=>day+'_'+c.doc.id):[];
    if(!snapshot.metadata.fromCache)initial=false;
    const rows=snapshot.docs.filter(d=>d.data().toUid===user.uid&&d.data().fromUid===d.id).map(d=>({id:day+'_'+d.id,day,fromUid:d.id,time:d.data().createdAt?.toMillis?.()||0}));
    records.set(day,rows);emit();
    Promise.all(rows.map(r=>resolveName(r.fromUid))).then(()=>{if(stopped||failed||generation!==epoch||version!==revision||!days.includes(day))return;emit();for(const row of buildInbox(rows,names,readIds(localStorage,user.uid)))if(fresh.includes(row.id))onNew(row);}).catch(fail);
   },fail));
  }
 }
 const onRead=event=>{if(event.detail===user.uid)emit();};window.addEventListener('seyyah-inbox-read',onRead);
 subscribe();timer=setInterval(()=>{if(!stopped&&!failed&&inboxDays()[0]!==days[0])subscribe();},60000);
 return ()=>{stopped=true;clearInterval(timer);stops.forEach(stop=>stop());window.removeEventListener('seyyah-inbox-read',onRead);};
}
export async function markInboxRead(id){const {user}=await requireCloudUser();saveRead(localStorage,user.uid,id);window.dispatchEvent(new CustomEvent('seyyah-inbox-read',{detail:user.uid}));}
export async function removePushToken(deviceId){const {db,user}=await requireCloudUser();await withTimeout(deleteDoc(doc(db,'users',user.uid,'devices',deviceId)));}
