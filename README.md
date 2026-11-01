# Kelime Seyyahı

> **Güncel sürüm 1.9.0:** 124 bölüm / 16 durak, 30 günlük keşif defteri, görev ödülleri, 6 avatar hediyesi ve 8 rozet. **Yeni Firestore kurallarını yayımla ve tüm cihazları güncelle.** Kurulum ve kayıt koruma: [MONTH-UPDATE.md](MONTH-UPDATE.md).


Türkçe, seyahat temalı kelime bulmacası. 6 bölge (İstanbul, Kapadokya, Ege kıyıları, Pamukkale, Kaçkar, Mardin) ve 24 elle seçilmiş bulmaca. Dairedeki harfleri sürükleyerek, dokunarak veya klavyeyle birleştir. Çapraz bulmacayı doldur, bonus kelimeler bul ve sonraki durağı aç.

Bu sürüm eski Blokko projesinin **1.5.0** güncellemesidir. Başka bir oyunun marka, görsel, seviye veya kaynak kodu kullanılmamıştır. Sahne çizimleri özgün SVG, bulmaca içeriği bu repo için hazırlanmıştır. Tam Türkçe sözlük yerine her aşama için tanımlı hedef ve bonus kelime listesi kullanılır; listede olmayan bir sözcük için “bu aşamanın kelimeleri arasında değil” denir. 24. aşamada mevcut içerik tamamlanır.

## Çalıştırma

```sh
npm ci
npm run dev
npm test
npm run android:sync
```

Vite 0.0.0.0 adresine bağlanır; `.e2b.app` önizleme alan adına izin verilir. Android için Java 21 ve Android SDK gerekir:

```sh
cd android
./gradlew assembleDebug
```

## Oynanış ve kayıtlar

- Türkçe `i/İ` ve `ı/I` ayrımı korunur. Her harf kutusu bir kelimede en fazla bir kez kullanılabilir. Aynı harften birden çok kutu varsa her biri ayrı seçilir.
- Harfleri sürükle ve bırak; alternatif olarak tek tek dokunup **Bul** seç. Klavye girişi de vardır.
- Harfleri karıştırmak ücretsizdir. İpucu bir bilinmeyen harfi açar, önce hazır hakkı tüketir; yoksa 20 altın harcar. Her ipucu bitiş puanını 10 azaltır.
- İlk tamamlamada hedef kelime başına 5 + aşama bitirme için 25 altın kazanılır. Aynı aşamayı tekrar oynamak yeniden altın kazandırmaz. Bonus kelimeler 10 puan kazandırır.
- Mağaza: 3 ipucu / 50 altın ve 7 ipucu / 100 altın. Gerçek para ile satış yoktur.
- Kısmi bulmacalar, aşama ilerlemesi, cüzdan ve son 100 kelime skoru cihazda saklanır. Bulut eşitlemesi, cihazlar arası ilerleme aktarımı ve hesap bazında ayrı yerel kayıt yoktur.

## Blokko'dan geçiş

Paket adı **`com.blokko.game`** olarak korunur; Google OAuth, Firebase projesi ve APK imzası değişmez. Android uygulama adı, pusula ikonu ve açılış ekranı **Kelime Seyyahı** olmuştur. Kelime aşamaları ayrı kayıt alanında 1'den başlar. Eski skor ve ilerleme anahtarları silinmez; yeni kelime sıralamasına karıştırılmaz.

İlk açılışta mevcut altınlar `seyyah-wallet` içine aktarılır. `speed/power/armor` geliştirmelerinin satın alma fiyatları bir kez altına çevrilir. Yeni cüzdan varsa aktarım tekrar çalışmaz. Kullanıcının uygulamayı silmeden güncellemesi gerekir.

## Google giriş / Firebase

Android `@capacitor-firebase/authentication` ile native Google girişini kullanır; Google token'ı JS Firebase Auth oturumuna çevrilir. Credential Manager “No credentials available” döndürürse alternatif hesap seçicisi kullanılır. `android/app/google-services.json` mevcut yapılandırmayı içerir. `scripts/firebase-config.mjs`, paket adını ve OAuth istemcisini doğrulayıp public istemci yapılandırmasını üretir. Servis hesabı veya özel anahtar istemciye eklenmez.

