import {doc,getDocFromServer,runTransaction,serverTimestamp} from 'firebase/firestore';
import {requireCloudUser} from './firebase.js';
import {withTimeout} from './cloud-status.js';
async function refFor(uid){const {db,user}=await requireCloudUser();if(user.uid!==uid){const e=Error('Google hesabı değişti.');e.code='unauthenticated';throw e;}return {db,ref:doc(db,'playerSaves',uid)};}
export async function loadAccount(uid){const {ref}=await refFor(uid);const snapshot=await withTimeout(getDocFromServer(ref));return snapshot.exists()?snapshot.data():null;}
export async function commitAccount(uid,base,writeId,state){const {db,ref}=await refFor(uid);return withTimeout(runTransaction(db,async tx=>{const snapshot=await tx.get(ref),remote=snapshot.exists()?snapshot.data():null;if(remote?.writeId===writeId)return remote;if((remote?.revision||0)!==base){const e=Error('Kayıt başka cihazda değişti.');e.code='save-conflict';throw e;}const data={version:1,revision:base+1,writeId,state,updatedAt:serverTimestamp()};tx.set(ref,data);return data;}));}
