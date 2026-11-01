import {accountKey,cleanAccount,sameState} from './account-state.js';
// Transport is injected: unit tests never contact the production Firebase project.
export function createAccountSync({storage,load,commit,apply,status,id=()=>crypto.randomUUID()}){
 let uid=null,entry=null,epoch=0,busy=null,conflict=null;
 const persist=()=>storage.setItem(accountKey(uid),JSON.stringify(entry));
 const notify=(kind,message)=>status({kind,message,conflict,busy:!!busy,uid});
 function backup(){storage.setItem(accountKey(uid)+'-backup',JSON.stringify(entry));}
 function adopt(remote){backup();entry={state:cleanAccount(remote.state),base:remote.revision,dirty:remote.version!==4,pending:null};persist();apply(entry.state);}
 function acknowledge(remote){const confirmed=cleanAccount(remote.state),previous=entry.pending.state;let state=entry.state;if(sameState(state,previous))state=confirmed;else{const rejected=(previous.trophies.festival||[]).filter(n=>!confirmed.trophies.festival?.includes(n));if(rejected.length)state=cleanAccount({...state,trophies:{...state.trophies,festival:(state.trophies.festival||[]).filter(n=>!rejected.includes(n))}});}const changed=!sameState(entry.state,state);entry.state=state;entry.base=remote.revision;entry.dirty=!sameState(state,confirmed);entry.pending=null;persist();if(changed)apply(state);}

 async function write(generation){const state=cleanAccount(entry.state),writeId=id();entry.pending={id:writeId,state};persist();const result=await commit(uid,entry.base,writeId,state);if(generation!==epoch)return;acknowledge(result);notify(entry.dirty?'pending':'synced',entry.dirty?'Yeni değişiklikler cihazda; eşitleme bekleniyor.':'Hesabına kaydedildi. Diğer cihazda giriş yaptığında geri yüklenir.');}
 async function execute(choice){const generation=epoch;if(!uid){notify('guest','Misafir ilerlemesi yalnızca bu cihazda saklanır.');return;}
 notify('loading','Hesabındaki kayıt kontrol ediliyor…');
 try{const remote=await load(uid);if(generation!==epoch)return;
  if(remote?.version>4){notify('error','Bu kayıt daha yeni bir uygulama sürümü gerektiriyor. Güncellemeden üzerine yazılmaz.');return;}
  if(choice){if(!conflict||(remote?.revision||0)!==conflict.revision){conflict=remote||{revision:0,state:cleanAccount()};notify('conflict','Bulut kaydı değişti. Güncel kaydı kontrol edip yeniden seç.');return;}if(choice==='cloud'){adopt(remote||{revision:0,state:cleanAccount()});conflict=null;if(entry.dirty){await write(generation);return;}notify('synced','Bulut kaydı bu cihaza yüklendi. Önceki cihaz kaydı yedeklendi.');return;}backup();storage.setItem(accountKey(uid)+'-cloud-backup',JSON.stringify(remote));entry.base=remote?.revision||0;entry.dirty=true;entry.pending=null;persist();conflict=null;await write(generation);return;}
  if(remote&&entry.pending?.id===remote.writeId)acknowledge(remote);
  const revision=remote?.revision||0;
  if(revision!==entry.base){if(!remote||(entry.dirty&&!sameState(entry.state,cleanAccount(remote?.state)))){conflict=remote||{revision:0,state:cleanAccount()};notify('conflict','Bu cihaz ve bulutta farklı ilerleme var. Birini seçmeden üzerine yazılmayacak.');return;}if(remote){adopt(remote);conflict=null;if(entry.dirty){await write(generation);return;}notify('synced','Hesabındaki ilerlemen geri yüklendi.');return;}}
  if(entry.dirty||!remote||remote.version!==4){await write(generation);}else{notify('synced','Hesabındaki kaydın güncel.');}
 }catch(error){if(generation===epoch){notify('error',error.code==='permission-denied'?'Hesap eşitleme izni yok. 1.10.0 Firestore kurallarını yayınla ve tüm cihazları güncelle. İlerlemen cihazda korunuyor.':error.code==='save-conflict'?'Diğer cihaz kaydı değiştirdi. Tekrar eşitle; cihaz kaydın korunuyor.':'Bulut eşitlemesi doğrulanamadı. Cihaz kaydın korunuyor; bağlantıyı kontrol edip tekrar eşitle.');}}
 }
 return {
  bind(nextUid,seed){epoch++;busy=null;uid=nextUid;conflict=null;try{entry=JSON.parse(storage.getItem(accountKey(uid)));}catch{entry=null;}if(!entry||typeof entry.base!=='number'){entry={state:cleanAccount(seed),base:0,dirty:!!seed,pending:null};}else{if(!entry.state?.journey&&!storage.getItem(accountKey(uid)+'-before-month-v3'))storage.setItem(accountKey(uid)+'-before-month-v3',JSON.stringify(entry));const cleaned=cleanAccount(entry.state);entry.dirty=!!entry.dirty||!sameState(entry.state,cleaned);entry.state=cleaned;}persist();apply(entry.state);notify(uid?'local':'guest',uid?'Cihaz kaydı yüklendi; bulut kontrolü bekleniyor.':'Misafir ilerlemesi yalnızca bu cihazda saklanır.');},
  save(state){if(!entry)return;entry.state=cleanAccount(state);entry.dirty=true;persist();notify(conflict?'conflict':'pending',conflict?'İki cihazda farklı ilerleme var. Profil’den kayıt seç.':'İlerlemen cihazda kayıtlı; buluta gönderilmeyi bekliyor.');},
  sync(choice){if(busy)return busy;const generation=epoch;const task=execute(choice);busy=task;task.finally(()=>{if(generation===epoch)busy=null;});return task;},
  acceptRemote(uid,data){if(uid!==this.uid)return false;entry={state:cleanAccount(data.state),base:data.revision,dirty:false,pending:null};persist();apply(entry.state);notify('synced','Hesabına kaydedildi.');return true;},
  get busy(){return !!busy;},get dirty(){return !!entry?.dirty;},get uid(){return uid;},get conflict(){return conflict;},get state(){return entry?.state;}
 };
}
