# Bir oyuncuya Premium nasıl verilir?

Premium **Firebase UID** ile tanımlanır. E-posta, görünen ad, bakım kodu veya cihazın yerel kaydı Premium açamaz. E-posta göndermek otomatik ödeme/aktivasyon değildir.

## Firebase Console ile — önerilen kolay yöntem

1. Oyuncu Google, GitHub veya Yahoo hesabıyla giriş yapsın.
2. **Profil → Oyuncu UID → UID’yi kopyala** seçsin; satın alma talebinde sana bu UID’yi iletsin. Mağazadaki e-posta düğmesi UID’yi hazır e-posta metnine ekler, kendiliğinden göndermez.
3. Firebase Console → Authentication → Users bölümünde doğru kullanıcı olduğunu doğrula. Aynı e-postanın farklı sağlayıcı hesabı olabileceğini unutma; UID esas alınır. Misafir/anonim UID’ye Premium verme.
4. Satın almayı sen doğruladıktan sonra **Firestore Database → Data → Start collection / Koleksiyon başlat**:
   - Koleksiyon adı: **`premium`**
   - Belge kimliği: **oyuncunun gerçek UID’si**. Otomatik kimlik veya e-posta yazma.
   - Alan `enabled` → tür **boolean** → **true**
   - Alan `expiresAt` → tür **timestamp** → satın alma başlangıcından **bir yıl sonraki bitiş tarihi/saat**.
5. Kaydet. Oyuncu **Mağaza → Premium durumunu yenile** seçsin. Normalde durum en geç sonraki başarılı yaklaşık 60 saniyelik kontrolde yenilenir. Süre bitişi sunucu saatine göre kontrol edilir.

Örnek: 1 Kasım 2026’da başlayan bir yıllık hak için bitişi 1 Kasım 2027’de kararlaştırdığınız saate ayarlayabilirsin. Firebase Console’un gösterdiği saat dilimini kontrol et. `expiresAt` metin/string değil **timestamp** olmalı.

### Kapatma veya uzatma

- Kapatmak için aynı belgedeki `enabled` değerini **false** yap. Yeni durum istemciye başarılı yenilemede ulaşır; anında her cihaza ulaşma garantisi yoktur.
- Uzatmak için mevcut geçerli bitiş tarihini bir yıl ileri al. Süre zaten bitmişse yeni başlangıçtan bir yıl hesapla.
- Süre bitince normal altın/ipucu harcama sistemi geri gelir; oyuncunun mevcut altın/ipuçları silinmez.
- Hesabı devre dışı bırakılmış oyuncu, Premium’u olsa da oyuna giremez.

**Sadece senin yönetici Console erişimin bu belgeyi yazabilir.** Uygulama istemcilerine `premium` yazma izni açma; güvenlik kurallarını “herkes yazabilir” yapma.

## İsteğe bağlı yönetici komutu

Güvenilir yönetici bilgisayarında `npm ci --prefix admin-tools` çalıştır. Projeye ait yönetici anahtarını yalnızca güvenli ortam değişkeni `FIREBASE_ADMIN_SERVICE_ACCOUNT` ile sağla; anahtar dosyasını depoya veya sohbete koyma.

```sh
node admin-tools/premium.mjs GERCEK_OYUNCU_UID grant
node admin-tools/premium.mjs GERCEK_OYUNCU_UID revoke
```

`grant`, aktif bitişten (veya bitmişse bugünden) **bir takvim yılı uzatır**. Aynı ödeme için komutu tekrar çalıştırma; her çalıştırma bir yıl daha ekler. Komut kullanıcı UID’sinin varlığını ve kayıtlı sağlayıcı hesabını doğrular. Bu komut bu çalışma sırasında hiçbir gerçek kullanıcı için çalıştırılmadı.

## Satış koşulları

Mağazada **99,99 TL / yıl**, sınırsız Harf aç, envanter/altın harcanmaması, hesapla kullanım, manuel aktivasyon ve otomatik yenileme olmaması açıkça yazılır. Premium harf açma ipucu kullanımı sayılır; ipucusuz göreve sayılmaz. Başka avantaj vaat edilmez.

Uygulama ödeme işlemez; kart/banka bilgisi toplamaz. Ücret kabul etmeden önce satıcı bilgileri, ödeme yöntemi, hizmet başlangıcı, yasal cayma/iade ve gerekli satış belgelerini senin tamamlaman gerekir. Gizlilik/koşullar metni, kanuni tüketici haklarını kaldırmaz. Bir mağazada (ör. Google Play) yayımlanacaksa o mağazanın ödeme politikaları ayrıca değerlendirilmelidir; bu paket mevcut GitHub APK dağıtımına yöneliktir.
