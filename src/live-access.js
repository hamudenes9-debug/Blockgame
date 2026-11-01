import {doc,getDocFromServer} from 'firebase/firestore';
import {freshIdentity,requireCloudUser,logout} from './firebase.js';
import {APP_VERSION} from './version.js';
import {validatePolicy,accessDecision,servicesReady,premiumActive,createServerClock} from './live-policy.js';
import {withTimeout} from './cloud-status.js';
export const serverClock=createServerClock();
let generation=0;
let policy=null,identity=null,entitlement=null,configAt=-Infinity,accountAt=-Infinity,busy=false,blocked=false,bypass=false,callback=()=>{},timer;
export const livePolicy=()=>policy;
export const liveIdentity=()=>identity;
export const premiumRecord=()=>entitlement;
export const accessStatus=()=>accessDecision({policy,version:APP_VERSION,connected:navigator.onLine&&!!identity,leaseAge:serverClock.age(),configAge:performance.now()-configAt,blocked,bypass});
export const canPlay=()=>accessStatus()==='ready';
export const canUseServices=()=>canPlay()&&servicesReady({connected:navigator.onLine,identity,policy,leaseAge:serverClock.age(),configAge:performance.now()-configAt,blocked});
export const playDate=()=>canUseServices()?new Date(serverClock.now()):new Date();
export const hasPremium=()=>canUseServices()&&!!identity&&!identity.anonymous&&premiumActive(entitlement,serverClock.now());
export const trustedDate=()=>{if(!canUseServices())throw Error('Önce çevrimiçi erişim kontrolü tamamlanmalı.');return new Date(serverClock.now());};
export function maintenanceCode(code){if(code==='221015'&&accessStatus()==='maintenance'){bypass=true;callback();return true;}return false;}
export function resetAccess(){generation++;blocked=false;identity=null;entitlement=null;bypass=false;accountAt=-Infinity;callback();checkAccess();}
export function onAccessChange(fn){callback=fn;}
export async function checkAccess(force=false){if(busy||blocked||document.hidden)return;busy=true;const epoch=generation;
 try{const next=await freshIdentity();if(epoch!==generation)return;serverClock.accept(next.issuedAt);const changed=identity?.uid!==next.uid;identity=next;if(changed){entitlement=null;bypass=false;accountAt=-Infinity;}
  const {db,user}=await requireCloudUser();
  if(force||performance.now()-configAt>=60000){const snap=await withTimeout(getDocFromServer(doc(db,'operations','current')),6000);if(epoch!==generation)return;const parsed=validatePolicy(snap.data());if(user.uid!==identity.uid)throw Error('Hesap değişti');policy=parsed;configAt=performance.now();}
  if(force||performance.now()-accountAt>=60000){const snap=next.anonymous?null:await withTimeout(getDocFromServer(doc(db,'premium',next.uid)),6000);if(epoch!==generation)return;if(user.uid!==identity.uid)throw Error('Hesap değişti');entitlement=snap?.data()||null;accountAt=performance.now();}
 }catch(error){if(epoch!==generation)return;if(['auth/user-disabled','auth/user-token-expired','auth/invalid-user-token'].includes(error.code)){blocked=error.code==='auth/user-disabled'?'disabled':'session';entitlement=null;try{await logout();}catch{}}else{configAt=-Infinity;}}
 finally{busy=false;callback();}
}
export function startAccess(){if(timer)return;checkAccess(true);timer=setInterval(()=>{callback();checkAccess();},5000);window.addEventListener('offline',()=>{configAt=-Infinity;callback();});window.addEventListener('online',()=>checkAccess(true));document.addEventListener('visibilitychange',()=>{if(!document.hidden){configAt=-Infinity;callback();checkAccess(true);}});}
