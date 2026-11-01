import {collection,query,where,orderBy,limit,startAfter,getDocsFromServer,doc,runTransaction,serverTimestamp,onSnapshot,updateDoc,deleteDoc} from 'firebase/firestore';
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
export async function watchInbox(onRows,onError){const {db,user}=await requireCloudUser();return onSnapshot(query(collection(db,'userNotifications',user.uid,'items'),orderBy('createdAt','desc'),limit(30)),snapshot=>onRows(snapshot.docs.map(d=>({id:d.id,...d.data()}))),onError);}
export async function markInboxRead(id){const {db,user}=await requireCloudUser();return withTimeout(updateDoc(doc(db,'userNotifications',user.uid,'items',id),{read:true}));}
export async function storePushToken(deviceId,token){const {db,user}=await requireCloudUser();const ref=doc(db,'users',user.uid,'devices',deviceId);await withTimeout(runTransaction(db,async tx=>{await tx.get(ref);tx.set(ref,{token,platform:'android',updatedAt:serverTimestamp()});}));return user.uid;}
export async function removePushToken(deviceId){const {db,user}=await requireCloudUser();await withTimeout(deleteDoc(doc(db,'users',user.uid,'devices',deviceId)));}
