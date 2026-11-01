# Dakikalık 2× etkinlik — 1.12.0 / şema 6

## Bir kez kurulum

1. Yeni APK'yı **mevcut uygulamayı silmeden** üzerine kur. Bu özellik 1.11.1 APK'sında yoktur.
2. Proje sahibi Google hesabıyla Cloud Shell'de `admin-tools/upgrade-event-v1.py` güncelleyicisini çalıştır. Kaynak `v1.12.0` etiketinden alınır. Önce şema 6 Rules yayımlanır, sonra sadece `minimumVersion`, `minimumSchema`, `levelIds` alanları sürüm koşuluyla güncellenir. Önceki Rules sürümü ve canlı ayarlar ev dizininde 0600 izinli JSON yedeğine alınır. Daha yeni şema/sürüm varsa eski güncelleyici durur. Duyurular, silme geçmişi, bakım, bayram, oyuncu kayıtları, Premium süreleri ve kozmetikler değişmez. İşlem kısmen başarısız olabilir: çıktıda hangi adımın tamamlandığını kontrol et. Bu adım etkinlik başlatmaz veya bildirim göndermez.
3. Güncel sabit commit kimliğiyle `install-duyuru.sh` kurucusunu tekrar source et. `/event` mevcut ve yeni Bash oturumlarında hazır olur; eski komutlar korunur.

## Kullanım

```bash
/event 30        # 30 dakika
/event 120       # 120 dakika (2 saat)
/event durum     # sadece oku; tek başına /event de aynı
/event kapat     # erken bitir
```

Süre 1–10080 dakika arasında tam sayı olabilir. Başlatırken `ONAY event-30` (verilen dakika neyse), kapatırken `ONAY event-kapat` yazman istenir. Süre **onaydan sonra** başlar. Aktif etkinlik varken ikinci başlatma reddedilir; sessizce uzatılmaz. Yeni süre için önce kapat, sonra başlat. Kapanma/bitişten sonra önceden onaylanmış ödüller geri alınmaz.

İşlem yalnızca `operations/current.rewardEvent` alanını sürüm koşuluyla günceller. Güncel zamanlanmış yayıncı bu alanı korur. Ağ hatası veya eşzamanlı değişiklikte otomatik tekrar yoktur; önce `/event durum` ile sonucu doğrula. Kurulum ya da testler gerçek etkinlik başlatmaz.

## Ödüller

| Durum | Yeni bölüm / günlük görev altını | İlk bölüm tamamlama kupası |
|---|---:|---:|
| Yalnız etkinlik | 2× | 40 |
| Etkinlik + Premium | 4× | 80 |
| Etkinlik + bayram | 2× | 80 |
| Etkinlik + Premium + bayram | 4× | 160 |

Bayram altını artırmaz. Günlük görev ipuçları değişmez; etkinlik ilave ipucu veya görev kupası vermez. Mevcut bakiyeler, eski tamamlamalar ve önceden alınmış görev ödülleri katlanmaz. Tekrar oynama ek altın/kupa vermez; yeni etkinlik aynı bölümü yeniden ödüllendirmez.

Bölüm ek ödülleri hesapla giriş ve çevrimiçi sunucu onayı ister; misafir/çevrimdışı bölüm oyunu standart ödüllerle devam eder. Günlük görev altını mevcut güvenli çevrimiçi görev talebinde, talebin sunucuda onaylandığı anda hesaplanır. Bölüm bonusu yerelde önce **bekliyor** olarak işaretlenir; bonus altın harcanabilir bakiyeye yalnızca atomik sunucu onayında girer. Eşzamanlı cihazlar, tekrar talepler ve yinelenen yanıtlar aynı ödülü ikinci kez vermez.

Etkinlik `[başlangıç, bitiş)` aralığında geçerlidir. Bitiş anı dahil değildir. Süreyi Rules içindeki `request.time` denetler; telefondaki tarih değiştirilerek uzatılamaz. Son saniyede tamamlanıp bitişten sonra sunucuya ulaşan bonus reddedilebilir; standart ilerleme korunur. Etkinlik biter/değişirse hâlâ geçerli Premium/bayram bonusları etkinliksiz yeniden denenir. Hiçbir geçersiz bonus kalıcı bakiyeye eklenmez.

## Oyuncu ekranı ve sınırlar

Anasayfadaki Duyurular & Etkinlikler kartında **2× Altın + 2× Kupa** ve kalan dakika; detaylarda bitiş ve çarpan açıklaması gösterilir. Canlı ayarlar yaklaşık 15 saniyede bir kontrol edilir; bağlantıya bağlıdır, anlık başlangıç garantisi yoktur. Bitiş için yeniden yayın, cron, Cloud Functions veya ücretli sunucu gerekmez. Süre dolmuş kayıt veritabanında kalsa bile bonus sona erer.

Spark planı korunur; ücretsiz kotalar ve bağlantı sınırları geçerlidir. Komut FCM/push göndermez. İstersen ayrıca `/bildirim '30 dakika 2× altın ve kupa etkinliği başladı!'` kullan; bu ayrı bir işlemdir.

Eski uygulamalar çevrimiçi kontrolde güncelleme ister; eski çevrimdışı APK uzaktan kilitlenmez. E-posta/şifre/token paylaşma. Gerçek canlı etkinlik ve fiziksel cihaz teslimi otomatik test kapsamında değildir.
