# Blokko

Türkçe, mobil uyumlu renkli blok bulmacası. Klasik, 120 saniyelik süreli ve UTC tarihine göre aynı parça dizisini üreten günlük mod. 8×8 tahta, eşzamanlı satır/sütun temizleme, kombo puanları, ses, duraklatma, yerel skorlar ve istatistikler.

## Çalıştır

```sh
npm ci
npm run dev
npm test
npm run build
```

Bir parçaya dokun, ardından tahtada parçanın sol üst köşesini yerleştir. Dolu satır/sütunlar temizlenir. Üç parça kullanıldığında yenileri gelir. Hiçbir parça sığmıyorsa oyun biter. Arka plana geçildiğinde oyun duraklar. Yerel kayıtlar son 100 oyunu kapsar; tarayıcı verileri silinirse kaybolur.

## Android APK

`android/` gerçek Capacitor Android projesidir. Java 21 ve Android SDK gereklidir.

```sh
npm run android:sync
cd android
./gradlew assembleDebug
```

Çıktı: `android/app/build/outputs/apk/debug/app-debug.apk`.

`.github/workflows/android.yml` bu dal GitHub'a gönderildiğinde veya elle çalıştırıldığında debug APK üretir; başarılı işin **Blokko-Android-APK** artifact'ını indirip içindeki APK'yı Android'e yükleyebilirsin. Debug APK test içindir; Play Store yayını için ayrı release imzası ve AAB gereklidir. Bu çalışma ortamında Java/Android SDK bulunmadığından APK yerelde derlenmemiştir.

## Google giriş ve çevrimiçi sıralama

Varsayılan sürüm misafir modunda tamamen oynanabilir. Örnek/düzmece sıralama içermez. Gerçek Google girişi için:

1. Firebase projesi aç, web uygulaması ekle.
2. Authentication > Google sağlayıcısını etkinleştir; web uygulamasının alan adını yetkili alan adlarına ekle.
3. `.env.example` dosyasını `.env.local` olarak kopyalayıp Firebase web yapılandırmasını doldur.
4. Firestore oluştur ve `firestore.rules` kurallarını yayınla.
5. Yeniden derle. Firebase anahtarları istemci yapılandırmasıdır; servis hesabı veya özel anahtar ekleme.

Web Google girişi Firebase popup akışını kullanır ve web `.env.local` ayarlarını gerektirir. Android ise `@capacitor-firebase/authentication` ile native Google hesap seçimini kullanır. Alınan Google ID token, JavaScript Firebase Auth oturumuna çevrilir; Firestore da aynı oturumu kullanır. Android istemci yapılandırması `google-services.json` dosyasından `prebuild` adımında üretilir.

Android girişinin cihazda çalışması için APK sertifikasının SHA-1 ve SHA-256 değerlerini Firebase Console > Proje ayarları > Android uygulaması > Parmak izi ekle alanına kaydet. İş akışı bu değerleri `firebase-fingerprints.txt` olarak APK ile birlikte ve iş özetinde verir. Google Play Hizmetleri olan bir cihaz gerekir. Gerçek cihazda başarılı giriş henüz doğrulanmamıştır.

Test imzalama anahtarı Actions cache içinde korunur; repoya veya APK artifact'ına özel anahtar konmaz. Cache silinir/sona ererse sertifika değişir: yeni parmak izleri eklenmeli ve önceki APK kaldırılmalıdır (yerel skorlar silinir). Bu düzen üretim imzalama yerine geçmez; Play Store yayını için erişimi kontrollü kalıcı release anahtarı / Play App Signing gerekir.

Çevrimiçi skorlar Firebase oturumu olan kullanıcılar tarafından gönderilir. Yerel olarak saklanan profil kimlik doğrulama sağlamaz. Firestore kuralları alanları denetler ancak oyun sonuçlarının doğruluğunu doğrulamaz; rekabetçi sıralama için sunucu taraflı doğrulama ve kötüye kullanım önleme eklenmelidir. Günlük mod tekrar oynanabilir; tek denemeli yarışma değildir.

### Android Firebase kayıt durumu

`android/app/google-services.json` eklendi. Firebase projesi: `blockgame-46ae9`; Android paket adı: `com.blokko.game`. Gradle Google Services eklentisi dosyayı işler. Bu dosya istemci yapılandırmasıdır, servis hesabı özel anahtarı değildir.