Web girişini etkinleştirmek için `.env.example` dosyasını `.env.local` olarak kopyalayıp web Firebase uygulaması bilgilerini doldur ve web alan adını Authentication yetkili alanlarına ekle. Android ayrı yerel yapılandırmayı kullanır.

### Yeni kelime dünya sıralaması — gerekli Firebase adımı

Kelime skorları artık **`wordScores`** koleksiyonuna gönderilir. Eski `scores` koleksiyonu blok oyununa aittir. **Firebase Console → Firestore Database → Rules bölümünde bu repodaki `firestore.rules` dosyasını yayınla.** Mevcut başka uygulama kuralların varsa silmeden birleştir. Bu oturumdan kurallar uzaktan yayınlanmamıştır. Yeni kural olmadan Google girişi çalışsa bile kelime skorları için `permission-denied` alınır.

Dünya sıralaması tüm kelime skorlarını belge kimliği sırasıyla 500 kayıtlık sayfalarda okur, Firebase UID bazında toplar ve en yüksek toplam puana sahip 20 oyuncuyu gösterir. Önce 20 oyunu seçip sonra toplamaz; geçmişteki küçük puanlar da toplama dahildir. Özel bileşik indeks gerekmez. Google oturumu olan kullanıcının adı, UID'si, puanı, modu ve tarihi yazılır. Kayıtlar herkese okunabilir. Oyun tamamlanınca ayrı kayıt yazılır; bu geçmiş korunur, arayüzde her UID tek satır olarak gösterilir. Sunucuda hile doğrulaması henüz yoktur. Yerel skorlar otomatik geriye dönük yüklenmez. Okuma/yazma 12 saniyede sunucu onayı alamazsa açık hata/durum gösterir. Yazım zaman aşımı kaydın kesin başarısız olduğu anlamına gelmez.

## Koşullar, gizlilik ve destek

Google girişinden sonra koşullar ve gizlilik bilgilendirmesi gösterilir. Metin sürümü/UID/tarih cihazda tutulur; yeni kelime oyunu metni yeni bir sürüm olduğu için tekrar kabul istenir. Reddetmek Google oturumundan çıkarır. Metinlere giriş ekranı ve Profil'den ulaşılır. Destek: **Tirezteknoloji@gmail.com**.

`src/legal.js` gerçek uygulama akışlarını anlatan ürün metinleridir, hukuki uyumluluk garantisi değildir. Yayıncı, gerçek işletme kimliği, mevzuat, sağlayıcılar ve veri silme sürecini mağaza yayını öncesinde gözden geçirmelidir.

## GitHub sürüm kontrolü / APK

Her soğuk açılışta yükleme ekranı ve public GitHub Releases API kontrolü yapılır. 5 saniyelik kontrol hatası veya çevrimdışı durum oyunu engellemez. Yeni sürüm kullanıcı isterse sistem tarayıcısında açılır; kendiliğinden APK kurulmaz. Profil'den tekrar kontrol yapılabilir. GitHub token'ı uygulamaya konmaz; repo public olmalıdır.

CI testleri, Android derlemesini ve **üretilen APK imzasının Firebase Android OAuth SHA-1'iyle eşleşmesini** doğrular. Ardından `Kelime-Seyyahi.apk` ve SHA-256 özeti yayınlanır. Eski Blokko 1.4.0 güncelleme istemcisini kırmamak için aynı APK ayrıca `Blokko.apk` adıyla yayınlanır. Aynı sürüm etiketinin üzerine yazılmaz.

İmza hâlâ test/debug anahtarıdır ve GitHub cache'de saklanır; üretim imzalama çözümü değildir. Cache kaybolursa yeni anahtarın SHA-1'i eşleşmeyeceği için CI dağıtımı durdurur. Play Store için kalıcı, erişimi kontrollü release imzası gerekir. Yeni sürümde package.json/lock, src/version.js, Android versionName/versionCode ve hata mesajı sürümünü birlikte artır.

## Doğrulama

