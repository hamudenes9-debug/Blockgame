"""Cloud Shell /bildirim: in-app notice + permission-registered Android FCM.
Uses the owner's gcloud token. No FCM token is logged or saved by this command.
FCM submissions are never retried after uncertain responses.
"""
import collections
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
import subprocess
import sys
import threading
import urllib.request
import urllib.error
from urllib.parse import urlencode, quote
import duyuru

ROOT = 'https://firestore.googleapis.com/v1/projects/' + duyuru.PROJECT + '/databases/(default)/documents'
FCM = 'https://fcm.googleapis.com/v1/projects/' + duyuru.PROJECT + '/messages:send'
PAGE_SIZE = 200


def request_json(url, token, body, method='POST', opener=urllib.request.urlopen):
    request = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'},
        data=json.dumps(body).encode('utf-8'), method=method)
    with opener(request, timeout=30) as response:
        return json.load(response)


def device_pages(token, opener=urllib.request.urlopen, uid=None):
    if uid is not None:
        from yonetim import valid_uid
        valid_uid(uid)
    parent = ROOT if uid is None else ROOT + '/users/' + quote(uid, safe='')
    cursor = None
    while True:
        query = {'from': [{'collectionId': 'devices', 'allDescendants': uid is None}],
                 'orderBy': [{'field': {'fieldPath': '__name__'}, 'direction': 'ASCENDING'}], 'limit': PAGE_SIZE}
        if cursor:
            query['startAt'] = {'values': [{'referenceValue': cursor}], 'before': False}
        rows = request_json(parent + ':runQuery', token, {'structuredQuery': query}, opener=opener)
        if not isinstance(rows, list):
            raise ValueError('Geçersiz cihaz sorgusu yanıtı.')
        documents = [row['document'] for row in rows if isinstance(row, dict) and 'document' in row]
        if not documents:
            return
        next_cursor = documents[-1]['name']
        if next_cursor == cursor:
            raise ValueError('Cihaz sorgusu ilerlemedi; gönderim durduruldu.')
        yield documents
        if len(documents) < PAGE_SIZE:
            return
        cursor = next_cursor


def device_token(document, uid=None):
    prefix = 'projects/' + duyuru.PROJECT + '/databases/(default)/documents/'
    name = document.get('name', '')
    if not name.startswith(prefix):
        return None
    path = name[len(prefix):].split('/')
    if len(path) != 4 or path[0] != 'users' or path[2] != 'devices' or not path[1] or not path[3]:
        return None
    if uid is not None and path[1] != uid:
        return None
    fields = document.get('fields', {})
    value = fields.get('token', {}).get('stringValue')
    if fields.get('platform', {}).get('stringValue') != 'android' or not isinstance(value, str) or not value.strip() or len(value) > 4096:
        return None
    return value


def send_one(device, notice, token, stopped, opener=urllib.request.urlopen):
    if stopped.is_set():
        return 'skipped'
    body = {'message': {'token': device, 'notification': {'title': notice['title'], 'body': notice['body']},
        'data': {'route': 'news', 'noticeId': notice['id']},
        'android': {'priority': 'HIGH', 'restrictedPackageName': 'com.blokko.game', 'ttl': '86400s', 'collapseKey': notice['id'],
                    'notification': {'channelId': 'news', 'tag': notice['id']}}}}
    try:
        response = request_json(FCM, token, body, opener=opener)
        if isinstance(response, dict) and isinstance(response.get('name'), str) and response['name']:
            return 'accepted'
        stopped.set()
        return 'uncertain'
    except urllib.error.HTTPError as error:
        # Permission/API/quota/global service failures must not bombard all devices.
        if error.code in (401, 403, 429) or error.code >= 500:
            stopped.set()
        return 'failed'
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        # May have reached FCM. Do not blindly retry and duplicate the notification.
        stopped.set()
        return 'uncertain'


