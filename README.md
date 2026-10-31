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