`npm test`: mevcut regresyon testleri ve 24 bulmacanın harf çoklukları, çapraz kesişimleri/bağlantısı, çözülebilirliği, Türkçe dönüşümleri, ipuçları, aşama başına tek ödül ve eski altın aktarımı. Mobil Chromium 390×844'te gerçek pointer sürüklemesiyle KALE seçimi, klavyeyle aşama tamamlama, ipucu satın alma/tüketme, geri dönüş ve yeniden yüklemede ilerleme, tek seferlik cüzdan aktarımı, profil destek bağlantısı ve yatay taşma kontrol edildi. Ayrıca 24 aşamanın tamamı gerçek arayüz üzerinden çözülerek sonraki aşama geçişleri, son durak ekranı ve ilk tamamlama ödülleri kontrol edildi. Gerçek Android cihazda yeni sürüm ayrıca denenmelidir.

## 1.5.1 — Harf seçimi sesleri

Yeni bir harf kutusu seçildiğinde kısa ve yumuşak, iki sinüs bileşenli bir ses çalar. Harf sayısıyla birlikte pentatonik notalar yükselir. Dokunma, sürükleme ve klavyeyle harf kutusu seçimi aynı yolu kullanır. Aynı kutunun üzerinde beklemek veya önceki harfe geri dönmek tekrar ses üretmez. Üstteki ses anahtarı hem harf hem doğru kelime sesini kapatır; tercih cihazda saklanır. Sesler Web Audio ile yerelde üretilir, internetten dosya indirilmez. Ses API'si yoksa veya tarayıcı sesi engelliyorsa oyun devam eder. Eşzamanlı ses sayısı sınırlandırılır ve biten düğümler serbest bırakılır.

52 birim testi ve üretim derlemesi geçti. Ses seçimi, tekrar engelleme, sessiz mod, notalar, düğüm temizliği ve bloke edilmiş ses başlatma testleri eklendi. Gerçek cihazdaki hoparlör/ses seviyesi ayrıca denenmelidir.


## 1.5.2 — Oyuncu başına toplam puan

Dünya ekranında oyuncular isimleriyle değil Firebase UID'leriyle gruplanır. İsim değişikliği aynı hesabı bölmez; aynı isimli farklı hesaplar birleşmez. En yeni tarihli kayıt görünen adı belirler. Satırda toplam puan ve oyun adedi gösterilir. Tüm sayfalar başarıyla okunmadan kısmi bir sıralama gösterilmez; zaman aşımında sonraki sayfalara istek yapılmaz. Aynı belge kimliği iki sayfada görülürse bir kez sayılır. Eski kayıtlar silinmez; Firestore kurallarını veya Firebase yapılandırmasını değiştirmek gerekmez.

Bu cihaz görünümü cihazda kalan son 100 kaydı toplar; eski sürümlerde yerel kayıtların UID alanı yoktu. Bunlar isimle gruplanır ve “Eski yerel kayıt” olarak etiketlenir; bir Google hesabına tahminen bağlanmaz. Yeni yerel kayıtlara UID eklenir. Dünya ekranındaki eski sunucu kayıtlarında UID zaten bulunduğu için bu belirsizlik yoktur.

Ölçek notu: Bu yaklaşım var olan verileri değiştirmeden küçük oyuncu topluluğunda doğru toplamları sağlar, fakat Dünya yenilendiğinde tüm oyun belgeleri okunur (Firestore okuma maliyeti artar). Veri büyürse sunucuda işlem kimliğiyle tekilleştirilmiş toplamları tutan bir Cloud Function/arka uç ve eski veriler için kontrollü toplu aktarım gerekir. Böyle bir servis bu sürümde dağıtılmamıştır.

59 birim testi ve üretim derlemesi geçti; çok sayfalı toplama, aynı ad/farklı UID, yeniden adlandırma, bozuk kayıtlar ve sayfa hatalarında kısmi sonuç göstermeme test edildi. Canlı Firestore yönetim erişimi olmadan gerçek oyuncu verileri burada okunmadı.

## 1.6.0 — Günlük seri, Topluluk ve bildirimler

