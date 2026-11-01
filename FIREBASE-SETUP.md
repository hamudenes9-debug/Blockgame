# Kelime Seyyahı 1.8.0 — Google hesabına bağlı bulut kaydı ve ücretsiz beğeniler

## Güncel 1.11.0 — Çevrimiçi hizmetlerin kurulumu

[**LIVE-SETUP.md**](LIVE-SETUP.md): Anonymous sağlayıcıyı etkinleştir, yeni `firestore.rules` (şema 5) yayımla, GitHub Actions yönetici secret’ını güvenle tanımla ve `operations/current` ayarını yayımla. Kod/derleme bu üretim adımlarını senin adına tamamlamaz. Kurulum yoksa normal oyun çevrimdışı devam eder; çevrimiçi hizmetler kullanılamaz. [Premium verme rehberi](PREMIUM-GUIDE.md).


## Önceki 1.9.0 — Kuralların yeniden yayımlanması gerekiyor

Özel kayıt şeması 3 oldu: 124 aşama, görev takvimi ve yeni avatar seçenekleri. **Bu sürümün `firestore.rules` dosyasının tamamını Firestore → Rules → Publish ile yayımla; tüm cihazları 1.9.0’a yükselt.** Eski şema 2 yazımları yeni kurallarda reddedilir. Firebase Authentication sağlayıcılarında değişiklik yok. Ayrıntılı güvenli geçiş: [MONTH-UPDATE.md](MONTH-UPDATE.md). Aşağıdaki eski sürüm notları tarihsel kurulum bilgisidir.


## 1.8.1 — Google’a ek GitHub girişi

GitHub ile giriş eklendi. Kurulum, callback adresi, açığa çıkan secret’ın iptali ve hesapların otomatik birleşmediği uyarısı: **[GITHUB-LOGIN.md](GITHUB-LOGIN.md)**. Bu değişiklik Firestore kurallarını değiştirmiyor; 1.8.0 kuralları yeterli. Eski Google ilerlemeni Google ile açmaya devam et. GitHub sağlayıcısı Firebase Console’da ayrıca etkinleştirilmeli.


**Blaze, ödeme yöntemi, Cloud Functions veya FCM sunucusu gerekmez. Firebase planını yükseltme.**

## 1.8.0 için önemli: kupa, prestij ve avatar

**Bu sürüm için `firestore.rules` dosyasının tamamını yeniden yayınla.** `playerSaves` artık şema sürümü 2’dir; 64 aşama, kupa hakları, prestij ve avatar saklanır. Yeni `trophyPlayers` koleksiyonu herkese açık kupa/prestij sıralamasıdır. Yalnızca kendi UID’sine yazılabilir; kamuya açık kupa/avatardaki değerler aynı transaction’daki özel oyun kaydıyla eşleşmek zorundadır. İlave composite index veya ücretli sunucu gerekmez.

1. Firebase → Firestore Database → Rules: bu sürümdeki **tam dosyayı** yayınla. Başka uygulamalara ait kuralları koru; hiçbir koleksiyonu silme.
2. **Bütün cihazlarda 1.8.0 sürümünü kullan.** Eski sürümler şema 1 yazdığı için yeni kurallar eski istemcilerin bulut yazmasını reddeder. Bu, kupaların eski bir istemci tarafından silinmesini önler.
3. Önce mevcut ilerlemenin bulunduğu cihazda güncelle. Metinleri ve “Puan sistemi değişti” ekranını **Tamam** ile kapat. Profil → Şimdi eşitle ile sunucu onayını gör.
4. Sonra diğer cihazlarda aynı Google hesabıyla devam et. Birden fazla cihazın bekleyen değişiklikleri varsa kayıt seçimini dikkatle yap.

### Yeni ekonomi

