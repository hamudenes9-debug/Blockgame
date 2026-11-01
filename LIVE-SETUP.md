# 1.11.1 — Premium v2 ve çevrimiçi hizmetlerin kurulumu

**1.10.1 normal oyun için zorunlu interneti kaldırır. Sunucu kurulumu yoksa veya bağlantı kesilirse normal bölümler oynanır, ilerleme cihazda saklanır. Bulut eşitleme, Premium doğrulaması ve güvenli görev/bayram ödülleri ise çevrimiçi doğrulama ister.** Bu çalışma sırasında üretim Firestore kuralları, Firebase sağlayıcıları, yönetici secret veya gerçek kullanıcının Premium kaydı değiştirilmedi. Kod/test/APK hazırlamak canlı sisteme yönetici erişimi vermez.

## 1. Mevcut kayıtları koru

Eski sürümde mümkünse son kez Profil → Şimdi eşitle. Uygulamayı kaldırma/verilerini silme. Eski kayıtlar şema 4’e geçer; 124 bölüm, altın, standart kupa, prestij, avatar ve alınmış görev ödülleri korunur. Eski şema 3’ün henüz eşitlenmemiş ödülleri ilk geçişte bir kez eski veri olarak kabul edilir; bunlar geçmiş oynanışın sunucuda kanıtlandığı anlamına gelmez.

## 2. Firebase Authentication

`blockgame-46ae9` → Authentication → Sign-in method → **Anonymous / Anonim** sağlayıcısını etkinleştir. Google/GitHub/Yahoo sağlayıcılarını açık bırak. Misafir için bile erişim kontrolü ve güvenli ödül kaydı anonim Firebase oturumu gerektirir. Misafir kimliği cihaz oturumuna bağlıdır, hesap girişinin yerine kalıcı kurtarma yöntemi değildir.

## 3. Firestore kuralları

Bu sürümün `firestore.rules` dosyasının TAM içeriğini Firestore Database → Rules → **Publish** ile yayımla. Şema 5 yayımlandığında eski şema 3/4 yazımları reddedilir. Tüm cihazları 1.11.1’a yükselt. Normal oyun çevrimdışı kalır; çevrimiçi hizmetler için aşağıdaki canlı ayarı yayımla.

`premium`, `operations/current`, `journeyClocks`, `questRewards` ve `festivalRewards` için istemcide yönetici anahtarı yoktur. Premium/operasyon yazımları istemciye kapalı, kullanıcı özel okumaları UID ile sınırlıdır. Ödül belgeleri sunucu zamanı ile değişmez olarak oluşturulur.

## 4. Ücretsiz canlı yayıncı — GitHub Actions + Firebase Admin

Yeni ücretli sunucu/Blaze/Cloud Functions gerekmez. Firebase Cloud Messaging ile **özel yönetici göndericisi** GitHub Actions üzerinde çalışır. Herkese açık depo için GitHub Actions’ın geçerli ücretsiz kullanım koşulları ve Firebase Spark kotaları geçerlidir; sınırsız kullanım sözü verilmez.

1. Firebase / Google Cloud projesinde yalnızca bu iş için bir servis hesabı oluştur. Firestore veri okuma-yazma ve Firebase Cloud Messaging gönderimi için gereken en az yetkileri ver (ör. `roles/datastore.user`, `roles/firebasecloudmessaging.admin`). İsteğe bağlı Premium komutunun Auth kullanıcı sorgusu için ayrıca Firebase Authentication görüntüleme yetkisi gerekir; yayıncı bu Auth yetkisine ihtiyaç duymaz. Owner rolü vermek gerekmez.
2. Firebase Cloud Messaging API (V1) projenin API’lerinde etkin olsun. Servis hesabının JSON anahtarını güvenli biçimde al.
3. GitHub → depo → Settings → Secrets and variables → Actions → **New repository secret**:
   - Ad: **`FIREBASE_ADMIN_SERVICE_ACCOUNT`**
   - Değer: o servis hesabının JSON içeriği.
