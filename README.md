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

Güncellenen dosyada Google web OAuth istemcisi (`client_type: 3`) mevcut. Android OAuth istemcisi (`client_type: 1`) henüz bulunmuyor. Uygulamayı imzalayan sertifikanın SHA-1/SHA-256 parmak izleri Firebase Console'da yapılandırıldıktan sonra güncel dosya yeniden indirilmelidir. Android native giriş entegrasyonu eklendi; web Firebase yapılandırması ayrıdır. Firebase Console sertifika kaydı ve cihaz üstünde giriş testi gereklidir.
