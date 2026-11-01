import {LEVELS} from './word-levels.js';
import {serverClock} from './live-access.js';
import {trophyCount} from './trophies.js';
import {doc,getDocFromServer,runTransaction,serverTimestamp,Timestamp} from 'firebase/firestore';
import {requireCloudUser} from './firebase.js';
import {withTimeout} from './cloud-status.js';
async function refFor(uid){const {db,user}=await requireCloudUser();if(user.uid!==uid){const e=Error('Oturum hesabı değişti.');e.code='unauthenticated';throw e;}return {db,user,ref:doc(db,'playerSaves',uid)};}
export async function loadAccount(uid){const {ref}=await refFor(uid);const snapshot=await withTimeout(getDocFromServer(ref));return snapshot.exists()?snapshot.data():null;}
async function commitOnce(uid,base,writeId,state){const {db,user,ref}=await refFor(uid);return withTimeout(runTransaction(db,async tx=>{const snapshot=await tx.get(ref),remote=snapshot.exists()?snapshot.data():null;if(remote?.writeId===writeId)return remote;if((remote?.revision||0)!==base){const e=Error('Kayıt başka cihazda değişti.');e.code='save-conflict';throw e;}const legacyDay=remote?.version<4?remote.state?.journey?.start:null;
 if(legacyDay&&Date.parse(legacyDay+'T00:00:00+03:00')<=serverClock.now()){const clockRef=doc(db,'journeyClocks',uid),clock=await tx.get(clockRef);if(!clock.exists())tx.set(clockRef,{day:legacyDay,startedAt:Timestamp.fromDate(new Date(legacyDay+'T00:00:00+03:00'))});}
 const newBonus=(state.trophies.festival||[]).filter(n=>!remote?.state?.trophies?.festival?.includes(n));
 const newPremium=(state.trophies.premium||[]).filter(n=>!remote?.state?.trophies?.premium?.includes(n));
 for(const level of newBonus.filter(n=>!newPremium.includes(n)))tx.set(doc(db,'festivalRewards',uid,'levels',String(level)),{uid,level,grantedAt:serverTimestamp()});
 for(const level of newPremium)tx.set(doc(db,'premiumRewards',uid,'levels',String(level)),{uid,level,gold:remote?.state.wallet.claimed.includes(level)?0:LEVELS[level-1].words.length*5+25,festival:state.trophies.premiumFestival?.includes(level)||false,grantedAt:serverTimestamp()});
 const data={version:5,...(newBonus.length||newPremium.length?{event:{type:'level',id:newBonus[0]||newPremium[0]}}:{}),revision:base+1,writeId,state,updatedAt:serverTimestamp()};tx.set(ref,data);tx.set(doc(db,'trophyPlayers',uid),{uid,name:(user.displayName||'Oyuncu').slice(0,100),trophies:trophyCount(state.trophies),prestige:state.trophies.prestige,avatar:state.avatar,updatedAt:serverTimestamp()});return data;}));}

export async function commitAccount(uid,base,writeId,state){
 try{return await commitOnce(uid,base,writeId,state);}catch(error){
  if(error.code!=='permission-denied'||(!state.trophies.festival?.length&&!state.trophies.premium?.length))throw error;
  // A holiday may end/be switched off between display and commit. Never leave
  // ordinary progress unsavable because an unconfirmed bonus was rejected.
  const {db,ref}=await refFor(uid),snapshot=await getDocFromServer(ref),remote=snapshot.data();
  if(remote?.writeId===writeId)return remote;
  if((remote?.revision||0)!==base)throw error;
  const revised=structuredClone(state);let removed=false;
  for(const [key,collection] of [['festival','festivalRewards'],['premium','premiumRewards']]){
   const unconfirmed=(state.trophies[key]||[]).filter(n=>!remote?.state.trophies[key]?.includes(n));
   const receipts=await Promise.all(unconfirmed.map(n=>getDocFromServer(doc(db,collection,uid,'levels',String(n)))));
   if(receipts.some(r=>r.exists()))throw error;
   if(unconfirmed.length){removed=true;revised.trophies[key]=(revised.trophies[key]||[]).filter(n=>!unconfirmed.includes(n));if(key==='premium')for(const n of unconfirmed)if(!remote?.state.wallet.claimed.includes(n))revised.wallet.gold=Math.max(0,revised.wallet.gold-(LEVELS[n-1].words.length*5+25));}
  }
  if(!removed)throw error;
  revised.trophies.premiumFestival=(revised.trophies.premiumFestival||[]).filter(n=>revised.trophies.premium?.includes(n)&&revised.trophies.festival?.includes(n));
  return commitOnce(uid,base,writeId,revised);
 }
}
