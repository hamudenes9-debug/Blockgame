# Kelime Seyyahı 1.6.0 — Topluluk ve beğeni bildirimleri kurulumu

**APK yüklemek Firebase sunucusunu yayınlamaz.** Bu depodaki Android derlemesi/sürümü ile Firebase dağıtımı birbirinden ayrıdır. Bu çalışma sırasında canlı projeye kurallar veya Cloud Function yayınlanmadı. Admin erişimi ve sunucu anahtarı uygulamanın içine konmaz.

## Hangi özellik neye ihtiyaç duyar?

| Özellik | Gereken |
|---|---|
| Günlük seri | Yeni APK. İstanbul takvimi, cihazda UID/misafir için ayrı. Önceki oyunlar geriye dönük seri oluşturmaz. |
| 3 saatlik “Yap” hatırlatması | Yeni APK → Profil → Alıştırma zamanı → Android bildirim izni. İnternet/Functions gerekmez. |
| Toplulukta günlük alıştırma sayısı | Google girişi, mevcut `wordScores` kayıtları ve okuma izni. Yalnızca başarıyla sunucuya gönderilmiş bulmacalar. |
| Günde kişi başına tek beğeni | Bu depodaki **yeni `firestore.rules`**. |
| Alıcıya özel “... seni beğendi” gelen kutusu | Yeni kurallar + **`notifyCommunityLike` Cloud Function**. |
| Uygulama kapalıyken beğeni bildirimi | Yukarıdakilere ek FCM ve alıcının Profil → Beğeni bildirimleri tercihi/Android izni. |

## 1. Firestore kurallarını yayınla

Firebase Console → proje **blockgame-46ae9** → Firestore Database → Rules.
Depodaki `firestore.rules` dosyasının **tamamını** kopyala ve Publish/Yayınla düğmesine bas.

Mevcut `scores` ve `wordScores` korunur. Koleksiyonları silme, sıfırlama veya yeniden oluşturma. Projede bu depoda bulunmayan başka koleksiyon kuralları varsa onları da koruyarak birleştir.

Yeni kurallar kendi günlük etkinliğini beğenmeyi, aynı UID’nin ikinci beğenisini, başka gün/kişiye ait skor referanslarını, beğeniyi değiştirmeyi/silmeyi ve başka hesaba ait cihaz belirteçlerini/gelen kutusunu okumayı engeller. İstemci bildirim üretemez; yalnızca kendi gelen kutusunu okundu işaretler.

## 2. Sunucu işlevini yayınla (proje sahibinin bilgisayarında)

**Cloud Functions için Blaze faturalandırma planı gerekir; kullanım ücreti oluşabilir.** Önce Google Cloud bütçe uyarıları tanımla. Bu adım bir faturalandırma değişikliğidir; yalnızca proje sahibi onaylayıp yapmalıdır. Functions/Eventarc/Cloud Run/Cloud Build/Artifact Registry ve FCM API’lerinin etkinleştirilmesi veya IAM izinleri istenebilir.

Node.js 22 ve proje sahibi/yetkili Google hesabıyla:

```sh
npm install -g firebase-tools@15.34.2
firebase login
# Bu deponun kök dizininde:
npm ci --prefix functions
npm --prefix functions test
firebase deploy --only firestore:rules,functions:community --project blockgame-46ae9
```

Oturum açmayı kendi tarayıcında tamamla. Parola, servis hesabı JSON dosyası veya erişim anahtarını sohbet içine ya da Git deposuna koyma. Bu projede `.firebaserc` ve `firebase.json` hazırdır. İstemci APK’sı Admin SDK anahtarı kullanmaz.

İşlev Node 22, 2. nesil, `europe-west1`, en fazla 5 instance ile çalışır. Firestore `(default)` veritabanında `communityLikes/{day}/players/{targetUid}/likes/{fromUid}` oluşturulmasını dinler. Adı istemcinin gönderdiği metinden değil Firebase Authentication’dan alır. İlgili skorun sahibi ve İstanbul günü sunucuda da kontrol edilir.

Firebase Console → Functions bölümünde `notifyCommunityLike` işlevinin etkin olduğunu kontrol et. Google Cloud → APIs & Services bölümünde **Firebase Cloud Messaging API (V1)** etkin olmalı; işlevin çalışma servis hesabının FCM gönderim yetkisi bulunmalı. İzin hatası varsa tüm kullanıcılara açık erişim verme; ilgili çalışma servis hesabının IAM yetkisini düzelt.

**Yayın öncesinde oluşturulmuş beğeniler geriye dönük bildirim üretmez.** Yayın sonrasında yeni bir beğeniyle dene.

## 3. İki gerçek hesap/telefonla teslimat testi