- Eski puanlar **aktif oyun ve yeni sıralamada sıfırlanır**, kupaya çevrilmez. Eski Firebase `wordScores`/`scores` belgeleri ve yerel yedekler fiziksel olarak topluca silinmedi; arşivdir ve yeni sıralamaya katılmaz. Bu ortamda canlı yönetici erişimiyle veri silme yapılmadı.
- Eski aşamalar, altın ve ipuçları korunur. Önceden tamamlanmış aşamalar yeniden oynanarak yeni kupa sistemindeki ilk 20 kupası alınabilir. Yeniden altın verilmez.
- Her aşama ID’si için **bir kez 20 kupa**. Bonus kelimeler ve tekrar tamamlama ekstra kupa vermez.
- 1000 kupada Prestij sekmesi açılır. Onayla **1000 kupa harca → prestij +1**; kalan kupa ve aşamalar korunur. Prestij sekmesi sonradan kupa 1000’in altına inse de açık kalır. Prestijler kırmızı gösterilir. Kupa hakları prestijle sıfırlanmaz.
- 64 aşama × 20 = toplam 1280 kupa: bu içerikle en fazla bir prestij ve 280 kalan kupa mümkündür. Daha yüksek prestij için ileride yeni aşamalar gerekir; döngüsel/sınırsız kupa yoktur.
- Dünya listesi `trophyPlayers` üzerinden en yüksek 20 kupayı; Prestij listesi prestij seviyesi pozitif en yüksek 20 hesabı okur. “Bu cihaz” rekor sekmesi kaldırıldı.
- Ad, UID, kupa, prestij ve seçilen avatar parçaları sıralamada herkese açıktır. Avatar beş kategoride dörder seçenektir: saç, kıyafet, göz, yüz ifadesi, şapka. Her değişiklik cihazda saklanır ve hesap eşitlemesine dahil olur.
- Kupa hakkı ve bulmaca tamamlama istemci bildirimidir; sunucuda bulmaca tekrar oynatılarak doğrulanmaz. Sürüm denetimi kayıt çakışmalarını önler, hileye dayanıklı oyun otoritesi değildir.
- Topluluk sayacı için yeni tamamlamalar eski uyumluluk koleksiyonuna `score: 0` ile kaydedilir; bu alan artık puan kazanımı değildir. Beğeniler ve Spark yöntemi korunur.
- Bilgilendirme ekranı bu cihazda Google UID/misafir başına bir kez gösterilir. Uygulama verileri silinirse veya başka cihazda ilk kez açılırsa yeniden gösterilir.

## Önceki bulut kaydı kurulumunun genel bilgileri (1.8.0’a da uygulanır)

## Yapılacaklar

1. 1.8.0 APK’sını mevcut uygulamanın üzerine yükle; uygulamayı silme.
2. Google ile giriş yap ve güncellenen gizlilik metnini incele.
3. **Yeni `playerSaves` kuralı gerekli:** Firestore Database → Rules bölümüne bu sürümün `firestore.rules` dosyasının tamamını koy ve Publish seç. Eski beğeni kuralları tek başına bulut oyun kaydına izin vermez. Başka uygulamalara ait kuralları koru; verileri/koleksiyonları silme.
4. **Topluluk → Sana gelen alkışlar** bölümünü aç. Mevcut beğeni kayıtları doğrudan okunur; önceden yapılmış beğeniler de aşağıdaki tarih sınırı içinde görünür.

## Aynı Google hesabıyla farklı cihazda devam etme

1. **Önce ilerlemenin bulunduğu eski cihazı güncelle.** O cihazda doğru Google hesabının açık olduğunu kontrol et. İlk yükseltmede mevcut cihaz ilerlemesi açık olan hesaba bağlanır ve `seyyah-before-account-sync` yerel yedeği alınır. Eski yerel kayıtlar hesaplar arasında ortak olduğu için bu ilk hesabı dikkatle seç.
2. Yeni Firestore kurallarını yayınla; uygulamadaki yeni metni kabul et.
3. Profil → Google bulut kaydı → **Şimdi eşitle**. “Google hesabına kaydedildi” veya “kaydın güncel” durumunu görmeden diğer cihaza geçme / eski uygulamayı kaldırma.
4. Diğer cihazda 1.8.0 sürümünü aç, **aynı Google hesabıyla giriş yap** ve geri yüklemenin bitmesini bekle.
5. Aşama, yarım bulmacanın bulunan kelimeleri, altın, ipuçları, günlük seri ve yerel en iyi 100 kelime kaydı geri gelir. Profildeki kupa bakiyesi bu kayıtlarla aynı olur. Sıralama artık trophyPlayers kullanır; eski wordScores puanları sıralamaya dahil edilmez.

