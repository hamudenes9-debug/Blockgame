# Cloud Shell yönetim komutları

Güncel commit kimliğiyle `admin-tools/install-duyuru.sh` kurucusunu yeniden **source** et. Aynı kurucu eski `/Duyuru`, `/bildirim`, `/bakım` komutlarını korur ve aşağıdaki komutları mevcut/yeni Bash oturumlarına ekler. Yeni APK, servis hesabı anahtarı veya ücretli plan gerekmez. Kurulum hiçbir canlı işlem yapmaz.

Komutlar yalnızca `blockgame-46ae9` projesini yönetebilen Google hesabının `gcloud` oturumuyla çalışır. Erişim belirteçleri kaydedilmez veya yazdırılmaz. Firebase Authentication ve Firestore yönetim yetkileri gerekir; 403 alırsan proje hesabını/yetkilerini kontrol et. `221015` bakım geçiş kodu bu komutlara yönetici yetkisi vermez.

## Tüm komutlar

| Komut | Görev |
|---|---|
| `/premium ver UID 365` | Hesaba 365 gün Premium ekler; onay ister. |
| `/premium durum UID` | Aktiflik ve saat dilimi dahil bitiş tarihini okur. |
| `/premium iptal UID` | Premium'u kapatır; onay ister. |
| `/oyuncu UID` | Oyuncu adı, buluttaki bölüm/altın/kupa/prestij ve Premium özeti. |
| `/duyurular` | Güncel/arşiv/gelecek tüm kayıtlı duyuruları kimlik, metin ve tarihleriyle listeler. |
| `/duyuru-sil KIMLIK` | Tek duyuruyu kaldırır; onay ister. |
| `/durum` | Bakım, minimum sürüm/şema, duyuru sayısı ve bayram sistemi özeti. |
| `/yardım` veya `/yardim` | Komut listesi; yetkilendirme veya ağ bağlantısı istemez. |
| `/Duyuru 'metin'` | Oyun içi duyuru. |
| `/bildirim 'metin'` | Oyun içi duyuru ve kayıtlı izinli Android cihazlarına push denemesi. |
| `/bakım aç 'mesaj'` | Bakımı açar. |
| `/bakım kapat` | Bakımı kapatır. |
| `/bakım durum` | Bakımı okur. |
| `/bakım github` | GitHub bakım ayarını hemen uygulayıp manuel önceliği kaldırır. |

`UID` ve `KIMLIK` örnek yer tutuculardır. Oyuncunun Profil ekranındaki gerçek UID'yi veya `/duyurular` çıktısındaki gerçek duyuru kimliğini kullan. `--help` her komutta yardım gösterir ve hiçbir canlı işlem yapmaz.

## Premium güvenliği

Verme/iptal işleminden önce Firebase Authentication'da UID doğrulanır; oyuncu adı, UID ve mevcut Premium bilgileri gösterilir. Verme işleminde yeni bitiş tarihi de gösterilir. Ardından terminalde **`ONAY gerçek_UID`** yazman gerekir. Yanlış cevap, boş cevap veya kapalı giriş işlemi iptal eder. Otomatik onay bayrağı yoktur.

- Gün sayısı 1–3650 tam sayı; **365 gün**, takvimde otomatik bir yıl ilerletmek değil, tam 365 gündür.
- Aktif Premium'un kalan süresine eklenir. Bitmiş, kapalı veya yeni kayıtta süre Cloud Shell'in güncel UTC saatinden başlar.
- Yalnızca engellenmemiş, giriş sağlayıcısı bağlı hesaplara Premium verilir; anonim hesap kabul edilmez.
- Verme yalnızca `premium/UID` belgesinin `enabled`, `expiresAt`, `updatedAt` alanlarını yazar. Yeni belgede yaratma koşulu, mevcut belgede sürüm koşulu kullanılır.
- İptal yalnızca `enabled` ve `updatedAt` alanlarını yazar; eski bitiş tarihi ve **kalıcı açılmış kozmetikler korunur**. Altın/kupa değişmez, eski ödüller yeniden verilmez.
- Eşzamanlı değişiklikte otomatik üzerine yazılmaz. Ağ hatası, sunucu hatası veya belirsiz sonuçta **Premium verme yeniden denenmez**. Önce `/premium durum UID` ile bitişi kontrol et: komutu yeniden çalıştırmak ikinci kez gün ekleyebilir.
- Oyuncu değişikliği sonraki başarılı Premium kontrolünde görür. Gerçek cihaz testi/otomatik ödeme tahsilatı yapılmaz. Komut ücret tahsil etmez veya abonelik satışı kaydı oluşturmaz.

## Duyuru silme

Önce `/duyurular` ile kimliği bul, ardından `/duyuru-sil gerçek_kimlik` kullan. Silinecek duyuru gösterildikten sonra **`ONAY gerçek_kimlik`** yazman gerekir.