- İstanbul gününe göre günlük seri, en uzun seri ve bugün tamamlanan alıştırmalar. Cihazda UID/misafir bazında ayrı tutulur; bulut eşitlemesi yoktur.
- Profil’den izinle açılan Android hatırlatmaları: gece dahil yaklaşık üç saatte bir, **Yap** eylemi mevcut aşamaya götürür. Android pil/izin kısıtları nedeniyle kesin zaman garantisi yoktur.
- Yeni **Topluluk** sekmesi gerçek sunucu kayıtlarından günlük alıştırma sayılarını gösterir; UID başına tek paylaşım ve tek beğeni. Kendi paylaşımını beğenme ve tekrar beğeni kurallarla engellenir.
- Alıcıya özel gelen kutusu, okundu işareti, isteğe bağlı FCM beğeni bildirimi, açılış/koşullar/güncelleme ekranlarını bekleyen bildirim yönlendirmesi.
- **Ek Firebase kurulumu zorunlu:** yeni `firestore.rules` ve `functions/` sunucusu ayrı yayınlanmalıdır. Kapalı uygulamaya beğeni gönderimi APK’yı yüklemekle tek başına çalışmaz. Blaze ücretlendirmesi ve fiziksel cihaz testleri dahil [kurulum rehberi](FIREBASE-SETUP.md).
- Günlük sayılar da istemci skor bildirimlerine dayanır; gerçek oyun sunucuda doğrulanmaz. Kayıt okuma maliyetleri ölçekle artar. Bildirim teslimatı best effort, uygulama içi gelen kutusu ayrı kalıcıdır.

## 1.6.1 — Spark ile ücretsiz beğeni kutusu (güncel yöntem)

1.6.0’daki ücretli sunucu gereksinimi bu sürümün beğeni ekranı için kaldırıldı. **Blaze’e geçmeyin, Cloud Functions yayınlamayın.** 1.6.0 beğeni kuralları değişmeden kullanılabilir.

Topluluk ekranı mevcut beğenileri doğrudan Firestore’dan dinler: son 7 İstanbul günü, gün başına en yeni 30 kayıt. İsim, gönderen UID’sinin herkese açık skor kaydından alınır; kayıt yoksa “Bir seyyah” gösterilir. Okundu durumu bu cihazda hesaba özel saklanır. Dinleyiciler ekrandan çıkınca durur; ilk açılış geçmişi, açık ekran yeni beğenileri gösterir. **Kapalı uygulamaya beğeni push bildirimi yoktur.** Günlük seri ve üç saatlik yerel hatırlatmalar korunur. Spark kotaları geçerlidir; sınırsız okuma değildir.

`functions/` eski opsiyonel sunucu kodu olarak korunur, varsayılan dağıtımdan çıkarılmıştır. Yeni sürüm FCM kaydı oluşturmaz. Güncel adımlar: [FIREBASE-SETUP.md](FIREBASE-SETUP.md).

## 1.7.0 — Google hesabına özel bulut oyun kaydı

- Aynı Google UID’siyle farklı cihazda aşama, bulmaca ilerlemesi, cüzdan/ipucu, günlük seri ve en iyi 100 yerel kelime kaydı geri yüklenir. Dünya sıralamasının mevcut toplamları ayrı korunur; yedekten yükleme skorları tekrar göndermez.
- Google hesapları ve misafir artık ayrı cihaz önbellekleri kullanır. İlk yükseltmede mevcut ilerleme o anda açık olan hesaba bağlanır ve yerel kopyası korunur. Önce eski/ilerlemenin bulunduğu cihazda güncelleyip eşitleyin.
- Sürüm kontrollü Firestore transaction, belirsiz yazma sonucu için yazma kimliği ve cihazda kalıcı bekleyen kayıt. Aynı anda değişmiş cihaz kayıtları otomatik birleştirilmez; Profil’de bütün kayıt için seçim/onay istenir. Sessizce daha yeni cüzdanı ezme yoktur.
- Son değişiklikten yaklaşık 5 saniye sonra otomatik eşitleme; giriş/açılışta kontrol ve Profil → Şimdi eşitle. İnternetsiz değişiklikler cihazda bekler. Aktif diğer cihazdaki oyuna canlı/zorunlu geri yükleme yapılmaz.
- **Yeni `playerSaves` Firestore kuralları zorunlu.** Spark desteklenir, Blaze/Cloud Functions gerekmez; kotalar geçerlidir. Tam kurulum ve sınırlar: [FIREBASE-SETUP.md](FIREBASE-SETUP.md).

