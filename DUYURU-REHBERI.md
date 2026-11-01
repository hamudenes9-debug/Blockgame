# Cloud Shell’de `/Duyuru` komutu

Bu komut Google Cloud Shell’in **Bash** terminalinde oyun içi duyuru yayımlar. Android’e yeni APK kurmak gerekmez. Telefona kapalı-uygulama push bildirimi göndermez.

## Bir defalık kurulum

Kurulum betiği `admin-tools/install-duyuru.sh`, komut ise `admin-tools/duyuru.py` dosyasıdır. Güvendiğin bu deponun **tam 40 karakterlik commit kimliğini** kullanarak:

```bash
# COMMIT_KIMLIGI yerine kurulacak gerçek commit kimliğini yaz.
KIMLIK=COMMIT_KIMLIGI
curl -fsSL "https://raw.githubusercontent.com/hamudenes9-debug/Blockgame/$KIMLIK/admin-tools/install-duyuru.sh" -o /tmp/seyyah-duyuru-kur.sh && source /tmp/seyyah-duyuru-kur.sh "$KIMLIK"
```

Kurulum, komut dosyasını `~/.local/share/kelime-seyyahi/duyuru.py` konumuna indirir ve `.bashrc` dosyasına `/Duyuru` Bash fonksiyonunu ekler. Diğer terminal ayarlarını silmez. Tekrar kurulursa aynı fonksiyon bloğunu çoğaltmaz. `/Duyuru` kök dizine yazılan bir dosya değildir; yönetici/sudo izni gerekmez. Kurulum tek başına duyuru yayımlamaz.

## Kullanım

```bash
/Duyuru 'Merhaba seyyahlar! Yeni güncellememiz yayımlandı.'
/Duyuru 'Premium satışlarımız devam ediyor. Mağazadan ayrıntılara ulaşabilirsin.'
```

- Köşeli parantez yazılmaz. Metni tırnak içine al; özellikle `!`, `$`, `&`, `;` gibi işaretlerde tek tırnak kullan. Metnin kendisinde tek tırnak varsa normal Bash alıntılama/kaçış kurallarını uygula.
- Boşlukla ayrılmış düz kelimeler de kabul edilir: `/Duyuru Merhaba seyyahlar`.
- Başlık **Seyyah Postası**, gövde yazdığın metindir. En fazla 2000 UTF-16 karakter birimi kabul edilir; bazı emojiler iki birim sayılır. Aşan metin kesilmez, reddedilir.
- Her çalıştırma yeni bir duyuru kimliği üretir. Duyuru 30 gün güncel görünür; ardından belge listesinde kaldığı sürece arşivde görünür.
- Çevrimiçi oyuncular bir sonraki başarılı ayar kontrolünde görür. Genellikle yaklaşık bir dakika sürer; kesin süre ve teslimat garantisi yoktur. Oyunu yeniden açarak da kontrol edebilirsin.
- `/Duyuru --help` yardım gösterir. Metinsiz `/Duyuru` kullanımı hiçbir şey yayımlamaz.
- Yeni Cloud Shell Bash oturumunda fonksiyon otomatik yüklenir. Aynı açık terminalde gerekirse `source ~/.bashrc` ile yeniden yükle.

## Yetki ve güvenlik

Firebase’i yöneten Google hesabıyla Cloud Shell’i aç. Gerekirse Google’ın **Authorize** penceresini onayla. Komut mevcut `gcloud` oturumundan geçici erişim belirteci alır; anahtar dosyası indirtmez, belirteci yazdırmaz veya diske kaydetmez. Proje sabittir: `blockgame-46ae9`.

Yalnızca `operations/current.announcements` alanına yazılır. Premium kayıtları, oyuncu bakiyeleri, bakım/bayram ve sürüm ayarları değiştirilmez. Herkese açık yazma izni verilmez. Firebase kuralları veya ücretli plan değiştirilmez.

Başka yönetici aynı anda yazarsa belge sürüm koşulu ile yeniden okunur; onun duyuruları kaybolmaz. Aynı çalıştırma içindeki belirsiz ağ yanıtında kimlik kontrolü tekrar yayımı önler. Sonuç yine doğrulanamıyorsa oyun içindeki listeyi kontrol etmeden aynı metni yeniden çalıştırma: ayrı komut çalıştırmaları ayrı duyurulardır.

En fazla 30 kayıt tutulur. Liste dolduğunda komut **hiçbir eski duyuruyu silmez**; yönetici Firestore’daki `announcements` dizisinden artık gerekmediğini belirlediği bir kaydı kaldırmalıdır. Sadece o dizi öğesini kaldır; `operations/current` belgesini silme.

GitHub yayıncısı `shell-` kimlikli komut duyurularını sonraki yayımlarda korur. Bu kimlik önekini `operations/live.json` içinde kullanma. Bu duyurular `delivery: in-app` işaretlidir; zamanlanmış gönderici de bunları push olarak göndermez.

Hata durumunda:
- **401/403:** doğru yönetici hesabını ve Google yetkilendirmesini kontrol et.
- **404:** `operations/current` kurulumu eksiktir.
- **Liste dolu:** gerekli arşiv temizliğini yönetici olarak yap.
- **Yayım sonucu doğrulanamadı:** duyuru zaten ulaşmış olabilir; oyun içindeki listeyi kontrol et. Başarı mesajı olmadan yayımlandığını varsayma.

Komutu kaldırmak için `.bashrc` içindeki `# Kelime Seyyahi /Duyuru command v1` bloğunu ve fonksiyonunu kaldırabilirsin. Mevcut terminalde `unset -f /Duyuru` komutu fonksiyonu kapatır; yayımlanmış duyuruları silmez.

## Telefon bildirimi de göndermek için

Güncel kurucu `/bildirim 'Metin'` ve `/Bildirim 'Metin'` komutlarını da yükler. Bu ayrı komut oyun içi duyuruya ek olarak kayıtlı Android cihazlarına FCM push gönderir. `/Duyuru` davranışı değişmez. Önceki kurulumu yaptıysan yeni kaynak kimliğiyle bir kez yeniden kur. Detaylar ve teslimat sınırları: [BILDIRIM-REHBERI.md](BILDIRIM-REHBERI.md).

## Bakım yönetimi

Güncel kurucu `/bakım aç 'Mesaj'`, `/bakım kapat` ve `/bakım durum` komutlarını da ekler. Kurulum bakımı açmaz. Ayrıntılar: [BAKIM-REHBERI.md](BAKIM-REHBERI.md).

Duyuruları `/duyurular` ile listeleyebilir, `/duyuru-sil KIMLIK` ile onay vererek kaldırabilirsin. Gönderilmiş telefon bildirimi geri çekilmez. [Tüm yönetim komutları](YONETIM-KOMUTLARI.md).