Sadece seçilen kimlik kaldırılır. Diğer duyurular, bakım ve sürüm ayarları korunur. Aynı belgede `deletedAnnouncementIds` geçmişi tutulur; güncel GitHub yayıncısı aynı kimlikli kaynak/Cloud Shell duyurusunu yeniden eklemez. Tekrar yayınlamak için **yeni bir duyuru kimliği** kullan. Silme geçmişi 1000 farklı kimlikle sınırlıdır; dolarsa sessiz temizlik yerine işlem durur.

Gönderilmiş telefon bildirimi geri çekilmez, başlamış push gönderimi iptal edilmez. Daha önce kaydedilmiş bildirim teslim kayıtları silinmez. Eski yayıncı kodunu çalıştırmak bu korumayı uygulamayabilir; güncel yayıncıyı kullan.

## Salt okunur komutlar

`/oyuncu`, `/premium durum`, `/duyurular` ve `/durum` hiçbir belgeye yazmaz. `/oyuncu` bulut kaydını gösterir; henüz eşitlenmemiş çevrimdışı ilerleme dahil değildir. Bulut kaydı yoksa sıfır bakiye uydurmak yerine bunun eksik olduğunu bildirir. Okumalar ayrı anlarda yapılır; eşzamanlı oyun/Premium işlemleri sırasında anlık fark olabilir. E-posta, cihaz tokenı ve giriş kimlik bilgileri gösterilmez.

Diğer komutlar için: [Duyuru](DUYURU-REHBERI.md), [Bildirim](BILDIRIM-REHBERI.md), [Bakım](BAKIM-REHBERI.md).

## Dakikalık etkinlik

`/event 30`, `/event durum`, `/event kapat`: 1.12.0 APK ve şema 6 kurulumundan sonra kullanılır. Süre sonunda otomatik biter. [Etkinlik rehberi](EVENT-REHBERI.md).

## APK güncellemeden eklenen yönetim araçları

Bu komutlar için yalnız Cloud Shell kurucusunu güncellemek yeterlidir. `/yardım` ve `/yardim` hepsini listeler. Oyun sürümü **1.12.0** olarak kaldı; `/event uzat` eski APK'ya etkinlik özelliği kazandırmaz, mevcut 1.12.0/şema 6 kurulumunu kullanır.

| Komut | Davranış |
|---|---|
| `/event uzat 15` | Aktif etkinliğin mevcut bitişine 15 dakika ekler; başlangıcı/kimliği değiştirmez. `ONAY event-uzat-15` ister. |
| `/premium liste` | Okunan sayfadaki aktif Premium kayıtlarının UID ve bitişini gösterir. |
| `/premium bitenler 7` | Okunan sayfada önümüzdeki 7 gün içinde bitecek aktif Premium kayıtları. |
| `/oyuncu-bul 'isim'` | Firebase Authentication görünen adında büyük/küçük harf duyarsız arama; aynı isimli hesaplar ayrı UID ile gösterilir. |
| `/duyuru-duzenle KIMLIK 'metin'` | Yalnız metni değiştirir; başlık/tarihler korunur. `ONAY KIMLIK` ister. |
| `/duyuru-onizle 'metin'` | Metin ve UTF-16 uzunluğunu yerelde gösterir. Yetkilendirme/ağ/yayım yok; APK'nın birebir görsel önizlemesi değildir. |
| `/arsiv-temizle` | Süresi bitmiş duyuruları listeler. Kimlikleri seç, ardından `ONAY arsiv-temizle` yaz. |
| `/bildirim-test UID 'metin'` | `ONAY UID` sonrasında yalnız seçilen hesabın kayıtlı Android cihazlarına FCM denemesi. |
| `/bildirim-durum KIMLIK` | `notificationDeliveries` kaydının güvenli özetini okur; yeniden göndermez. |
| `/ayar-yedekle` | Seçili canlı yönetim ayarlarını özel izinli yerel JSON dosyasına yedekler. |
| `/sistem-kontrol` | Canlı alanlar, yönetici IAM izinleri, FCM API ve Rules yayımını değişiklik yapmadan kontrol eder. |

### Sayfalı listeler ve arama

Premium listeleri ve oyuncu araması **bir çağrıda en fazla 200 kaynak kayıt** okur, filtreyi o sayfada uygular. Sonuç sıfır olsa da sonraki sayfada eşleşme olabilir; tüm hesaplar taranmış gibi yorumlama. Devam belirteci çıktıda gösterilir:

```bash
/premium liste --sayfa 'CIKTIDAKI_BELIRTEC'
/premium bitenler 7 --sayfa 'CIKTIDAKI_BELIRTEC'
/oyuncu-bul 'İpek' --sayfa 'CIKTIDAKI_BELIRTEC'
```

