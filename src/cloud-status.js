export function withTimeout(promise, ms=12000) {
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{const error=new Error('Sunucu yanıtı zamanında alınamadı');error.code='client-timeout';reject(error);},ms);
    Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});
  });
}
export function describeCloudError(error, writing=false){
  const code=String(error?.code||'unknown').replace(/^firestore\//,'').replace(/[^\w/-]/g,'').slice(0,70);
  const messages={
    'permission-denied':'Firestore erişimi reddetti. Firebase → Firestore Database → Rules bölümündeki kurallar kontrol edilmeli.',
    'unauthenticated':'Google oturumu bulunamadı veya geçersiz. Profil bölümünden yeniden Google ile giriş yap.',
    'not-found':'Firestore veritabanı bulunamadı. Firebase projesinde (default) Firestore veritabanını kontrol et.',
    'failed-precondition':'Firestore yapılandırması hazır değil. Veritabanı ve gerekli dizinler kontrol edilmeli.',
    'unavailable':'Firestore sunucusuna ulaşılamıyor. İnternet bağlantısını, VPN/DNS ayarlarını ve veritabanının etkinliğini kontrol et.',
    'client-timeout':writing?'12 saniyede sunucu onayı alınamadı. Skor cihazında saklı; çevrimiçi kaydın durumu henüz doğrulanamadı.':'12 saniyede sunucuya ulaşılamadı. İnternet bağlantısını ve Firebase Firestore veritabanının oluşturulduğunu kontrol et.',
    'not-configured':'Bu sürümde Firebase bağlantısı yapılandırılmamış.'
  };
  return `${messages[code]||'Çevrimiçi işlem tamamlanamadı. Hata kodunu paylaşarak kontrol etmemizi sağlayabilirsin.'} (Kod: ${code})`;
}