Google oturumu mevcut Firebase mekanizmasıyla cihazda korunur; yeni cihazda yine Google hesabına giriş yapmak gerekir. Hesaplar ve misafir oyunları artık ayrı cihaz önbellekleri kullanır. Yeni bir Google hesabına misafir ilerlemesi otomatik aktarılmaz; misafir kaydı cihazda korunur. Çıkış yapmak kayıtları silmez.

Oyun değişiklikleri anında hesap önbelleğine yazılır, son değişiklikten yaklaşık 5 saniye sonra bulut eşitlemesi denenir. Uygulamayı çok hızlı kapatırsan son değişiklikler yalnızca cihazda kalabilir; cihaz değiştirmeden önce Profil’den Şimdi eşitle seç. Çevrimdışı değişiklikler sonraki eşitlemeye kadar cihazda bekler. Uygulama açılışı/giriş ve manuel eşitleme bulut kaydını kontrol eder; başka cihazdaki değişiklikler açık oyuna zorla yüklenmez.

**İki cihazda aynı anda ilerleme olursa:** son kaydın üzerine sessizce yazılmaz. Profil’de cihaz/bulut aşamaları ve kupa bakiyeleri gösterilir. “Buluttaki kayıttan devam et” veya “Bu cihazdaki kaydı buluta aktar” seçimini onayla. Seçim **cüzdan dahil bütün oyun kaydı** içindir; altınlar/puanlar toplanmaz. Sürüm kontrolü seçim anında tekrar yapılır. Seçim öncesi yerel yedek ve üzerine yazılacak bulut kaydının yerel kopyası saklanır; bunlar uygulama verisi silinirse kaybolur. Ayrı geçmiş sürüm listesi/otomatik geri alma arayüzü yoktur.

Sunucuda yalnızca hesap sahibi `playerSaves/{uid}` kaydını okuyup yazabilir. Yazma kimliği, zaman aşımı sonrası aynı kaydın tekrar gönderilmesini ayırt eder; sürüm numarası eski cihazın yeni kaydı ezmesini önler. Oyun değerleri istemciden geldiği için bu bir hile önleme sistemi değildir. Firebase Admin/proje sahibi erişimi mümkündür. Otomatik silme yoktur; veri silme talepleri destek üzerinden ele alınmalıdır.

Her eşitleme Firestore okuma/yazma kotasından kullanır. Blaze gerekmez; Spark kotaları dolarsa cihazda oyun devam eder ama bulut eşitlemesi bekler. Bu çalışma canlı projeye kural yayınlamaz; kuralları proje sahibi konsoldan yayınlamalıdır.

## Neler çalışır?

- Günlük seri bulut oyun kaydına dahildir; yaklaşık üç saatlik **Yap** eylemli yerel Android hatırlatmaları değişmedi. Hatırlatma izni/tercihi cihaz başına ayrıdır. Hatırlatmaları Profil’den açabilirsin; Android bildirim izni gerekir. Pil kısıtlamaları teslimatı geciktirebilir.
- Toplulukta gerçek, sunucuya kaydedilmiş günlük alıştırma sayıları ve hesap başına tek beğeni korunur.
- **Son 7 İstanbul takvim gününün, gün başına en yeni 30 beğenisi** gösterilir. Topluluk ekranı açıkken Firestore dinleyicileri listeyi günceller; ekran kapatılınca dinleyiciler kaldırılır. Kota tasarrufu için diğer ekranlarda beğeni dinlenmez.
- Gönderen adı `wordScores` içindeki o UID’ye ait bir skor kaydından okunur. Bu ad en güncel Google adı olmak zorunda değildir ve sunucuda kimlik doğrulaması yapılmış bir ad değildir. Skor kaydı yoksa/okunamazsa **“Bir seyyah seni beğendi.”** gösterilir; isim uydurulmaz.
- İlk açılışta geçmiş beğeniler listelenir; ekran açıkken sonradan gelen yeni beğeni ayrıca kısa mesaj olarak gösterilir. İnternet yokken önbellek görünebilir; sunucu bağlantısı güncel liste için gereklidir.
- Okundu işareti yalnızca bu cihazda, Google UID’sine özel saklanır. Başka cihazlara eşitlenmez; uygulama verileri silinirse sıfırlanır.
- Gün değişince açık ekranın beğeni tarih aralığı en geç bir dakika içinde yenilenir. Günlük etkinlik listesini Yenile ile güncelleyebilirsin.

