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
