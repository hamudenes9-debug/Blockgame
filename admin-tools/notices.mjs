// Console notices have a reserved namespace and remain authoritative in
// Firestore, so a scheduled GitHub publication never erases them.
export function mergeAnnouncements(source, current=[], deleted=[], overrides={}){
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides)||Object.keys(overrides).length>1000||Object.entries(overrides).some(([id,body])=>!/^[-a-zA-Z0-9_]{1,80}$/.test(id)||typeof body!=='string'||!body.trim()||body.length>2000))throw Error('Geçersiz duyuru düzenleme geçmişi');
 if(!Array.isArray(deleted)||deleted.length>1000||deleted.some(id=>typeof id!=='string'))throw Error('Geçersiz silinen duyuru listesi');
 if(!Array.isArray(source)||!Array.isArray(current))throw Error('Geçersiz duyuru listesi');
 if(source.some(n=>n.id?.startsWith('shell-')))throw Error('shell- kimlikleri Cloud Shell komutuna ayrılmıştır');
 const merged=[...source,...current.filter(n=>n.id?.startsWith('shell-')||(Object.hasOwn(overrides,n.id)&&!source.some(a=>a.id===n.id))).map(n=>({...n,delivery:'in-app'}))].filter(n=>!deleted.includes(n.id)).map(n=>Object.hasOwn(overrides,n.id)?{...n,body:overrides[n.id],delivery:'in-app'}:n);
 if(merged.length>30)throw Error('Duyuru listesi dolu; mevcut duyurular silinmeden yayım durduruldu');
 if(new Set(merged.map(n=>n.id)).size!==merged.length)throw Error('Tekrarlanan duyuru kimliği');
 return merged;
}

// Explicit manual maintenance remains authoritative until /bakım github.
export function mergeMaintenance(source, current={}){
 const manual=current.maintenanceOverride===true;
 const maintenance=manual?current.maintenance:source;
 if(typeof maintenance?.enabled!=='boolean')throw Error('Geçersiz bakım ayarı');
 for(const [key,limit] of [['message',1000],['until',100]])if(maintenance[key]!==undefined&&(typeof maintenance[key]!=='string'||maintenance[key].length>limit))throw Error('Geçersiz bakım açıklaması');
 return {maintenance:{enabled:maintenance.enabled,message:maintenance.message||'',until:maintenance.until||''},maintenanceOverride:manual};
}
