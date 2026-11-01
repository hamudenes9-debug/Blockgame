"""Cloud Shell fallback: publish only the Premium notice; no push messages.
Uses the signed-in administrator, never writes credentials to disk, preserves
other controls and announcements, and rejects concurrent document changes.
"""
import json
import subprocess
import urllib.request
import urllib.error
from urllib.parse import urlencode

NOTICE = {'id': 'premium-benefits-111', 'title': 'Premium yenilendi: 2× ödül ve kalıcı avatarlar!', 'body': '1.11.1 ile yıllık 99,99 TL Premium paketi yenilendi. Sınırsız Harf aç kaldırıldı. Yeni bölümün ilk tamamlamasında 2× altın ve 40 kupa; bayramla birleşince 80 kupa. Günlük keşif görevlerinde 2× altın, aynı ipucu ödülü. Premium aktifken açılan 4 saç, 4 kıyafet ve 4 şapka süre bitince de kalır. Ödül çarpanları çevrimiçi sunucu onayı ister; eski bakiyeleri katlamaz. Mevcut Premium bitiş tarihin değişmez. Satın alma ve önceki paketle ilgili sorular: tirezteknoloji@gmail.com.', 'startsAt': '2026-11-01T16:09:39.411369+00:00', 'endsAt': '2026-12-01T16:09:39.411369+00:00'}

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
    if int(document.get('fields',{}).get('minimumSchema',{}).get('integerValue',0)) < 5:
        raise ValueError('Önce 1.11.1 kurulumunu tamamla.')
    old = document.get("fields", {}).get("announcements", {}).get("arrayValue", {}).get("values", [])
    notices = [n for n in old if n.get("mapValue", {}).get("fields", {}).get("id", {}).get("stringValue") not in [NOTICE["id"], "premium-sales-20261101"]]
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