## 1.8.0 — Kupa, prestij, avatar ve dört yeni şehir

- Aktif puan sistemi kaldırıldı: eski puanlar kupaya çevrilmeden yeni sezon 0 kupadan başlar. Yerel ve bulut kayıtları şema 2’ye normalize edilir; aşama/cüzdan/seri korunur. Tarihi Firestore puan belgeleri arşiv olarak kalır, yeni sıralamaya dahil olmaz.
- Aşama başına ilk tamamlamaya 20 kupa. Eski tamamlanmış aşamalar da yeni sezonda yeniden bitirilerek bir kez kupa verir. Prestij 1000 kupa harcar, seviye +1; aşama haklarını yenilemez. 64 aşamada toplam 1280 kupa mümkündür.
- “Bu cihaz” sıralaması kaldırıldı. Her UID için tek `trophyPlayers` kaydı; kupa sıralaması ve 1000 kupada açılan, prestij sonrası açık kalan kırmızı Prestij sekmesi.
- Saç, kıyafet, göz, yüz ifadesi, şapka için özgün SVG avatar düzenleyici. Beş kategoride dörder seçenek; cihazda ve Google bulut kaydında korunur, sıralamada görünür.
- Mevcut 24 aşamanın ID’leri korundu. Bartın, Bolu, Zonguldak ve Kocaeli’ye onar yeni aşama ve özgün vektör sahne: toplam **64 aşama / 10 bölge**.
- Tamamlama ekranında puan yok; kupa ve altın gösterilir. İlk açılışta “Puan sistemi değişti” + Tamam bilgilendirmesi hesap/misafir başına bu cihazda bir kez çıkar.
- **Güncel Firestore kuralları zorunlu**, tüm cihazlar 1.8.0’a güncellenmeli. Eski şema yazmaları reddedilir. Şema 2 ve herkese açık kupa kaydı tek transaction’da yazılır. Spark desteklenir; yeni bir ücretli sunucu veya composite index gerekmez. [Kurulum](FIREBASE-SETUP.md).

## 1.8.1 — GitHub ile giriş

- Mevcut Google/misafir girişlerinin yanına GitHub eklendi; profil ve oturum geri yükleme sağlayıcıyı doğru gösterir.
- Android Firebase OAuth → GitHub credential → JS Firebase oturumu. Google Credential Manager/fallback ve mevcut imza/paket korunur. GitHub yalnızca temel profil + `user:email` ister; repo izni yoktur.
- Token veya Client secret uygulama koduna/özel yerel kayda yazılmaz. Çift giriş tıklamaları engellenir; iptal ve sağlayıcı çakışmaları ayrı açıklanır.
- UID bazlı kayıt korunur; **Google ve GitHub hesapları otomatik birleştirilmez**. Mevcut ilerleme için aynı sağlayıcı/hesap kullanılmalı. Firestore kuralları değişmedi.
- Firebase/GitHub sağlayıcı ayarları, callback ve güvenli secret rotasyonu: [GITHUB-LOGIN.md](GITHUB-LOGIN.md). Canlı OAuth/gerçek Android doğrulaması kullanıcı cihazında tamamlanmalıdır.

## 1.8.2 — Yahoo ve Google logosu

Yahoo ile giriş eklendi; Google, GitHub ve misafir girişleri korunur. Google düğmesi artık dört renkli yerel SVG logo kullanır. Yahoo profil etiketi, oturum geri yükleme ve UID bazlı hesap ayrımı desteklenir; otomatik hesap birleştirme yapılmaz. Kurulum ve gerçek cihaz kontrol listesi: [YAHOO-LOGIN.md](YAHOO-LOGIN.md). Firestore kuralları ve paket/imza değiştirilmedi.