Sayfalama belirteci Google erişim tokenı değildir. Listeler tek bir atomik anlık görüntü değildir; arada değişen kayıtlar olabilir. İsim araması Authentication görünen adını kullanır; adı kaydedilmemiş veya yalnız başka bir profil alanında adı olan hesaplar bulunmayabilir. E-posta, parola karması, cihaz tokenı gösterilmez. Premium bitişinde tam sınır dahil; zaten süresi dolmuş kayıtlar listelenmez. Gün aralığı 1–3650.

### Etkinlik uzatma

Ek dakika 1–10080; uzatma sonrası toplam kalan süre en fazla 10080 dakika. Okuma ve onay sonrası kontrollerde bitmiş/kapalı etkinlik uzatılmaz. Son saniyeye bırakma: ağ gecikmesi ve istemci ayar önbelleği nedeniyle anlık güncelleme garantisi yoktur. Kontrol Cloud Shell saatiyle yapılır; oyuncu ödülü yine sunucu saatinde doğrulanır. Yalnız `rewardEvent.endsAt` alanı belge sürümü koşuluyla yazılır. Belirsiz yanıt veya çakışmada tekrar denenmez; önce `/event durum` ile kontrol et. Komutu yeniden çalıştırmak yeniden süre ekleyebilir.

### Duyuru düzenleme ve arşiv temizliği

Düzenlenen metin `announcementOverrides` içinde saklanır. Güncel GitHub yayıncısı metin önceliğini korur; kaynak dosyada duyuru kalksa da mevcut düzenlenmiş kayıt kalır. Aynı kimlikteki düzenlenmiş duyuru otomatik push listesinden çıkarılır. Yeniden push gönderilmez; başlamış gönderim iptal edilmez. Eski yayıncı kodunu çalıştırma. Görmek için sonraki başarılı ayar kontrolünden sonra Duyurular sayfasını yeniden açmak gerekebilir.

`/arsiv-temizle` aktif/gelecek duyuruları seçime almaz; geçersiz tarihli kayıtlar atlanır. İlk soruda kimlikleri boşlukla ayır veya `hepsi` yaz; boş cevap iptaldir. Seçim listesi gösterildikten sonra ikinci onay gerekir. İstersen `/arsiv-temizle KIMLIK1 KIMLIK2` ile seçim verip yine onaylayabilirsin. Seçilenler **tek koşullu yazmada** kaldırılır; silme geçmişiyle geri gelmeleri engellenir. Duyuru düzenleme ve silme geçmişleri en fazla 1000 farklı kimlik tutar; dolunca sessiz temizlik yerine işlem durur. Gönderilmiş telefon bildirimleri geri çekilmez.

### Tek hesaba bildirim testi

Genel oyun içi duyuru oluşturulmaz. Cihaz sorgusu yalnız `users/UID/devices` altındadır; ayrıca dönen cihaz yolu tekrar doğrulanır. Yanlış/boş UID'de toplu gönderime geçiş yoktur. Android tokenları tekilleştirilir; kullanıcı adı/UID ve metin gösterilip onay alınır. Gönderimden önce benzersiz teslim kaydı ayrılır; belirsiz FCM yanıtları otomatik tekrarlanmaz. Bildirime dokunmak mevcut Duyurular ekranını açar; test metni genel listede görünmez.

FCM kabulü fiziksel teslim/gösterim kanıtı değildir. Kayıtlı cihaz yoksa açıkça bildirilir. Kayıt sadece `sending` durumunda kalmışsa veya sayaç yoksa bunlar sıfır başarı/başarısızlık anlamına gelmez. Yeni çağrı yeni bir bildirim oluşturabilir; önce durum komutunu kullan.

### Yedek ve sistem kontrolünün kapsamı

Yedekler `~/.local/share/kelime-seyyahi/backups/` altında benzersiz adla oluşturulur: klasör **0700**, dosya **0600**. Yedek; `operations/current` içindeki sürüm/şema, bakım, etkinlik, duyuru/öncelik/silme geçmişi, bayram, bölüm listesi ve yayım zamanı alanlarının seçili kopyasıdır. Bilinmeyen alanlar dahil edilmez. OAuth tokenı, oyuncu kayıtları, Premium belgeleri, cihazlar, Rules kaynakları ve diğer belgeler **yedeklenmez**. Bu tam Firebase yedeği değildir; otomatik geri yükleme komutu eklenmedi.

`/sistem-kontrol` deneme yazması yapmaz, API açmaz, rol değiştirmez ve FCM göndermez. IAM testi bir sorgudur; kaynak durumunu değiştirmez. Rules kaynağındaki kaydetme şemasını metin üzerinden kontrol eder; gerçek emülatör testi/eksiksiz güvenlik denetimi değildir. 403 veya bağlantı hatası, ilgili bölüm için **DOĞRULANAMADI** olarak raporlanır; API'nin kapalı olduğu varsayılmaz. Ücretsiz kotalar ve mevcut izinler geçerlidir; ücretli plan açılmaz.
