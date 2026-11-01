import {Capacitor} from '@capacitor/core';
import {LocalNotifications} from '@capacitor/local-notifications';
import {PushNotifications} from '@capacitor/push-notifications';
import {reminderSlots} from '../shared/practice.js';
import {storePushToken,removePushToken} from './community.js';
import {withTimeout} from './cloud-status.js';
const native=Capacitor.getPlatform()==='android';
const REMINDERS='seyyah-reminders',PUSH='seyyah-like-push';
let installed=false,pushOwner=null,lastToken=null,registerWaiter=null;
function deviceId(){let id=localStorage.getItem('seyyah-device-id');if(!id){id=crypto.randomUUID();localStorage.setItem('seyyah-device-id',id);}return id;}
export const remindersEnabled=()=>localStorage.getItem(REMINDERS)==='true';
export const pushEnabled=()=>localStorage.getItem(PUSH)==='true';
export const nativeNotificationsSupported=()=>native;
export async function initNotifications(onRoute,onPush){if(!native||installed)return;installed=true;
 await LocalNotifications.registerActionTypes({types:[{id:'PRACTICE',actions:[{id:'practice',title:'Yap',foreground:true}]}]});
 await LocalNotifications.createChannel({id:'practice',name:'Alıştırma hatırlatmaları',description:'Üç saatte bir kelime alıştırması',importance:3});
 await PushNotifications.createChannel({id:'community',name:'Topluluk beğenileri',importance:3});
 await LocalNotifications.addListener('localNotificationActionPerformed',event=>{if(event.notification.extra?.route==='practice')onRoute('practice');});
 await PushNotifications.addListener('pushNotificationActionPerformed',event=>{if(event.notification.data?.route==='community')onRoute('community');});
 await PushNotifications.addListener('pushNotificationReceived',n=>onPush({id:n.data?.notificationId,body:n.body||'Yeni bir beğenin var.'}));
 await PushNotifications.addListener('registration',token=>{lastToken=token.value;if(registerWaiter){registerWaiter.resolve(token.value);registerWaiter=null;}else if(pushEnabled()&&pushOwner){storePushToken(deviceId(),token.value).catch(()=>{});}});
 await PushNotifications.addListener('registrationError',error=>{registerWaiter?.reject(Error(error.error||'Bildirim kaydı yapılamadı.'));registerWaiter=null;});
}
export async function setReminders(enabled){if(!native)throw Error('Sistem hatırlatmaları Android uygulamasında kullanılabilir.');if(!enabled){await LocalNotifications.cancel({notifications:Array.from({length:8},(_,i)=>({id:7300+i}))});localStorage.setItem(REMINDERS,'false');return;}
 const permission=await LocalNotifications.requestPermissions();if(permission.display!=='granted')throw Error('Bildirim izni verilmedi. Telefonun uygulama ayarlarından izin verebilirsin.');
 await LocalNotifications.cancel({notifications:Array.from({length:8},(_,i)=>({id:7300+i}))});
 try{await LocalNotifications.schedule({notifications:reminderSlots().map(slot=>({id:slot.id,title:'Bir kelime molası ver! 🧭',body:'Günlük serini sürdürmek için alıştırma yap.',channelId:'practice',smallIcon:'ic_stat_seyyah',actionTypeId:'PRACTICE',extra:{route:'practice'},schedule:{on:{hour:slot.hour,minute:slot.minute,second:0},allowWhileIdle:false}}))});}catch(error){await LocalNotifications.cancel({notifications:Array.from({length:8},(_,i)=>({id:7300+i}))}).catch(()=>{});localStorage.setItem(REMINDERS,'false');throw error;}
 localStorage.setItem(REMINDERS,'true');
}
export async function setLikePush(enabled,{askPermission=true}={}){
 if(!native)throw Error('Telefon bildirimleri Android uygulamasında kullanılabilir.');
 if(!enabled){localStorage.setItem(PUSH,'false');pushOwner=null;lastToken=null;registerWaiter?.reject(Error('Bildirimler kapatıldı.'));registerWaiter=null;let stopped=false,removed=false;try{await PushNotifications.unregister();stopped=true;}catch{}try{await removePushToken(deviceId());removed=true;}catch{}if(!stopped&&!removed)throw Error('Bildirim iptali doğrulanamadı. İnternet bağlantısıyla tekrar dene.');return;}
 const permission=askPermission?await PushNotifications.requestPermissions():await PushNotifications.checkPermissions();if(permission.receive!=='granted')throw Error('Beğeni bildirimleri için bildirim izni gerekiyor.');
 const token=lastToken||await withTimeout(new Promise((resolve,reject)=>{registerWaiter={resolve,reject};PushNotifications.register().catch(reject);}),12000).finally(()=>registerWaiter=null);
 try{pushOwner=await storePushToken(deviceId(),token);localStorage.setItem(PUSH,'true');}catch(error){if(!pushEnabled()){pushOwner=null;lastToken=null;await PushNotifications.unregister().catch(()=>{});}throw error;}
}
export async function disconnectNotifications(){if(native&&pushEnabled())await setLikePush(false).catch(()=>{localStorage.setItem(PUSH,'false');pushOwner=null;lastToken=null;});}
