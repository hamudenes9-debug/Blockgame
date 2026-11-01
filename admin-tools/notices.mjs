// Console notices have a reserved namespace and remain authoritative in
// Firestore, so a scheduled GitHub publication never erases them.
export function mergeAnnouncements(source, current=[]){
 if(!Array.isArray(source)||!Array.isArray(current))throw Error('Geçersiz duyuru listesi');
 if(source.some(n=>n.id?.startsWith('shell-')))throw Error('shell- kimlikleri Cloud Shell komutuna ayrılmıştır');
 const merged=[...source,...current.filter(n=>n.id?.startsWith('shell-')).map(n=>({...n,delivery:'in-app'}))];
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
