# GitHub ile giriş — 1.8.1

Google ve misafir girişleri korunur; GitHub ayrıca sunulur. **Client secret APK’ya, web koduna veya Git deposuna eklenmez.**

## Önce güvenlik

Ekran görüntüsünde açığa çıkan OAuth uygulaması **Client secret** değerini GitHub → Settings → Developer settings → OAuth Apps → ilgili uygulama bölümünden iptal et. Yeni secret oluştur ve yalnızca Firebase Console’daki GitHub sağlayıcısının Client secret alanına gir. Eski secret’ın silindiğini ayrıca kontrol et; yalnızca yenisini üretmek eskisini otomatik iptal etmeyebilir. Secret’ı sohbet, ekran görüntüsü veya GitHub dosyası içinde paylaşma.

Bu çalışma sırasında eski secret kullanılmadı, depoya yazılmadı ve senin adına iptal edilmedi. Rotasyonu proje sahibi yapmalı.

## Firebase ve GitHub ayarları

1. GitHub’daki **OAuth App** için Authorization callback URL:

   ```text
   https://blockgame-46ae9.firebaseapp.com/__/auth/handler
   ```

   Firebase Authentication → Sign-in method → GitHub ekranında gösterilen callback ile birebir aynı olmalı. Bu bir GitHub indirme bağlantısı veya Android paket adı değildir. GitHub OAuth App Homepage URL alanı için kendi site adresini, site henüz yayınlanmadıysa proje sayfanı kullanabilirsin.

2. Firebase Console → **blockgame-46ae9** → Authentication → Sign-in method → **GitHub**:
   - Enable açık olsun.
   - Kendi OAuth App’inin Client ID’sini ve **yenilenmiş** Client secret’ını ilgili alanlara gir.
   - **Save / Kaydet** seç. Google sağlayıcısını kapatma.

3. 1.8.1 APK’sını uygulamayı silmeden üzerine kur. Giriş ekranında **GitHub ile giriş yap** seç; açılan GitHub yetkilendirme ekranında uygulama adını ve izinleri kontrol et.

Bu ayarları yalnızca proje sahibi konsolda tamamlayabilir; burada canlı Firebase/GitHub OAuth ayarlarına erişilip değişiklik yapılmadı. 1.8.0 kupa/bulut Firestore kuralları zaten yayındaysa bu giriş değişikliği için yeni kural gerekmez. Kurallar UID üzerinden çalışır, sağlayıcı adını Google ile sınırlandırmaz. Spark kullanılabilir; yeni ücretli sunucu yoktur.

## Oturum ve veriler

- Android’de mevcut Capacitor Firebase Authentication eklentisinin yerel GitHub OAuth akışı kullanılır. Genel `skipNativeAuth: true` Google davranışı korunur; GitHub çağrısında `skipNativeAuth: false` açıkça seçilir.
- Yerel OAuth sonucundaki GitHub access token, `GithubAuthProvider.credential` ile JavaScript Firebase oturumuna aktarılır. Uygulama bu token’ı ayrıca yerel depolamaya veya günlüğe yazmaz. SDK’nın normal Firebase oturum kalıcılığı devam eder.
- Başarılı veya başarısız aktarımın sonunda yerel oturum temizlenir; Firestore ve oyun yalnızca JavaScript Firebase oturumunu kullanır. Native/JS UID uyuşmazlığı kabul edilmez.
- GitHub için yalnızca `user:email` ek kapsamı istenir. Repo, admin veya yazma yetkisi istenmez. OAuth standart temel profil bilgilerini de sağlar.
- Uygulama içinde OAuth yetkilendirme kodu değişimi veya özel callback sunucusu yazılmaz; Firebase SDK bunu yönetir. OAuth secret sadece Firebase yapılandırmasında kalır.
- Web Firebase ortam değişkenleri yapılandırılmışsa GitHub popup akışı kullanılır. Firebase Authentication → Authorized domains listesinde gerçek oyun web alan adı bulunmalı. Bağımsız indirme sitesi giriş yapmaz ve OAuth secret barındırmaz.

## Google hesabındaki ilerleme

**GitHub ile giriş, ayrı bir Firebase UID/oyun hesabı oluşturabilir.** Aynı e-posta veya görünen ad üzerinden otomatik hesap birleştirme/ilerleme aktarma yapılmaz. Eski Google ilerlemen için Google ile devam et. Firebase “account-exists-with-different-credential” döndürürse mevcut giriş yöntemini kullan; uygulama bu hatada hesap oluşturma/linkleme döngüsüne girmez.

Profil doğru sağlayıcıyı (Google/GitHub) gösterir. Aşama, kupa, prestij, avatar ve cüzdan aynı Firebase UID’ye bağlıdır; yeni GitHub hesabında eski Google kayıtları görünmeyebilir. Bu veri silinmesi anlamına gelmez. Hesap bağlama ve hesaplar arasında birleştirme bu sürümün kapsamı değildir.

## Gerçek telefonda doğrulama

1. Yeni GitHub hesabıyla giriş, iptal edip yeniden deneme ve profil etiketi.
2. Uygulamayı kapatıp açınca oturumun geri gelmesi.
3. Bulmaca bitirip hesabı eşitleme; aynı GitHub hesabıyla başka cihazda kayıt yükleme.
4. Çıkış yapıp Google ile giriş: eski Google kaydının korunması.
5. Aynı e-posta başka sağlayıcıda kayıtlıysa güvenli hata mesajı; otomatik birleştirme olmaması.
6. Gizli e-postalı GitHub profili, bağlantı kesilmesi, tarayıcıdan geri dönme.

Yerel birim testleri ve taklitli tarayıcı testleri gerçek Firebase/GitHub OAuth oturumunun kanıtı değildir. Fiziksel Android telefonla canlı uçtan uca giriş testi bu çalışma ortamında yapılmadı; sağlayıcı ayarlarını kaydedip yeni secret ile cihazda doğrulamak gerekir.
