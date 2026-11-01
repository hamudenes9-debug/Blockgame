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
 await LocalNotifications.addListener('localNotificationActionPerformed',event=>{if(event.notification.extra?.route==='practice')onRoute('practice');});
}
export async function setReminders(enabled){if(!native)throw Error('Sistem hatırlatmaları Android uygulamasında kullanılabilir.');if(!enabled){await LocalNotifications.cancel({notifications:Array.from({length:8},(_,i)=>({id:7300+i}))});localStorage.setItem(REMINDERS,'false');return;}
 const permission=await LocalNotifications.requestPermissions();if(permission.display!=='granted')throw Error('Bildirim izni verilmedi. Telefonun uygulama ayarlarından izin verebilirsin.');
 await LocalNotifications.cancel({notifications:Array.from({length:8},(_,i)=>({id:7300+i}))});
 try{await LocalNotifications.schedule({notifications:reminderSlots().map(slot=>({id:slot.id,title:'Bir kelime molası ver! 🧭',body:'Günlük serini sürdürmek için alıştırma yap.',channelId:'practice',smallIcon:'ic_stat_seyyah',actionTypeId:'PRACTICE',extra:{route:'practice'},schedule:{on:{hour:slot.hour,minute:slot.minute,second:0},allowWhileIdle:false}}))});}catch(error){await LocalNotifications.cancel({notifications:Array.from({length:8},(_,i)=>({id:7300+i}))}).catch(()=>{});localStorage.setItem(REMINDERS,'false');throw error;}
 localStorage.setItem(REMINDERS,'true');
}
// Upgrade cleanup only. This free version never registers or uploads FCM tokens.
export async function disconnectNotifications(){
 if(!native||!pushEnabled())return;
 let stopped=false,removed=false;
 try{await PushNotifications.unregister();stopped=true;}catch{}
 try{await removePushToken(deviceId());removed=true;}catch{}
 if(stopped||removed)localStorage.setItem(PUSH,'false');
}