4. **Anahtarı sohbete, ekran görüntüsüne, APK’ya veya Git dosyasına koyma.** Yönetici erişimi verir. GitHub/Google hesaplarında iki aşamalı doğrulama veya geçiş anahtarı kullan; anahtar sızarsa iptal et/değiştir.
5. Canlı kaynak dosyası bu dalda `operations/live.json`: `arena/d699cecb-blockgame`. Dosyada bir ayarı düzenleyip bu dala commit et. `Live announcements and holiday calendar` workflow’u çalışır. `operations/current` belgesini Firestore’da oluşturduğunu doğrula. Anahtar yoksa workflow açıkça **kurulum bekliyor / YAYIMLANMADI** yazar; yeşil job tek başına canlı yayın kanıtı değildir.
6. **GitHub zamanlanmış workflow’ları yalnızca varsayılan dalda çalıştırır.** Yarım saatlik otomatik kontrol ve gelecek yılların takvim güncellemesi için `operations.yml` workflow’unun varsayılan dala da alınması gerekir. Bu oturumda varsayılan dala merge yapılmadı. Bu tamamlanana kadar çalışma dalına config push’u ile yayın yapılır; cron ile gelecekte kendiliğinden çalışacağı varsayılmamalıdır. Workflow canlı kaynağı açıkça bu çalışma dalından checkout eder; bu dalı silme veya ref’i kontrollü güncelle.

Yetkili yayıncı aktif duyuru/bayram için FCM’ye gönderir; telefonun izin, pil, ağ ve FCM koşulları teslimatı etkiler. Push’un fiziksel cihazda canlı teslimatı bu ortamda doğrulanmadı. Yarım saatlik tarama tam başlangıç saniyesinde bildirim garantisi değildir. Doğrulanmış tarihler uygulamada/sunucuda zamanına göre etkinleşir; push gecikebilir.

### Duyuru yayımlama

`operations/live.json` içindeki `announcements` listesine örneğin aşağıdaki biçimde bir kayıt ekle; tarihleri gerçek yayın dönemine göre değiştir:

```json
{
  "id": "yeni-yolculuk-01",
  "title": "Yeni bir keşif zamanı",
  "body": "Seyyah postasında yeni haberler var.",
  "startsAt": "2026-11-05T09:00:00+03:00",
  "endsAt": "2026-11-12T23:59:59+03:00",
  "url": "https://github.com/hamudenes9-debug/Blockgame/releases/latest"
}
```

Her yeni duyuru için farklı `id` kullan. Aynı ID güncellenirse yeniden push gönderilmez. Kapatılan duyuru aynı cihazda tekrar açılmaz; yayınlanmış geçmiş duyurular listede arşiv olarak görünür. En fazla 30 kayıt; bağlantılar HTTPS ve izinli GitHub/Diyanet alan adlarıyla sınırlı. HTML çalıştırılmaz. Başlangıç ve bitiş açık saat dilimiyle yazılmalı.

Gönderici `notificationDeliveries/{id}` kaydını göndermeden önce ayırır; belirsiz/hatalı gönderimi körlemesine tekrar etmez. Bu tekrar/spamı azaltır fakat başarısız teslimatı garantiyle telafi etmez. Gerekirse yeni ID ile açık bir düzeltme duyurusu yayımla. Token’lar/loglar herkese açık değildir; konsol çıktısı yalnızca toplu sayaç içerir.

### Bakım / minimum sürüm

- `maintenance.enabled`: `true` / `false`.
- `maintenance.message`: ekranda görünen açıklama.
- `maintenance.until`: isteğe bağlı tahmini bitiş metni; otomatik kapatma değildir.
- `minimumVersion`: uygulama kapısı için semantik sürüm (bu sürüm `1.11.1`).
- `minimumSchema`: sunucunun kabul ettiği protokol. Bu sürüm `4`; daha yeni şema değerine çıkarmak bu sürümün sunucu işlemlerini engeller. Uyumlu yeni istemci olmadan artırma.