Güncellenen dosyada Google web OAuth istemcisi (`client_type: 3`) mevcut. Android OAuth istemcisi (`client_type: 1`) güncel dosyada mevcut; SHA-1 değeri test imzasıyla eşleşiyor. İş akışı artık üretilen APK sertifikasını Android OAuth istemcisiyle karşılaştırır ve eşleşmiyorsa dağıtımı durdurur. Android native giriş entegrasyonu eklendi; web Firebase yapılandırması ayrıdır. Firebase Console sertifika kaydı ve cihaz üstünde giriş testi gereklidir.

Sürüm 1.1.2: güncel Firebase Android OAuth yapılandırması ve aşama/hata kodu içeren giriş teşhisi. Yapılandırmanın eşleşmesi, cihaz üstünde giriş başarısının doğrulandığı anlamına gelmez.

## 1.2.0 — Blok avı

Yeni varsayılan modda bloklar yukarıdan düşer. Oyun alanında basılı tutarak ateş et, sürükleyerek topu taşı. Ayrı yön/ateş düğmeleri ve klavyede yön tuşları + boşluk da desteklenir. Her kaçan blok bir can azaltır; üç can bittiğinde oyun sona erer. Sayılar blok dayanıklılığıdır. Her 12 blokta dalga artar. Arka plana geçerken ve hesap/sıralama pencereleri açılınca duraklar. Eski bulmaca modları korunur.

Yerel skorlar otomatik saklanır. **Yeni `shooter` modunun çevrimiçi skorları için güncellenmiş `firestore.rules` Firebase Console'da yayınlanmalıdır.** Bu değişiklik Google giriş ayarlarını değiştirmez. Kurallar bu çalışma ortamından otomatik yayınlanmamıştır.

## 1.3.0 — Tek mod, aşamalar ve boss

Artık arayüzde yalnızca Blok avı vardır; klasik/süreli/günlük bulmaca ekranları kaldırılmıştır. Mobilde sabit Anasayfa / Sıralama / Profil menüsü bulunur. Ana sayfa mevcut aşamayı, tamamlanan ve kilitli aşamaları gösterir. Her aşamada 12 blok vurulduktan sonra hareket eden, can çubuğu olan ve oyuncuya atış yapan boss gelir. Boss yenilince sonraki aşama açılır. Kaybedilen aşama yeniden denenebilir; kilitli aşama seçilemez.

İlerleme `blokko-stage` anahtarında cihazda kaydedilir; hesap bazlı bulut eşitlemesi değildir. Eski yerel kayıtlar korunur, yeni sıralama yalnızca Blok avı kayıtlarını gösterir. Profilde mevcut Google hesabı, aşama ve yerel istatistikler yer alır. Google OAuth/imza ayarları değiştirilmemiştir. Oyundan menüye çıkmak o turu sonlandırır ve skorunu kaydeder; tamamlanmamış aşamayı açmaz.

Kontroller: 22 birim testi; 390×844 dokunmatik Chromium görünümünde misafir girişi, ana sayfa, oyun başlatma/duraklatma ve üç alt menü arasında gezinme kontrol edildi. Konsol hatası ve yatay taşma görülmedi. Gerçek Android cihazda yeni sürümün boss mücadelesi ayrıca denenmelidir.

## 1.3.1 — Çevrimiçi skor teşhisi

Dünya sıralaması yalnızca sunucudan okunur (`getDocsFromServer`); 12 saniye sonra yanıt alınamazsa yükleniyor ekranı yerine hata ve tekrar deneme düğmesi gösterilir. Skor yazımı Google oturumunu bekler; oturum yoksa sessizce başarılı sayılmaz. Sıralama ekranında bu cihazın son skor gönderimi ve sunucu onayı durumu saklanır. Zaman aşımı yazımı iptal etmez; bu durumda kayıt başarılı/başarısız diye kesin bildirim yapılmaz. Eski yerel skorlar kendiliğinden yüklenmez; kurulumdan sonra yeni oyun tamamlayarak dene.

