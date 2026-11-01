# 1.9.0 — Bir aylık keşif paketi

## Önemli: bulut kaydı kurulumu

Bu sürüm özel oyun kaydını **şema 3** olarak yazar. Ücretsiz Spark planı korunur; yeni ücretli sunucu/Cloud Function yoktur.

1. Eski uygulamada, mümkünse **Profil → Şimdi eşitle** ile kayıt onayını gör. Uygulama verilerini silme veya uygulamayı kaldırma.
2. Firebase Console → **blockgame-46ae9 → Firestore Database → Rules** ekranında bu sürümün `firestore.rules` dosyasının **tam içeriğini** kullanıp **Publish / Yayınla** seç. Authentication sağlayıcılarını değiştirme.
3. 1.9.0 APK’sını mevcut uygulamanın üzerine yükle. Aynı hesabı kullanan **tüm cihazları 1.9.0’a yükselt**. Yeni kurallar eski sürümlerin şema 2 yazımlarını reddeder; böylece eski bir cihaz yeni görev/124 bölüm kaydını kırparak üzerine yazamaz.
4. Aynı Google/GitHub/Yahoo hesabıyla devam et. Profil’den eşitleme durumunu kontrol et. İki cihazda farklı bekleyen kayıt varsa tüm kayıt için açık seçim sunulur; ödüller otomatik toplanıp birleştirilmez.

Kurallar bu çalışma ortamından üretim Firebase projesine yayımlanmadı; konsol adımını proje sahibi tamamlamalı. Eski kurallarda yeni sürümün bulut yazımı reddedilir; ilerleme cihazda korunur. Başarılı eşitlemeyi görmeden uygulama verilerini silme. Google/GitHub/Yahoo giriş yöntemleri arasında otomatik hesap birleştirme yapılmaz.

## Yeni içerik

| Durak | Bölümler |
| --- | --- |
| Ankara | 65–74 |
| Eskişehir | 75–84 |
| Bursa | 85–94 |
| Antalya | 95–104 |
| Trabzon | 105–114 |
| Çanakkale | 115–124 |

Toplam **124 farklı bulmaca, 16 durak**. İlk 64 bölümün kimlikleri ve kelimeleri korunur. Her şehrin ayrı yerel SVG manzarası vardır. Yeni bölümler sırayla açılır; tarih bekleme/enerji/satın alma kilidi yoktur. Eski 64. bölümü bitirmiş oyuncu 65’ten devam edebilir. Bölüm kupaları yine ilk tamamlama başına 20’dir; toplam potansiyel 2480 kupa. Prestij 1000 kupa harcar, bölüm/altın/ödül haklarını sıfırlamaz.

## 30 günlük keşif defteri

Anasayfa veya Profil’de **Keşif defteri → 30 günlük keşfe başla**.

- Her hesaba/misafire ayrı başlangıç günü. İlk görev hemen, sonraki görevler İstanbul takvimine göre her gün açılır; bu bir abonelik veya gerçek para ürünü değildir.
- Bulmaca tamamlama, tamamlanan bulmacalarda kelime bulma ve ipucusuz tamamlama olmak üzere üç görev türü. Hedefler zamanla artar.
- **Yalnızca seçili görev ilerler.** Aynı bölüm seçili görevde yalnızca bir kez sayılır. Başka bir görevde eski bölümler yeniden oynanabilir. İpucusuz görev için ipucu kullanılmış deneme sayılmaz; aynı bölümü yeni bir denemede ipucusuz bitirmek mümkündür.
- Tamamladığında **Ödülünü al** düğmesiyle 40–80 altın ve 1 ipucu; her 5. görevde 3 ipucu. Tüm 30 ödül toplamı **1700 altın ve 42 ipucu**. Görev ödülleri kupa vermez. Yeniden tıklama/yükleme aynı ödülü tekrar vermez.
- Kaçırılan açık görevler sonradan tamamlanabilir. 30. günün sonunda takvim silinmez; tüm görevler açık kalır. Görevler otomatik yenilenmez ve bir ödül dönemi oluşturur. Oynama süresi kişiye bağlıdır; takvim 30 günlük içerik sunar.
- Ödül alma kaydı ve cüzdan tek hesap durumunda, aynı Firestore işlemiyle yazılır. Çevrimdışı kayıt ve CAS/çakışma koruması devam eder. İki cihazın ödülleri körlemesine toplanmaz.

## Avatar hediyeleri ve rozetler

Alınan görev ödülü sayısına göre:

- 5: Örgü saç
- 10: Gece mavisi kıyafet
- 15: Yıldızlı bere
- 20: Gezgin topuzu
- 25: Altın yelek
- 30: Keşif tacı

Profil → Avatarını düzenle bölümünde seçilir. Eski beş parçalı avatar seçenekleri ücretsiz/açık kalır. Yeni seçenekler kilitli görünür; seçim hesabınla eşitlenir ve sıralamada görünür.

8 rozet: 1 / 30 / 64 / 124 bölüm, en iyi 7 / 30 günlük seri, 10 / 30 görev ödülü. Rozetler kayıtlardan hesaplanır; geçmiş ilerleme ve en iyi seri de sayılır. Rozetler ayrıca altın veya kupa üretmez.

## Kayıt koruma ve sınırlar

- Şema 1/2 kayıtları şema 3’e yükseltilir. Mevcut bölüm, altın, ipucu, kupa, prestij ve eski avatar seçenekleri korunur; eski puanlar önceki sürümlerdeki gibi aktif sıralamaya dönmez.
- `journey` alanı: başlangıç tarihi, seçili gün, alınan ödül günleri, görev başına tamamlanan bölüm kimlikleri/kelime/ipucusuz tamamlama sayaçları.
- Mevcut yerel hesap kaydı ilk defter geçişinde `seyyah-account-v1-uid:…-before-month-v3` (misafir için eşdeğeri) altında yedeklenir. Çakışma yedekleri de korunur.
- Görevler ve tarihler istemcide hesaplanır. Cihaz saatini değiştirmeyi veya değiştirilmiş istemcinin sahte ilerleme bildirmesini önleyen sunucu otoriteli hile koruması değildir. Firestore sahiplik, şema, sürüm, kupa/temel avatar sınırları ve eşzamanlı kayıt tutarlılığını korur; oynanış tekrarını doğrulamaz.
- Kuralların üretimde yayımlanması ve fiziksel cihazlar arasında gerçek Firebase eşitlemesi proje sahibince doğrulanmalıdır. OAuth giriş akışları bu sürümde değiştirilmedi.

## Testler

`npm test`; bulmaca harf sayımları ve bağlantılı en fazla 9×9 tahtalar, 124 bölüm, eski ilerleme geçişi, görev türleri, İstanbul gece yarısı, kaçırılan günler, tek ödül, kilitli kozmetik, 30 günlük toplamlar ve iki cihazlı kayıt/ödül çakışmalarını kapsar. CI Firestore emülatöründe yeni kuralların izin/red davranışlarını da çalıştırır.

Tarayıcı testinde 124 bölüm UI üzerinden tamamlandı, eski bölüm tekrarı kontrol edildi, 30 gün tarih simülasyonuyla oynandı, tüm ödüller/6 kozmetik/8 rozet açıldı, yeniden yükleme ve 320–1280 px görünüm doğrulandı. Bu simülasyon fiziksel telefonda 30 gün boyunca gerçek kullanım testi değildir.