Ayarlar uygulamada yaklaşık 60 saniyede bir sunucudan okunur; 120 saniyeyi aşan/başarısız kontrol oynanışı bekletir. GitHub Actions kuyruğu ve ağ nedeniyle anında küresel değişiklik sözü yoktur.

**221015** yalnızca istemcinin bakım ekranını geçer. Kamuya açık APK’dan bulunabilir; yönetici yetkisi, ban kaldırma, Premium veya minimum sürüm geçişi vermez. Bakım ekranı istemci kapısıdır, Firestore’u yönetici bakımına kapatan bir güvenlik yetkisi değildir.

## 5. Bayram takvimi

Yayıncı günde bir kez Diyanet’in mevcut ve sonraki yıl takvimini okumayı dener. Üç Ramazan + dört Kurban gününün tamamı, yıl ve ardışıklık doğrulanmadan yeni yıl eklenmez. Arife dışarıda bırakılır; süreler Türkiye saatiyle gün başlangıcından son gün bitimine kadardır. Doğrulanmış takvim önbellekte korunur; kaynak değişir/yeni yıl henüz yayımlanmazsa tarih tahmin edilmez. Workflow çıktısındaki “doğrulanamadı” uyarısını takip et.

2026 çekirdek tarihleri resmi kaynaktan doğrulandı: https://vakithesaplama.diyanet.gov.tr/dinigunler.php?yil=2026 . 2027 sayfası bu çalışma sırasında doğrulanabilir tablo vermedi; tahmini 2027 tarihi eklenmedi. Cron kurulumundan sonra resmi tablo yayımlandığında otomatik alınır. `holidaysEnabled: false` ile etkinliği kapatabilirsin.

**Hesapla oynayanlarda** ilk tamamlamaya standart 20 + sunucu onaylı 20 ek kupa. Tekrar oynama, eski tamamlanan aşamayı bayramda tekrar bitirme veya prestij yeni bonus hakkı açmaz. Misafir standart kupa almaya devam eder; sunucu kayıtlı bayram ek kupası için Google/GitHub/Yahoo girişi gerekir. Bayram bonusu ilk kayıt tamamlanana kadar bekleyen ödül olarak gösterilir; etkinlik kapanırsa onaylanmayan bonus kaldırılır, standart ilerleme korunur. Onaylanmış bonuslar kalıcıdır ve prestije katılır.

## 6. Saat, hesap ve güvenlik sınırları

