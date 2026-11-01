import {doc,setDoc,serverTimestamp} from 'firebase/firestore';
import {requireCloudUser} from './firebase.js';
import {Capacitor} from '@capacitor/core';
import {LocalNotifications} from '@capacitor/local-notifications';
import {PushNotifications} from '@capacitor/push-notifications';
import {reminderSlots} from '../shared/practice.js';
import {removePushToken} from './community.js';
const native=Capacitor.getPlatform()==='android';
const REMINDERS='seyyah-reminders',PUSH='seyyah-like-push';
let installed=false;
function deviceId(){let id=localStorage.getItem('seyyah-device-id');if(!id){id=crypto.randomUUID();localStorage.setItem('seyyah-device-id',id);}return id;}
export const remindersEnabled=()=>localStorage.getItem(REMINDERS)==='true';
export const pushEnabled=()=>localStorage.getItem(PUSH)==='true';
export const nativeNotificationsSupported=()=>native;
export async function initNotifications(onRoute){if(!native||installed)return;installed=true;
 await LocalNotifications.registerActionTypes({types:[{id:'PRACTICE',actions:[{id:'practice',title:'Yap',foreground:true}]}]});
 await LocalNotifications.createChannel({id:'practice',name:'Alıştırma hatırlatmaları',description:'Üç saatte bir kelime alıştırması',importance:3});
 await PushNotifications.createChannel({id:'news',name:'Duyurular ve Bayram Bereketi',importance:4});
 await PushNotifications.addListener('pushNotificationActionPerformed',()=>onRoute('news'));
 await PushNotifications.addListener('registration',async result=>{if(!eventNotificationsEnabled())return;try{const {db,user}=await requireCloudUser();await setDoc(doc(db,'users',user.uid,'devices',deviceId()),{token:result.value,platform:'android',updatedAt:serverTimestamp()});registeredUid=user.uid;pushResult?.resolve();}catch{pushResult?.reject(Error('Bildirim kaydı sunucuda tamamlanamadı.'));}finally{pushResult=null;}});
 await PushNotifications.addListener('registrationError',()=>{pushResult?.reject(Error('Bildirim servisine ulaşılamadı.'));pushResult=null;});
 await PushNotifications.addListener('pushNotificationReceived',async message=>{const id=String(message.data?.noticeId||message.id||'').slice(0,100);if(!id||localStorage.getItem('push-seen-'+id))return;localStorage.setItem('push-seen-'+id,'true');try{await LocalNotifications.schedule({notifications:[{id:100000+Math.abs([...id].reduce((v,c)=>(v*31+c.charCodeAt(0))|0,0))%1000000,title:String(message.title||'Seyyah postası').slice(0,120),body:String(message.body||'Yeni duyuru var.').slice(0,500),channelId:'news',extra:{route:'news'}}]});}catch{}});
 await LocalNotifications.addListener('localNotificationActionPerformed',event=>{if(event.notification.extra?.route==='practice')onRoute('practice');if(event.notification.extra?.route==='news')onRoute('news');});
}
export async function setReminders(enabled){if(!native)throw Error('Sistem hatırlatmaları Android uygulamasında kullanılabilir.');if(!enabled){await LocalNotifications.cancel({notifications:Array.from({length:8},(_,i)=>({id:7300+i}))});localStorage.setItem(REMINDERS,'false');return;}
 const permission=await LocalNotifications.requestPermissions();if(permission.display!=='granted')throw Error('Bildirim izni verilmedi. Telefonun uygulama ayarlarından izin verebilirsin.');
 await LocalNotifications.cancel({notifications:Array.from({length:8},(_,i)=>({id:7300+i}))});
 try{await LocalNotifications.schedule({notifications:reminderSlots().map(slot=>({id:slot.id,title:'Bir kelime molası ver! 🧭',body:'Günlük serini sürdürmek için alıştırma yap.',channelId:'practice',smallIcon:'ic_stat_seyyah',actionTypeId:'PRACTICE',extra:{route:'practice'},schedule:{on:{hour:slot.hour,minute:slot.minute,second:0},allowWhileIdle:false}}))});}catch(error){await LocalNotifications.cancel({notifications:Array.from({length:8},(_,i)=>({id:7300+i}))}).catch(()=>{});localStorage.setItem(REMINDERS,'false');throw error;}
 localStorage.setItem(REMINDERS,'true');
}
// Upgrade cleanup only. This free version never registers or uploads FCM tokens.
export async function disconnectNotifications(){
 if(!native)return;
 if(eventNotificationsEnabled()){try{await removePushToken(deviceId());await PushNotifications.unregister();registeredUid=null;}catch{throw Error('Bildirim hesabı bağlantısı kaldırılamadı. Tekrar dene.');}}
 if(!pushEnabled())return;
 let stopped=false,removed=false;
 try{await PushNotifications.unregister();stopped=true;}catch{}
 try{await removePushToken(deviceId());removed=true;}catch{}
 if(stopped||removed)localStorage.setItem(PUSH,'false');
}

let pushResult=null,registeredUid=null,lastRegistration=-Infinity;
export const eventNotificationsEnabled=()=>localStorage.getItem('seyyah-event-notifications')==='true';
export async function setEventNotifications(enabled){
 if(!native)throw Error('Sistem bildirimleri Android uygulamasında kullanılabilir.');
 if(!enabled){await removePushToken(deviceId());await PushNotifications.unregister();registeredUid=null;localStorage.setItem('seyyah-event-notifications','false');return;}
 const permission=await PushNotifications.requestPermissions();if(permission.receive!=='granted')throw Error('Bildirim izni verilmedi. Telefon ayarlarından izin verebilirsin.');
 const local=await LocalNotifications.checkPermissions();if(local.display!=='granted')await LocalNotifications.requestPermissions();
 localStorage.setItem('seyyah-event-notifications','true');lastRegistration=performance.now();const waiting=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{pushResult=null;reject(Error('Bildirim kaydı zaman aşımına uğradı.'));},15000);pushResult={resolve:()=>{clearTimeout(timeout);resolve();},reject:e=>{clearTimeout(timeout);reject(e);}};});
 try{await PushNotifications.register();await waiting;localStorage.setItem('seyyah-event-notifications','true');}catch(e){pushResult?.reject(e);await waiting.catch(()=>{});throw e;}
}
export async function restoreEventNotifications(){if(!native||!eventNotificationsEnabled()||pushResult||performance.now()-lastRegistration<60000)return;const {user}=await requireCloudUser();if(user.uid!==registeredUid)await setEventNotifications(true);}