1. Her iki telefona yeni APK’yı mevcut uygulamanın üzerine yükle, güncel metinleri kabul et ve farklı Google hesaplarıyla giriş yap.
2. Alıcı Profil → **Beğeni bildirimleri** tercihini açsın ve Android iznini versin. “Yeni Firestore kuralları yayınlanmalı” hatası almamalı.
3. Alıcı en az bir bulmaca tamamlasın; Sıralama’daki gönderim durumu **sunucuya kaydedildi** desin.
4. Gönderen Topluluk → Yenile ile alıcıyı bulsun, Beğen’e dokunsun. İkinci beğeni düğmesi kapalı olmalı; başka cihazda aynı Google hesabıyla da tekrar beğenememeli.
5. Alıcının Topluluk → Sana gelen alkışlar listesinde gönderen adı görünmeli. Gelen kutusu var ama telefon bildirimi yoksa FCM/izin/pil ayarlarını ve Functions günlüklerini kontrol et.
6. Yeni bir gönderen hesapla, alıcı uygulaması arka plandayken/ekrandan kapatılmışken tekrar dene. Telefon bildirimine dokunmak Topluluk’u açmalı.
7. Profil → Alıştırma zamanı’nı aç; yaklaşık 3 saat sonra **Yap** düğmesi mevcut aşamayı açmalı. İlk açılış, güncelleme veya koşul ekranı varsa önce onları tamamla. Kapatınca bu sekiz zaman planı iptal edilir.
8. Telefonu yeniden başlatma, bildirim iznini reddetme, tercihi kapatma, Google hesabından çıkma ve farklı hesaba giriş senaryolarını da dene.

Android’in **Zorla durdur** işlemi, Doze/pil tasarrufu, üretici kısıtlamaları, kapalı telefon veya bağlantısızlık bildirimleri engelleyebilir/geciktirebilir. APK derlemesi ve tarayıcı testi gerçek Android teslimatının kanıtı değildir. Bu çalışmada fiziksel telefon üzerinde 3 saat bekleme / FCM uçtan uca teslimat testi yapılmadı.

## İşleyiş ve sınırlar

- Hatırlatmalar açıldığı cihazın yerel saatine göre sekiz günlük saat/dakika diliminde, üçer saat aralıklı planlanır; gece dahil. Kesin alarm ayrıcalığı istenmez. Android 12+ gerekirse inexact alarm kullanır. Pil kısıtlamalarında kesin 3 saat garantisi yoktur.
- Seri İstanbul takvimine göre sayılır: aynı gün birden çok tamamlama seriyi yükseltmez, bugünkü sayıyı yükseltir; bir takvim günü boş geçerse seri sıfırlanır. Tamamlanmış bulmacayı tekrar bitirmek alıştırmadır; yeniden altın kazandırmaz.
- Topluluk bugün sunucudaki tüm `wordScores` kayıtlarını 500’lük sayfalarla okur, UID başına birleştirir ve en son etkin 20 kişiyi gösterir. Her kişinin beğenileri ayrıca okunur. Büyük veri hacminde okuma maliyeti artar; sunucu tarafı günlük sayaçlar sonraki ölçeklendirme adımıdır. Okuma zaman aşımında kısmi sayılar doğruymuş gibi gösterilmez. Gün değişince Yenile’ye dokun.
- Skorlar kullanıcı istemcisinden bildirilir; hileye dayanıklı oyun doğrulaması henüz yoktur. Tek beğeni sınırı hesaba göredir; çoklu hesap kötüye kullanımını tamamen engellemez.
- Gelen kutusu deterministik ID ile oluşturulur; trigger tekrar çalışırsa ikinci kayıt/bildirim gönderilmez. FCM **best effort**: kayıt oluşturulduktan sonraki süreç çökmesi veya geçici FCM hatası telefon bildirimini kaybettirebilir; gelen kutusu kalır. Tam teslimat garantisi veya sınırsız yeniden gönderme yoktur.
- Bildirim tercihi kapatıldığında/çıkışta native FCM kaydı iptal edilmeye ve özel cihaz kaydı silinmeye çalışılır. Çevrimdışı sunucu temizliği gecikebilir. Geçersiz belirteçler gönderimde temizlenir. Eski gelen kutusu/skor/beğeni kayıtları otomatik silinmez; destek talepleri ayrıca işlenmelidir.
- Bildirim metni kilit ekranında görünebilir. Kullanıcı Android gizlilik ayarlarından önizlemeyi kapatabilir. Güncellenen metinler `src/legal.js` içindedir; yayıncı hukuk/gizlilik değerlendirmesi yapmalıdır.

## Yerel/CI testleri

```sh
npm ci
npm test
npm ci --prefix functions
npm --prefix functions run check
# Java 21 gerekir. Tamamen demo projesi; canlı Firebase verisine dokunmaz:
npx --yes firebase-tools@15.34.2 emulators:exec --only firestore --project demo-kelime-seyyahi "npm run test:rules"
npm run android:sync
```

Normal `npm test` emulator yoksa kurallar testini atlar. Android CI ayrıca emulator üzerinde kurallar testini çalıştırır ve başarısızsa APK yayınlamaz. CI **Firebase deploy çalıştırmaz**.
