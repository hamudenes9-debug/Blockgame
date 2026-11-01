"""Cloud Shell fallback: publish only the Premium notice; no push messages.
Uses the signed-in administrator, never writes credentials to disk, preserves
other controls and announcements, and rejects concurrent document changes.
"""
import json
import subprocess
import urllib.request
import urllib.error
from urllib.parse import urlencode

NOTICE = {'id': 'premium-sales-20261101', 'title': 'Premium satışları başlamıştır!', 'body': 'Premium Seyyah artık satışta! Yıllık 99,99 TL karşılığında Premium süresince sınırsız Harf aç özelliğini kullan; altın veya hazır ipucu harcama. Satın almak için Mağaza bölümünden iletişime geçebilir veya oyuncu UID’nle birlikte tirezteknoloji@gmail.com adresine yazabilirsin. Ödeme uygulama içinde alınmaz; satın alma doğrulandıktan sonra hesabın etkinleştirilir. Otomatik yenileme yoktur.', 'startsAt': '2026-11-01T15:14:35Z', 'endsAt': '2026-12-01T15:14:35Z'}

def field(value):
    if isinstance(value, str):
        return {"stringValue": value}
    return {"mapValue": {"fields": {k: field(v) for k, v in value.items()}}}

def main():
    token = subprocess.check_output(["gcloud", "auth", "print-access-token"], text=True).strip()
    headers = {"Authorization": "Bearer " + token, "Content-Type": "application/json"}
    url = "https://firestore.googleapis.com/v1/projects/blockgame-46ae9/databases/(default)/documents/operations/current"
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=30) as response:
        document = json.load(response)
    old = document.get("fields", {}).get("announcements", {}).get("arrayValue", {}).get("values", [])
    notices = [n for n in old if n.get("mapValue", {}).get("fields", {}).get("id", {}).get("stringValue") != NOTICE["id"]]
    notices.append(field(NOTICE))
    if len(notices) > 30:
        raise ValueError("Duyuru sınırı dolu; hiçbir kayıt değiştirilmedi.")
    body = {"fields": {"announcements": {"arrayValue": {"values": notices}}}}
    query = urlencode({"updateMask.fieldPaths": "announcements", "currentDocument.updateTime": document["updateTime"]})
    request = urllib.request.Request(url + "?" + query, data=json.dumps(body).encode(), headers=headers, method="PATCH")
    with urllib.request.urlopen(request, timeout=30) as response:
        response.read()
    print("BAŞARILI: Premium satış duyurusu uygulama içinde yayımlandı.")
    print("Diğer ayarlar ve oyuncu/Premium kayıtları değiştirilmedi. Kapalı uygulamaya push gönderilmedi.")

if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as error:
        print("Yayım doğrulanamadı. HTTP hata kodu:", error.code)
        if error.code in (409, 412):
            print("Belge değişmiş; güncel verilerle tekrar çalıştır.")
        raise SystemExit(1)
    except (subprocess.CalledProcessError, urllib.error.URLError, ValueError, KeyError):
        print("Yayım doğrulanamadı. Yetkilendirmeyi, bağlantıyı ve operations/current belgesini kontrol et.")
        raise SystemExit(1)
