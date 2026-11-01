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