- Ön planda yaklaşık 5 saniyede bir `getIdTokenResult(..., true)` ile Firebase’den yeni imzalı oturum doğrulanır. Telefonun `Date.now()` değeri oyun ödül zamanının otoritesi değildir; Firebase token’ının sunucu çıkış zamanı + monoton geçen süre kullanılır. Ödül kuralları asıl karar için `request.time` kullanır.
- Engelli kullanıcı hatasında oturum kapatılır. Diğer bağlantı/kurulum/kota hatası ban gibi gösterilmez. Ağ ve Firebase yayılımı nedeniyle kesin 5 saniye garantisi yoktur.
- Özel sunucu işlemleri en fazla 15 saniye önce üretilmiş Firebase token’ı ister. Firebase’den devre dışı bırakılmış hesap yeni token alamaz; mevcut token’ın kalan kısa penceresi ve servis yayılımı nedeniyle engel tam anlık değildir. Bu hesap engelidir, cihaz/IP engeli değildir.
- Eski APK’nın çevrimdışı kodu uzaktan kapatılamaz. Yeni kurallar eski şema yazımlarını reddeder; yeni sürüm minimum sürüm kapısını uygular. Sürüm numarası/bakım kodu tek başına değiştirilmiş APK kanıtı değildir. App Check veya sunucu otoriteli tüm bulmaca motoru bu pakette yoktur.
- Görev başlangıç belgesi değişmez; ödül günü sunucu zamanından denetlenir. UID/gün ödül belgesi yalnızca bir kez oluşturulur; cüzdan artışı aynı işlemde doğrulanır. İki cihazdan tekrar ödül mint edilmez. Başlangıç/görev verilerini elle değiştirmek bu tarih kontrolünü aşmaz.
- Eski sunucu kayıtları bir kerelik geçişte korunur. Eski yerel misafir takviminin geçmişi kanıtlanamaz; güvenli sunucu başlangıcı yenilenebilir, daha önce alınmış yerel ödül işaretleri korunur. Yeni sunucu ödemesi belirsiz kalırsa misafir için kayıt kurtarma onayı ve yerel yedek vardır.
- **Tam anti-cheat değildir:** mevcut bölüm çözümü, normal altın/ilerleme ve eski kayıt ithali hâlâ istemci bildirimine dayanır. Bu değişiklik bütün sahte istemci cüzdanlarını doğruladığını iddia etmez; yeni görev ödeme işlemi, zaman, sahiplik ve tek seferlik bayram/ödül makbuzlarını korur. Misafir verileri kalıcı giriş hesabının yerini tutmaz.
- 5 saniyelik yenileme aktif oyuncu başına saatte yaklaşık 720 Auth isteği demektir. Canlı ayar ve Premium okumaları yaklaşık dakikalıktır; Firestore/Spark ve Auth kotalarını izle. Kotaya ulaşıldığında çevrimiçi hizmetler bekler; normal oyun durdurulmaz. Ücretli plana otomatik geçiş yoktur; yoğunluk için kontrol sıklığı/altyapı yeniden değerlendirilmelidir.

## 7. Premium ve fiziksel doğrulama

Premium verme/kapatma/uzatma: **[PREMIUM-GUIDE.md](PREMIUM-GUIDE.md)**.

Canlıya almadan önce fiziksel Android cihazında: yeni kurulum + anonim kontrol; Google/GitHub/Yahoo oturumu; internet kesme/geri gelme; Firebase Disable account; maintenance kodu; minimum sürüm; Premium grant/expiry/revoke; ipucusuz görev; aynı ödülü iki cihazdan alma; FCM uygulama açık/kapalı/tıklama ve izin reddi senaryolarını kontrol et. Yerel taklitli UI ve Firestore emülatörü, üretim OAuth/FCM veya gerçek ödeme doğrulamasının kanıtı değildir.

### Kural değerlendirme sınırı
Yayımlayıcı `operations/current.levelIds` alanını sabit 1–124 listesi olarak üretir. Kurallar bölüm kimliklerini bu yalnızca yöneticinin yazabildiği listeyle doğrular; uzun liste sabitlerini her atomik işlemde yeniden değerlendirerek Firestore’un 1.000 ifade sınırını aşmaz. Bu alanı elle silmeyin/değiştirmeyin; eksikse yayım işini yeniden çalıştırın.

### APK’yı oyunculara açma
Yeni APK sürümleri önce GitHub **Pre-release** olarak oluşturulur. Bu sırada `/releases/latest` üzerinden güncelleme kontrolü yapan mevcut oyunculara zorlanmaz. Yukarıdaki canlı kurulum ve fiziksel cihaz kontrol listesi tamamlanınca sürümün GitHub düzenleme ekranında **Pre-release** işaretini kaldırıp **Latest release** olarak işaretleyin. Yönetici CLI karşılığı: `gh release edit v1.10.0 --prerelease=false --latest`. Bu işlem bu güncelleme sırasında yapılmadı.

Aynı sürüm numarasıyla tekrar derleme mevcut APK’yı değiştirmez: CI test/derleme çıktısını artifact olarak saklar, yeni release yayımlamadan geçer. Uygulama kodu değişikliklerini dağıtmak için sürüm numarasını artırın.

