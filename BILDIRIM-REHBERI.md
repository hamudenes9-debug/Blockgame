# Cloud Shell’de `/bildirim`

`/bildirim 'Metin'`, aynı metni **oyun içi duyuruya** ekler ve özel cihaz kaydı bulunan Android cihazlarına Firebase Cloud Messaging üzerinden push göndermeyi dener. Kullanıcının bildirim iznini aşamaz. `/Duyuru 'Metin'` yalnızca oyun içi duyuru olarak kalır.

## Kurulum

[DUYURU-REHBERI.md](DUYURU-REHBERI.md) içindeki kurulumu **/bildirim özelliğini içeren yeni commit kimliğiyle** tekrar çalıştır. Aynı kurucu artık iki komutu da indirir; mevcut `/Duyuru` ve diğer Bash ayarlarını silmez. Yeni APK gerekmez; 1.10+ Android uygulamasındaki mevcut `news` kanalı ve bildirim işleyicisi kullanılır. Tercihen güncel 1.11.1 APK’yı kullan.

```bash
/bildirim 'Yeni güncellememiz yayımlandı. İyi oyunlar!'
```

`/Bildirim` de aynı komutun takma adıdır. Metni tek tırnak içinde yaz. Başlık **Seyyah Postası**; gövde komuttaki metindir. En fazla 500 UTF-16 birimi kabul edilir; bazı emojiler iki birim sayılır. Fazla metin kesilmeden reddedilir. Yardım: `/bildirim --help`.

## Kimlere gider?

- Android uygulamasında **Profil → duyuru/bayram bildirimleri** tercihini açmış ve Android iznini vermiş oyuncuların `users/{uid}/devices/{deviceId}` kayıtları kullanılır.
- Web/iOS ve başka belge yolları gönderime dahil edilmez. Aynı FCM token'ı birden fazla kayıtta bulunsa da tek gönderim yapılır.
- Cihaz kaydı hiç oluşmamışsa komut açıkça **kayıtlı Android bildirim cihazı bulunamadı** der; bu durumda oyun içi duyuru yine vardır.
- Oyuncu izni kapattıysa, uygulamayı zorla durdurduysa, interneti yoksa veya pil kısıtlaması varsa teslimat gerçekleşmeyebilir/gecikebilir. Normal arka plan/kapalı uygulama bildirimi desteklenir; kesin teslimat veya ses garantisi yoktur.
- Bildirime dokununca oyunun Duyurular ekranı açılır. Oyun içi kopya 30 gün güncel, sonra listede kaldığı sürece arşiv olarak görünür. Push TTL süresi 24 saattir.

## Gönderim özeti

Komut **FCM kabul edilen / başarısız / belirsiz / atlanan** sayılarını ayrı yazar. **FCM kabulü telefonun bildirimi gösterdiği anlamına gelmez.** Tarama yarıda kaldıysa henüz sayılmamış cihazlar olabilir. Sonuç belirsizse aynı metni körlemesine tekrar gönderme: her ayrı çalıştırma yeni gönderim kimliği üretir.

Gönderim öncesinde `notificationDeliveries/{id}` kaydı oluşturulur. Bu kaydın oluşturulduğu doğrulanmadan push gönderilmez. FCM isteğinin yanıtı kaybolursa otomatik tekrar gönderilmez; kopya bildirimi önlemek için bazı cihazlar bildirimi alamayabilir. Yetki/kota/servis hatasında kalan gönderimler durdurulur. Başlatılmış en fazla beş eşzamanlı istek yine tamamlanabilir. İstatistikler aynı kayda yazılır; cihaz token'ları günlük/özet içine konmaz ve bu komut cihaz kayıtlarını silmez.

Oyun içi kopya `delivery: in-app` işaretini korur: push bu komut tarafından gönderilir, GitHub zamanlanmış yayıncısı tekrar göndermez.

## Yetkiler ve sorun giderme

- Cloud Shell’de projeyi yöneten Google hesabını kullan. Proje sabittir: `blockgame-46ae9`.
- Google'ın **Authorize** penceresini onaylamak gerekebilir. Komut `gcloud` oturumunu kullanır; servis hesabı anahtarı indirtmez, token yazdırmaz/diske kaydetmez.
- Firestore verisini okuma/yazma ve FCM mesaj gönderme yetkisi gerekir. Sahip olmayan yönetici hesaplarında proje yöneticisi gerekli en dar IAM izinlerini sağlamalıdır.
- **Firebase Cloud Messaging API (`fcm.googleapis.com`)** etkin olmalı. 401/403 durumunda Google Cloud Console → APIs & Services bölümünden API durumunu ve hesap yetkilerini kontrol et. Komut API veya ücretlendirme ayarını kendiliğinden değiştirmez.
- Bu yöntem Cloud Functions/Blaze kurmaz. Firebase/Spark/FCM ve Cloud Shell kotaları geçerlidir; ücretsiz sınırsız kullanım veya teslimat vaat edilmez.
- Liste 30 duyuruyla doluysa oyun içi kayıt oluşturulamaz ve push başlatılmaz. Arşiv temizliğini yönetici olarak yap; `operations/current` belgesinin tamamını silme.
- Gerçek fiziksel cihaz teslimatı bu kodun taklitli API testleriyle doğrulanmış sayılmaz. Önce kendi izin verilmiş Android cihazında kısa bir mesajla dene; bu komutun tüm kayıtlı Android cihazlarına gönderdiğini unutma.

Kaldırmak için `.bashrc` içindeki `# Kelime Seyyahi /bildirim command v1` bloğunu ve iki fonksiyonu kaldır. Açık terminalde `unset -f /bildirim /Bildirim` kullanabilirsin. Gönderilmiş bildirimler bu işlemle geri alınmaz.