Canlı Firebase projesinin yönetim erişimi bu ortamda yoktur. Projede **Firestore Database / (default)** oluşturulmalı, `firestore.rules` Rules sekmesinde yayınlanmalıdır. Google Authentication bunun yerine geçmez. Veritabanı kurulmadıysa veya kurallar reddediyorsa yalnızca APK güncellemek yetmez. Üretimde `allow read, write: if true` gibi herkese yazma açan kurallar kullanma.

Dünya ekranı en yüksek 20 sunucu kaydı içinden `shooter` modundakileri gösterir, anlık abonelik değildir; Dünya'ya tekrar dokunmak yeniler. Sonucun diğer cihazda görülmesi sunucu yazım onayı ve yeterli sıralama puanı gerektirir. Her kullanıcının tek en yüksek puanının tutulması ve sunucuda hile doğrulaması henüz uygulanmamıştır.

## 1.4.0 — Altın, mağaza, bilgilendirme ve sürüm kontrolü

- Her vurulan blok 5 altın, boss zaferi ayrıca 50 altın kazandırır. Tur sonunda, menüye çıkışta veya yeniden başlatmada kaydedilir. Tur kimliğiyle aynı ödülün iki kez eklenmesi önlenir (son 200 tur). Uygulamanın zorla kapatılması o turun henüz kaydedilmemiş ödülünü kaybettirebilir.
- Mağaza: hızlı ateş (3 seviye), güçlü mermi (2), ekstra can (2). Satın alma onaylıdır; yetersiz bakiye ve maksimum seviye engellenir. Geliştirmeler oyun motorunda gerçek atış aralığını/hasarı/başlangıç canını değiştirir. Gerçek para yoktur. Cüzdan cihaz bazlıdır, hesaba göre ayrılmaz, bulut eşitlemesi ve hile koruması yoktur.
- Google girişinden sonra metin sürümü + UID bazında kullanım koşulları kabulü ve gizlilik bilgilendirmesi gösterilir. İki kutu başlangıçta boştur. Reddetmek Google oturumundan çıkarır. Metinler giriş ekranından ve Profil'den yeniden okunabilir. Misafir seçeneği korunmuştur.
- `src/legal.js` mevcut veri akışlarını açıklayan ürün metinleridir; hukuki uyumluluk garantisi değildir. Yayıncı, gerçek tüzel kişi bilgileri/uygulanacak mevzuat, hizmet sağlayıcıları ve veri silme sürecini incelemeli ve gerektiğinde hukuk uzmanına kontrol ettirmelidir. Yayıncı iletişimi: Tirezteknoloji@gmail.com.
- Her soğuk açılışta yükleme ekranı ve GitHub public Releases API kontrolü yapılır. Kontrol en fazla 5 saniye sürer, hata/çevrimdışı/limit aşımı oyunu engellemez. Profil'den yeniden kontrol edilebilir. Yeni sürüm yalnızca kullanıcı onayıyla sistem tarayıcısında GitHub yayın sayfasına yönlendirir; APK otomatik indirilmez/kurulmaz. Uygulamayı arka plandan öne getirmek yeni soğuk açılış sayılmaz.
- CI artık imza kontrolünden geçmiş `Blokko.apk` ve `SHA256SUMS.txt` dosyalarını GitHub Release'e yayınlar. Uygulama yalnızca kararlı yayınları kontrol eder; test derleme artifact'larını güncelleme saymaz. Repo herkese açık kalmalıdır; uygulamaya GitHub token konmamıştır.
- Yeni sürüm yayınlarken `package.json` + lock, `src/version.js`, Android `versionName` / `versionCode` ve hata mesajı sürümünü artır. Var olan yayın üzerine yazılmaz. APK hâlâ test/debug anahtarıyla imzalıdır; mağaza dağıtımı için production signing süreci ayrıdır.

Doğrulama: 38 birim testi; 390×844 dokunmatik Chromium'da yükleme ekranı, koşul kutuları ve kabulün yeniden açılışta korunması, üç mağaza satın alması/bakiye düşümü, +1 canın oyunda görünmesi, destek mailto bağlantısı, örnek daha yeni sürüm bildirimi, çevrimdışı geri dönüş ve yatay taşma kontrolü. GitHub cevapları tarayıcı testinde kontrollü taklit edildi; gerçek cihazda Google girişi ve sistem tarayıcısından güncelleme kurulumu ayrıca denenmelidir.
