import {initializeApp} from 'firebase-admin/app';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import {getMessaging} from 'firebase-admin/messaging';
import {onDocumentCreated} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
import {createHash} from 'node:crypto';
import {validLike} from './like-validation.js';
initializeApp();
export const notifyCommunityLike=onDocumentCreated({document:'communityLikes/{day}/players/{targetUid}/likes/{fromUid}',region:'europe-west1',retry:true,maxInstances:5},async event=>{
 const snapshot=event.data;if(!snapshot)return;
 const like=snapshot.data(),{day,targetUid,fromUid}=event.params;
 if(typeof like.scoreId!=='string'||!/^[A-Za-z0-9_-]{1,150}$/.test(like.scoreId))return;
 const db=getFirestore(),score=(await db.doc(`wordScores/${like.scoreId}`).get()).data();
 if(!validLike({day,targetUid,fromUid},like,score,like.createdAt?.toMillis?.()))return;
 let name='Bir seyyah';try{const sender=await getAuth().getUser(fromUid);if(sender.disabled)return;name=(sender.displayName||name).slice(0,100);}catch(error){if(error.code==='auth/user-not-found')return;throw error;}
 const id=createHash('sha256').update(snapshot.ref.path).digest('hex');
 const body=`${name} bugünkü alıştırmalarını beğendi.`;
 const inbox=db.doc(`userNotifications/${targetUid}/items/${id}`);
 // Deterministic create prevents trigger retries from making duplicate inbox
 // entries or spamming repeated pushes. Inbox is reliable; FCM is best effort.
 try{await inbox.create({type:'like',fromUid,fromName:name,day,body,read:false,createdAt:FieldValue.serverTimestamp()});}catch(error){if(error.code===6||error.code==='already-exists')return;throw error;}
 const devices=await db.collection(`users/${targetUid}/devices`).get();
 const unique=new Map();for(const d of devices.docs){const t=d.data().token;if(typeof t==='string'&&t.length>0){const refs=unique.get(t)||[];refs.push(d.ref);unique.set(t,refs);}}
 const tokens=[...unique.keys()];
 for(let i=0;i<tokens.length;i+=500){const batch=tokens.slice(i,i+500);try{const result=await getMessaging().sendEachForMulticast({tokens:batch,notification:{title:'Bir seyyah seni alkışladı! 💚',body},data:{route:'community',notificationId:id},android:{priority:'normal',notification:{channelId:'community',icon:'ic_stat_seyyah',tag:'like-'+id}}});await Promise.all(result.responses.flatMap((r,index)=>['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(r.error?.code)?unique.get(batch[index]).map(ref=>ref.delete()):[]));}catch(error){logger.warn('Like push failed; inbox entry remains available.',{code:error.code||'unknown'});}}
});
