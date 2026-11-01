# Kelime Seyyahı indirme sitesi

Oyunun Vite/Android girişinden bağımsız, bağımlılıksız statik tanıtım sitesi.

## Önizleme

Depo kökünden:

```sh
python3 -m http.server 4174 --bind 0.0.0.0 --directory download-site
```

`download-site/` klasörünün içeriği herhangi bir statik web barındırma hizmetine yüklenebilir. Bu çalışma alanındaki önizleme, kalıcı bir alan adı dağıtımı değildir. GitHub Pages veya başka bir hizmete otomatik dağıtım yapılmaz.

- Tüm indirme bağlantıları `https://github.com/hamudenes9-debug/Blockgame/releases/latest` adresine gider. Sürüm yükseldikçe bağlantıyı değiştirmek gerekmez.
- GitHub sayfasındaki Assets alanından `Kelime-Seyyahi.apk` indirilir. Sitede dosya barındırılmaz; Play Store/iOS bağlantısı iddia edilmez.
- 10 rota sekmesi klavye okları, Home/End ile kullanılabilir. Sık sorulan sorular yerel `details` öğeleriyle açılır.
- Görseller mevcut projeye ait özgün vektör sahnelerdir. Telefon tasviri temsilidir; aktif bir oyun değildir.
- Dış font isteği, takip betiği, form, analiz veya e-posta toplama yoktur.
- Oyun bilgileri 1.8.1 içeriğine dayanır: 64 aşama, 10 bölge. İçerik değiştiğinde metin ve rota sayıları da güncellenmelidir.

Instrument Serif ve DM Sans fontları yerel sunulur; lisansları `assets/fonts/` içindedir.