def dispatch(notice, token, opener=urllib.request.urlopen, workers=5, uid=None):
    if uid is not None:
        from yonetim import valid_uid
        valid_uid(uid)
    identifier = notice['id']
    now = datetime.now(timezone.utc).isoformat()
    # A failed/uncertain reservation aborts BEFORE any push is sent.
    request_json(ROOT + '/notificationDeliveries?' + urlencode({'documentId': identifier}), token,
        {'fields': {'status': {'stringValue': 'sending'}, 'source': {'stringValue': 'cloud-shell-test' if uid is not None else 'cloud-shell'},
                    **({'targetUid': {'stringValue': uid}} if uid is not None else {}),
                    'startedAt': {'timestampValue': now}}}, opener=opener)
    counts = collections.Counter(accepted=0, failed=0, uncertain=0, skipped=0)
    seen = set()
    stopped = threading.Event()
    scan_complete = False
    try:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            for documents in device_pages(token, opener, uid):
                targets = []
                for document in documents:
                    target = device_token(document, uid)
                    if target and target not in seen:
                        seen.add(target)
                        targets.append(target)
                for result in executor.map(lambda value: send_one(value, notice, token, stopped, opener), targets):
                    counts[result] += 1
                if stopped.is_set():
                    break
            else:
                scan_complete = True
    except (urllib.error.URLError, TimeoutError, OSError, ValueError, KeyError):
        stopped.set()
    fields = {'status': {'stringValue': 'finished' if scan_complete and not counts['uncertain'] and not counts['failed'] else 'partial'},
              'scanComplete': {'booleanValue': scan_complete},
              'finishedAt': {'timestampValue': datetime.now(timezone.utc).isoformat()},
              **{key: {'integerValue': str(value)} for key, value in counts.items()}}
    recorded = True
    try:
        query = urlencode([('updateMask.fieldPaths', key) for key in fields])
        request_json(ROOT + '/notificationDeliveries/' + identifier + '?' + query, token, {'fields': fields}, method='PATCH', opener=opener)
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        recorded = False
    return dict(counts), scan_complete, recorded


def main(args=None):
    args = sys.argv[1:] if args is None else args
    if not args or args == ['--help']:
        print("Kullanım: /bildirim 'Bildirim metni'")
        print('En fazla 500 karakter birimi. Oyun içi duyuru + kayıtlı Android cihazlarına push. FCM kabulü, telefona teslim edildiği anlamına gelmez.')
        return 0 if args else 2
    announced = False
    try:
        text = ' '.join(args).strip()
        if len(text.encode('utf-16-le')) // 2 > 500:
            raise ValueError('Bildirim metni en fazla 500 karakter olabilir.')
        notice = duyuru.make_notice(text)
        notice['id'] = notice['id'].replace('shell-', 'shell-push-', 1)
        token = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True).strip()
        if not token:
            raise ValueError('Google yetkilendirmesi tamamlanmadı.')
        duyuru.publish(notice, token)
        announced = True
        print('Oyun içi duyuru yayımlandı. Gönderim kimliği:', notice['id'])
        counts, complete, recorded = dispatch(notice, token)
        print('FCM tarafından kabul edilen:', counts['accepted'])
        print('Başarısız:', counts['failed'], '| Sonucu belirsiz:', counts['uncertain'], '| Atlanan:', counts['skipped'])
        if not complete:
            print('Gönderim/tarama tamamlanmadı. Yetki, Firebase Cloud Messaging API, bağlantı ve kotaları kontrol et. Aynı mesajı körlemesine tekrar gönderme.')
        elif not any(counts.values()):
            print('Kayıtlı Android bildirim cihazı bulunamadı. Oyuncular Profil’den duyuru bildirimlerini açmalı.')
        if not recorded:
            print('Gönderim özeti kaydedilemedi; bu nedenle aynı mesajı yeniden gönderme.')
        print('FCM kabulü teslimat kanıtı değildir. Android izinleri, internet, pil ayarları ve zorla durdurma teslimatı etkiler.')
        return 0 if complete and recorded and not counts['failed'] and not counts['uncertain'] and not counts['skipped'] else 1
    except urllib.error.HTTPError as error:
        print('İşlem tamamlanamadı. HTTP hata kodu:', error.code, file=sys.stderr)
        print('Proje yöneticisi hesabı, Firestore ve Firebase Cloud Messaging API yetkilerini kontrol et.', file=sys.stderr)
    except subprocess.CalledProcessError:
        print('Google yetkilendirmesi tamamlanmadı.', file=sys.stderr)
    except (ValueError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
    except (OSError, KeyError, TypeError):
        print('Gönderim doğrulanamadı. Bağlantı ve canlı kurulumu kontrol et.', file=sys.stderr)
    if announced:
        print('Oyun içi duyuru zaten yayımlandı; push tamamlanmamış olabilir. Tekrar gönderirken çift bildirim riskine dikkat et.', file=sys.stderr)
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
