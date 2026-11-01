# Cloud Shell’de `/bakım`

Mevcut kurucuyu yeni commit kimliğiyle bir kez yeniden çalıştır. `admin-tools/install-duyuru.sh` artık `/Duyuru`, `/bildirim` ve `/bakım` komutlarını birlikte kurar. Kurulum bakım modunu **açmaz**, duyuru/bildirim göndermez. Yeni APK gerekmez; mevcut uygulamanın canlı bakım ekranı kullanılır.

## Komutlar

```bash
# Bakımı aç; mesajı oyuncuların bakım ekranında göster.
/bakım aç 'Güncelleme yapıyoruz. Biraz sonra tekrar dene.'

# İsteğe bağlı tahmini bitiş açıklaması.
/bakım aç 'Sunucu bakımı yapılıyor.' --bitis 'Bugün 19:30'

# Bakımı kapat.
/bakım kapat

# Yalnızca mevcut durumu oku; değişiklik yapma.
/bakım durum
/bakım

# Yönetimi GitHub'daki operations/live.json dosyasına geri ver.
/bakım github
```

Türkçe klavye yoksa `/bakim ac 'Mesaj'`, `/bakim kapat` ve `/bakim durum` kullanabilirsin. `/Bakım` da aynı komutun takma adıdır. Yardım: `/bakım --help`.

- Açarken mesaj verilmezse varsayılan bakım mesajı kullanılır.
- Mesaj en fazla 1000, tahmini bitiş açıklaması 100 UTF-16 birimi olabilir; uzun metin kesilmez, reddedilir.
- **`--bitis` yalnızca açıklamadır. Saat gelince bakım otomatik kapanmaz; `/bakım kapat` çalıştır.**
- Çevrimiçi oyuncular sonraki başarılı canlı ayar kontrolünde görür; genellikle yaklaşık bir dakika sürer, kesin süre garantisi yoktur. Zaten açık bakım ekranındaki açıklamayı yeniden kontrol etmek için uygulamayı kapatıp açmak gerekebilir.
- Normal çevrimdışı oyun uzaktan kilitlenmez. Bakım bir istemci ekranıdır; Firestore'a yönetici kilidi, hesap banı veya cihaz engeli koymaz.
- Mevcut **221015** kodu yalnızca bakım ekranını geçer. Yönetici yetkisi vermez; hesap engeli, sürüm veya güvenli ödül denetimini aşmaz.
- Bu komut duyuru veya telefon bildirimi göndermez. İstersen ayrıca `/Duyuru 'Bakım açıklaması'` veya `/bildirim 'Bakım açıklaması'` kullan.

## GitHub ile birlikte kullanım

`aç` ve `kapat` işlemleri `maintenanceOverride: true` yazar. Böylece zamanlanmış GitHub yayıncısı manuel bakım kararını kazara geri almaz. GitHub'daki bakım alanını değiştirmek, bu manuel yönetim açıkken oyunun bakım durumunu değiştirmez.

`/bakım github`, GitHub'daki güncel `operations/live.json` dosyasından bakım ayarını okur, **o açık/kapalı değerini hemen uygular** ve manuel önceliği bırakır. GitHub kaynağı okunamaz/geçersizse hiçbir ayar yazmaz. Google erişim belirteci GitHub'a gönderilmez.

## Güvenlik ve kapsam

Cloud Shell’de `blockgame-46ae9` projesini yönetebilen Google hesabı gerekir. `gcloud` oturumu kullanılır; servis hesabı anahtarı indirilmez, token yazdırılmaz veya diske kaydedilmez. Yalnızca `operations/current.maintenance` ve `maintenanceOverride` alanları güncellenir. Oyuncu bakiyeleri, Premium süreleri, duyurular, bayram/sürüm ayarları ve güvenlik kuralları değiştirilmez. Ücretli plan açılmaz.

Belge sürümüyle eşzamanlı değişiklikler korunur. Yanıt kaybolursa tekrar yazmadan önce mevcut durum okunur. **BAŞARILI** yoksa sonucu `/bakım durum` ile kontrol et; mesajı yeniden çalıştırmadan önce ne uygulandığını doğrula. 401/403 yetki, 404 eksik kaynak/kurulum veya bağlantı hatası halinde komut başarı iddiasında bulunmaz.

Kaldırmak için `.bashrc` içindeki `# Kelime Seyyahi /bakim command v1` bloğunu sil; açık terminalde `unset -f /bakım /bakim /Bakım` kullan. Komutu kaldırmak aktif bakım modunu kendiliğinden kapatmaz; kaldırmadan önce gerekiyorsa `/bakım kapat` çalıştır.