## Sınırlar ve maliyet

**Uygulama kapalıyken beğeni için telefon bildirimi gelmez.** Uygulamayı açıp Topluluk’a girince listeyi görürsün. Bu, yerel alıştırma hatırlatmalarını etkilemez.

Spark’ın ücretsiz okuma/yazma ve bağlantı kotaları geçerlidir; sınırsız kullanım sözü değildir. Kota dolarsa çevrimiçi özellikler geçici olarak çalışmayabilir. Beğeni kutusu en fazla 7 × 30 kayıt okur; isim çözümleme için her benzersiz gönderene ekran oturumu başına ek bir skor sorgusu yapılır. Mevcut günlük etkinlik listesi ve dünya sıralaması da ayrı okumalar kullanır. Çok büyük veri için sunucu tarafı sayaçlar veya daha dar tarih aralığı gerekebilir.

Bu sürüm yeni FCM belirteci kaydetmez. Önceki sürümden açık bir bildirim tercihi varsa native kayıt iptal edilmeye ve eski özel cihaz kaydı silinmeye çalışılır; bağlantı yoksa sonraki açılışta tekrar denenir. Yerel alıştırma tercihi korunur.

`functions/` dizinindeki kod önceki, isteğe bağlı ücretli altyapı seçeneğinin arşividir. **Ücretsiz yöntem için onu yayınlama.** `firebase.json` artık Functions dağıtımı tanımlamaz. Sunucuda önceki özel gelen kutusu varsa bu sürüm onu kullanmaz; eski verileri otomatik silmez.

## Deneme

1. Farklı Google hesaplarıyla iki cihazda oturum aç.
2. Alıcı bir bulmaca tamamlasın; skorun sunucuya kaydedildiğini doğrula.
3. Gönderen Topluluk → Yenile ile alıcıyı bulup beğensin.
4. Alıcı Topluluk’u açınca beğeniyi görmeli. İki tarafta ekran açıkken yeni bir beğeni geldiğinde liste güncellenmeli.
5. Okundu’ya dokun; ekrandan çıkıp geri girince bu cihazda işaret korunmalı.
6. Gönderenin hiç çevrimiçi skor kaydı yoksa isim yerine “Bir seyyah” görünmesi normaldir.

## Geliştirici doğrulaması

```sh
npm ci
npm test
# Java 21 gerekir; yalnızca demo projesi kullanılır:
npx --yes firebase-tools@15.34.2 emulators:exec --only firestore --project demo-kelime-seyyahi "npm run test:rules"
npm run android:sync
```

CI Firebase’e dağıtım yapmaz ve ücretli plan açmaz. Canlı hesaplarla teslimat ayrıca iki cihazda denenmelidir.

## 1.8.2 — Yahoo

Yahoo sağlayıcısı için [YAHOO-LOGIN.md](YAHOO-LOGIN.md) belgesine bak. Firebase’de eklediğin sağlayıcının etkin/kaydedilmiş olması ve Yahoo callback adresinin Firebase’dekiyle eşleşmesi gerekir. Client secret uygulamaya eklenmez. Mevcut Google/GitHub sağlayıcılarını açık bırak.
