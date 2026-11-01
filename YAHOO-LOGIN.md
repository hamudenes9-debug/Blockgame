# Yahoo ile giriş — 1.8.2

Google, GitHub ve misafir korunur; Yahoo eklenmiştir. Google düğmesindeki düz G harfi, internet/font gerektirmeyen dört renkli SVG logoyla değiştirilmiştir.

## Sağlayıcı ayarları

Firebase Authentication’a Yahoo sağlayıcısını eklediysen uygulama tarafında yeni APK yeterlidir. Sağlayıcının etkin ve kaydedilmiş olduğundan emin ol. Yahoo Developer uygulamasındaki callback, Firebase’in gösterdiği adresle birebir aynı olmalıdır:

```
https://blockgame-46ae9.firebaseapp.com/__/auth/handler
```

Client secret yalnızca Firebase Console’daki Yahoo sağlayıcısı alanında tutulur. Sohbete, ekran görüntüsüne veya depoya koyma. Google/GitHub sağlayıcılarını kapatma. Web oyunu ayrıca Firebase ortam değişkenleri ve Authorized domains ayarı gerektirir; indirme sitesi oturum açmaz.

## Uygulama akışı

- Android: mevcut Capacitor Firebase Authentication `signInWithYahoo({skipNativeAuth:false})` akışı. SDK tarayıcı/OAuth dönüşünü yönetir; özel sunucu veya yeni ücretli servis eklenmez.
- Yahoo erişim belirteci tek başına kullanılmaz: sağlayıcının ID token’ı `OAuthProvider('yahoo.com').credential({idToken})` ile JS Firebase oturumuna aktarılır. Köprü nonce döndürürse rawNonce olarak iletilir. Firebase oturum ID token’ı Yahoo ID token’ı yerine kullanılmaz.
- Sağlayıcı ID token’ı veya native UID eksikse güvenli hata gösterilir; daha zayıf bir access-token-only yönteme düşülmez. Native/JS UID uyuşmazlığında JS oturumu kapatılır. Başarı/başarısızlık sonunda native oturum temizliği denenir; oyun ve Firestore JS oturumunu kullanır.
- Web: Firebase `signInWithPopup` ve `OAuthProvider('yahoo.com')`. İlave posta/kişiler kapsamları istenmez.
- Kimlik belirteçleri uygulamanın özel yerel kayıtlarına veya günlüklerine yazılmaz. Firebase SDK kendi oturum kalıcılığını yönetir.
- Google/GitHub/Yahoo ayrı UID’ler oluşturabilir. Otomatik hesap bağlama, e-posta eşleşmesiyle birleştirme veya ilerleme taşıma yoktur. Mevcut ilerleme için önceki giriş yöntemini/hesabını kullan. Aynı e-postada farklı sağlayıcı hatası gelirse mevcut yönteme dön.
- Profilde Yahoo etiketi ve yeniden açılışta sağlayıcı bilgisi korunur. Mevcut UID bazlı Firestore kuralları değişmedi.

## Doğrulama

Birim testleri; popup/Android dalları, ID token zorunluluğu, UID kontrolü, iptal/çakışma, oturum temizliği, sağlayıcı etiketi ve dört renkli Google logosunu kapsar. Tarayıcıdaki taklitli oturum testi gerçek Yahoo OAuth testi yerine geçmez.

Gerçek telefonda: Yahoo yetkilendir → profil Yahoo → bir bulmaca bitir/eşitle → kapat/aç → çıkış → aynı Yahoo hesabıyla tekrar giriş. Ayrıca iptal/geri dönme ve Google/GitHub’a geçişte eski kayıtların korunmasını kontrol et. Canlı Yahoo hesabıyla uçtan uca giriş bu çalışma ortamında doğrulanmadı. `missing-yahoo-credential` gibi bir hata varsa yalnızca ekrandaki hata kodunu paylaş; token, parola veya secret paylaşma.
