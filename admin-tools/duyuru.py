"""Cloud Shell /Duyuru: publish an in-app notice using the signed-in owner.
No credentials are stored. Only operations/current.announcements is patched.
"""
import json
import subprocess
import sys
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
import urllib.request
import urllib.error

PROJECT = 'blockgame-46ae9'
URL = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/operations/current'


def field(value):
    if isinstance(value, str):
        return {'stringValue': value}
    return {'mapValue': {'fields': {key: field(item) for key, item in value.items()}}}


def make_notice(text, now=None, identifier=None):
    text = text.strip()
    if not text:
        raise ValueError('Metin boş olamaz. Örnek: /Duyuru "Merhaba seyyahlar!"')
    # The app truncates strings using JavaScript UTF-16 length.
    if len(text.encode('utf-16-le')) // 2 > 2000:
        raise ValueError('Duyuru metni en fazla 2000 karakter olabilir.')
    now = now or datetime.now(timezone.utc)
    return {'id': identifier or 'shell-' + uuid.uuid4().hex,
            'title': 'Seyyah Postası', 'body': text,
            'startsAt': now.isoformat(), 'endsAt': (now + timedelta(days=30)).isoformat(),
            'delivery': 'in-app'}


def notice_id(value):
    return value.get('mapValue', {}).get('fields', {}).get('id', {}).get('stringValue')


def publish(notice, token, opener=urllib.request.urlopen):
    headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
    last_error = None
    for _ in range(3):
        try:
            with opener(urllib.request.Request(URL, headers=headers), timeout=30) as response:
                document = json.load(response)
            encoded = document.get('fields', {}).get('announcements')
            if encoded is None or 'arrayValue' not in encoded:
                raise ValueError('Canlı duyuru alanı eksik/geçersiz. Önce canlı sistem kurulumunu tamamla.')
            old = encoded['arrayValue'].get('values', [])
            if not isinstance(old, list):
                raise ValueError('Duyuru listesi geçersiz; kayıt değiştirilmedi.')
            if any(notice_id(item) == notice['id'] for item in old):
                return  # A timed-out PATCH may already have succeeded.
            if len(old) >= 30:
                raise ValueError('30 duyuruluk liste dolu. Arşivden bir duyuruyu yönetici olarak kaldırmadan yenisi eklenemez. Hiçbir duyuru otomatik silinmedi.')
            payload = {'fields': {'announcements': {'arrayValue': {'values': old + [field(notice)]}}}}
            query = urlencode({'updateMask.fieldPaths': 'announcements', 'currentDocument.updateTime': document['updateTime']})
            request = urllib.request.Request(URL + '?' + query, headers=headers,
                        data=json.dumps(payload).encode('utf-8'), method='PATCH')
            with opener(request, timeout=30) as response:
                response.read()
            return
        except urllib.error.HTTPError as error:
            if error.code not in (409, 412):
                raise
            last_error = error
        except (urllib.error.URLError, TimeoutError) as error:
            last_error = error
    raise RuntimeError('Yayım sonucu doğrulanamadı. Oyundaki Duyurular bölümünü kontrol et; aynı metni hemen yeniden gönderme.') from last_error


def main(args=None):
    args = sys.argv[1:] if args is None else args
    if not args or args == ['--help']:
        print('Kullanım: /Duyuru "Duyuru metni"')
        print('Oyun içinde 30 gün güncel görünür; sonra listeden silinene kadar arşivde kalır. Telefon push bildirimi göndermez.')
        return 0 if args else 2
    try:
        notice = make_notice(' '.join(args))
        token = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True).strip()
        if not token:
            raise ValueError('Google yetkilendirmesi tamamlanmadı.')
        publish(notice, token)
        print('BAŞARILI: Duyuru oyun içinde yayımlandı.')
        print('Kimlik:', notice['id'])
        print('Çevrimiçi oyuncuların sonraki başarılı ayar kontrolünde görünür. Yeni APK gerekmez.')
        return 0
    except urllib.error.HTTPError as error:
        print('Yayım doğrulanamadı. HTTP hata kodu:', error.code, file=sys.stderr)
        if error.code in (401, 403):
            print('Blockgame projesini yöneten Google hesabını ve Cloud Shell yetkilendirmesini kontrol et.', file=sys.stderr)
        elif error.code == 404:
            print('operations/current yok. Önce canlı sistem kurulumunu tamamla.', file=sys.stderr)
    except subprocess.CalledProcessError:
        print('Google yetkilendirmesi tamamlanamadı. Cloud Shell Authorize penceresini kontrol et.', file=sys.stderr)
    except (ValueError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
    except (OSError, KeyError, TypeError):
        print('İşlem doğrulanamadı. Cloud Shell bağlantısını ve canlı ayar belgesini kontrol et.', file=sys.stderr)
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
