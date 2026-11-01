# Kelime Seyyahı 1.6.1 — Ücretsiz Spark yöntemi

**Blaze, ödeme yöntemi, Cloud Functions veya FCM sunucusu gerekmez. Firebase planını yükseltme.**

## Yapılacaklar

1. 1.6.1 APK’sını mevcut uygulamanın üzerine yükle; uygulamayı silme.
2. Google ile giriş yap ve güncellenen gizlilik metnini incele.
3. 1.6.0 için verdiğimiz beğeni kurallarını zaten yayınladıysan **kuralları tekrar değiştirmen gerekmiyor**. Aynı `firestore.rules` kullanılıyor. Henüz yayınlamadıysan Firestore Database → Rules bölümüne tam dosyayı koy ve Publish seç. Başka uygulamalara ait kuralları koru; verileri/koleksiyonları silme.
4. **Topluluk → Sana gelen alkışlar** bölümünü aç. Mevcut beğeni kayıtları doğrudan okunur; önceden yapılmış beğeniler de aşağıdaki tarih sınırı içinde görünür.

## Neler çalışır?

- Günlük seri ve yaklaşık üç saatlik **Yap** eylemli yerel Android hatırlatmaları değişmedi. Hatırlatmaları Profil’den açabilirsin; Android bildirim izni gerekir. Pil kısıtlamaları teslimatı geciktirebilir.
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