### 1.10.1 çevrimdışı davranışı
Eksik/erişilemeyen canlı ayar veya eski oturum zaman bilgisi normal oyunu kilitlemez. Oynanış için yerel tarih kullanılabilir; görev ödülünün sunucu zamanı ve tek-seferlik makbuz kontrolü gevşetilmedi. Çevrimdışı bölüm tamamlamaları standart 20 kupa verir, bayram ek kupası sonradan otomatik eklenmez. Premium çevrimdışı doğrulanamıyorsa normal ipucu envanteri kullanılır. Doğrulanmış hesap engeli hâlâ uygulanır; bakım/minimum sürüm kontrolleri yalnızca güncel çevrimiçi ayarlarla uygulanır. Bulut çakışması yerel oyunu durdurmaz; kayıtları eşitlemeden cihaz değiştirmeyin veya uygulamayı silmeyin.

## 1.11.1 yükseltmesi — mevcut kurulum için

1. Önce imzalı 1.11.1 APK’yı uygulamayı silmeden kur.
2. Firebase sahibi olarak Google Cloud Shell’de, yayımlanmış `v1.11.1` etiketindeki `admin-tools/upgrade-premium-v2.py` dosyasını çalıştır. Script kaynak kuralları aynı etiketten indirir, Firebase Rules API ile derleyip yayımlar. Ardından yalnızca `operations/current` içindeki minimum sürüm/şema, bölüm kimliği listesi ve duyuruları günceller. Başka kullanıcılara açık kurallar yazmaz, Premium sürelerini/bakiyeleri/bakım ve bayram ayarlarını değiştirmez.
3. Script önce Cloud Shell ana klasörüne izinleri 0600 olan eski kural sürümü/ayar yedeği kaydeder. Kısmi hata çıkarsa çıktıyı kontrol et; yalnızca son adım eksik kalmış olabilir. Tekrar çalıştırmak ödül veya Premium süresi eklemez. Daha yeni şema varsa sürümü geriye çekmez.
4. Oyunda Premium durumunu yenile. Aktif Premium ile `premiumCosmetics/{uid}` kalıcı açılışı oluşturulur. Hesap eşitlendikten sonra Profil’den 12 yeni öğeyi seçebilirsin.

Script kullanıcı tarafından çalıştırılmadan üretim kuralları/ayarları değişmez. GitHub Actions yöneticisi kurulmamışsa yeşil workflow yayım kanıtı değildir. Yeni duyuru eski sınırsız harf açma reklamının yerini alır; otomatik kapalı-uygulama push göndermez. Mevcut alıcılara paket değişikliğini bildir; gerekli iade/satış yükümlülüklerini değerlendir.

Premium bölüm bonusu `premiumRewards/{uid}/levels/{level}` tek-seferlik makbuzuyla korunur. Bayramla birleşen 80 kupa aynı makbuzda `festival:true` olarak doğrulanır; ayrıca ikinci bir bayram makbuzu gerektirmez. Normal bayram bonusunda önceki `festivalRewards` makbuzu kullanılır. Başlangıç/yeniden deneme, süre sonu ve iki cihaz kontrolleri Firebase kurallarındadır. Standart altın ve bulmaca çözüm verileri hâlâ istemci bildirimidir; bu tam çözüm/cüzdan anti-cheat sistemi değildir.

Premium ilk tamamlamada doğrulanamıyorsa standart ödül verilir; çevrimdışı bitirilen eski bölümlere geriye dönük 2× eklenmez. Bonus onaylanmadan süre biter veya etkinlik kapanırsa onaysız ek ödül uzlaştırılır; standart ilerleme korunur. Kalıcı avatar hakkı ilk başarılı aktif-Premium doğrulamasında açılır; henüz açılmadan Premium süresi bittiyse sonradan otomatik hak üretilmez. Günlük görev altını ödülün alınma anındaki Premium durumuyla belirlenir, görev ipucu miktarı değişmez.
