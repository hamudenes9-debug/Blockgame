"""Owner-only Cloud Shell utilities; no credentials persisted and no live calls on install."""
import argparse
from datetime import datetime, timedelta, timezone
import json
import subprocess
import sys
from urllib.parse import quote, urlencode
import urllib.request
import urllib.error
import duyuru

BASE = duyuru.URL.rsplit('/operations/current', 1)[0]
HELP = '''Komutlar:
/Duyuru 'metin'                 Oyun içi duyuru
/bildirim 'metin'               Android push + oyun içi duyuru
/bakım aç 'mesaj'               Bakımı aç (/bakim ac da kullanılabilir)
/bakım kapat | durum | github   Bakımı kapat, oku veya GitHub'a devret
/premium ver UID 365            365 gün ekle (onay gerekir)
/premium durum UID             Premium durumunu oku
/premium iptal UID             Premium'u kapat (onay gerekir)
/oyuncu UID                    Buluttaki oyuncu özetini oku
/duyurular                     Duyuruları kimlikleriyle listele
/duyuru-sil KIMLIK             Duyuruyu kaldır (onay gerekir)
/durum                        Canlı ayar özetini oku
/yardım                       Bu liste (/yardim da kullanılabilir)
Verme, iptal ve silme için istenen ONAY metnini terminalde yaz.
Kurulum hiçbir canlı veriyi değiştirmez. Hedef proje: blockgame-46ae9.
'''


def unpack(value):
    for kind in ('stringValue', 'timestampValue', 'booleanValue'):
        if kind in value:
            return value[kind]
    if 'integerValue' in value:
        return int(value['integerValue'])
    if 'doubleValue' in value:
        return value['doubleValue']
    if 'mapValue' in value:
        return {k: unpack(v) for k, v in value['mapValue'].get('fields', {}).items()}
    if 'arrayValue' in value:
        return [unpack(v) for v in value['arrayValue'].get('values', [])]
    return None


def data(document):
    return {k: unpack(v) for k, v in (document or {}).get('fields', {}).items()}


def safe(value):
    # Escape terminal control sequences from player names and announcement text.
    return json.dumps(value, ensure_ascii=False)


def valid_uid(uid):
    if not uid or len(uid) > 128 or any(ord(c) < 33 for c in uid) or '/' in uid or uid in ('.', '..'):
        raise ValueError('Geçersiz UID. Oyuncunun Profil ekranındaki UID değerini kullan.')
    return uid


class Client:
    def __init__(self, token, opener=urllib.request.urlopen):
        self.token, self.opener = token, opener

    def request(self, url, method='GET', body=None):
        request = urllib.request.Request(url, method=method,
            headers={'Authorization': 'Bearer ' + self.token, 'Content-Type': 'application/json'},
            data=None if body is None else json.dumps(body).encode('utf-8'))
        with self.opener(request, timeout=30) as response:
            return json.load(response)

    def get(self, path):
        try:
            return self.request(BASE + '/' + path)
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
            raise

    def patch(self, path, document, fields):
        conditions = [('updateMask.fieldPaths', key) for key in fields]
        conditions.append(('currentDocument.updateTime', document['updateTime']) if document else ('currentDocument.exists', 'false'))
        # Never retry a grant after an uncertain response or a concurrency conflict.
        return self.request(BASE + '/' + path + '?' + urlencode(conditions), 'PATCH', {'fields': fields})

    def user(self, uid):
        result = self.request('https://identitytoolkit.googleapis.com/v1/projects/' + duyuru.PROJECT + '/accounts:lookup',
                              'POST', {'localId': [uid]})
        users = result.get('users', [])
        if len(users) != 1 or users[0].get('localId') != uid:
            raise ValueError('Firebase Authentication içinde bu UID bulunamadı; işlem yapılmadı.')
        return users[0]


def expiry(value):
    if not isinstance(value, str):
        raise ValueError('Premium bitiş tarihi geçersiz; kayıt değiştirilmedi.')
    result = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None:
        raise ValueError('Premium bitiş tarihi saat dilimi içermiyor.')
    return result


def premium_status(record, now=None):
    now = now or datetime.now(timezone.utc)
    end = expiry(record['expiresAt']) if record.get('expiresAt') else None
    active = record.get('enabled') is True and end is not None and end > now
    print('Premium:', 'AKTİF' if active else 'PASİF')
    print('Bitiş (saat dilimi dahil):', end.isoformat() if end else 'Yok')


def confirm(identifier, reader=input):
    expected = 'ONAY ' + identifier
    print('Devam etmek için aynen yaz:', safe(expected))
    try:
        accepted = reader('> ') == expected
    except EOFError:
        accepted = False
    if not accepted:
        raise ValueError('Onay verilmedi; hiçbir kayıt değiştirilmedi.')


def premium(client, action, uid, days=None, reader=input, now=None):
    valid_uid(uid)
    now = now or datetime.now(timezone.utc)
    if action not in ('ver', 'durum', 'iptal'):
        raise ValueError('Geçersiz Premium işlemi.')
    if action == 'ver' and (type(days) is not int or not 1 <= days <= 3650):
        raise ValueError('Gün sayısı 1–3650 arasında tam sayı olmalı.')
    user = client.user(uid)
    print('UID:', safe(uid), '| Oyuncu:', safe(user.get('displayName', 'İsimsiz oyuncu')))
    path = 'premium/' + quote(uid, safe='')
    document = client.get(path)
    record = data(document)
    premium_status(record, now)
    if action == 'durum':
        return
    fields = {'enabled': {'booleanValue': action == 'ver'}, 'updatedAt': {'timestampValue': now.isoformat()}}
    if action == 'ver':
        if not user.get('providerUserInfo') or user.get('disabled'):
            raise ValueError('Premium yalnızca engellenmemiş, giriş yöntemi bağlı hesaba verilebilir.')
        base = max(now, expiry(record['expiresAt'])) if record.get('enabled') is True and record.get('expiresAt') else now
        end = base + timedelta(days=days)
        fields['expiresAt'] = {'timestampValue': end.isoformat()}
        print('Eklenecek gün:', days, '| Yeni bitiş:', end.isoformat())
    elif not document or record.get('enabled') is not True:
        print('Zaten kapalı; yazma yapılmadı.')
        return
    else:
        print('Premium kapatılacak. Kalıcı kozmetikler ve eski bitiş tarihi korunacak.')
    confirm(uid, reader)
    client.patch(path, document, fields)
    print('BAŞARILI: Premium ayarı kaydedildi. /premium durum ile kontrol edebilirsin.')


def require_operations(client):
    document = client.get('operations/current')
    if not document:
        raise ValueError('Canlı sistem kurulumu eksik: operations/current bulunamadı.')
    record = data(document)
    if not isinstance(record.get('announcements'), list):
        raise ValueError('Duyuru listesi geçersiz; işlem yapılmadı.')
    return document, record


def delete_notice(client, identifier, reader=input):
    document, record = require_operations(client)
    matches = [n for n in record['announcements'] if n.get('id') == identifier]
    if not matches:
        raise ValueError('Bu kimlikle duyuru bulunamadı; değişiklik yapılmadı.')
    if len(matches) != 1:
        raise ValueError('Tekrarlanan duyuru kimliği; işlem durduruldu.')
    removed = record.get('deletedAnnouncementIds', [])
    if not isinstance(removed, list) or any(not isinstance(x, str) for x in removed):
        raise ValueError('Silinen duyuru kaydı geçersiz.')
    removed = list(dict.fromkeys(removed + [identifier]))
    if len(removed) > 1000:
        raise ValueError('Silme geçmişi dolu; kaynak duyurular için yönetici bakımı gerekli.')
    print('Kaldırılacak duyuru:', safe(matches[0]))
    print('Gönderilmiş telefon bildirimleri geri çekilmez; başlamış gönderimler durdurulmaz.')
    confirm(identifier, reader)
    old = document['fields']['announcements']['arrayValue'].get('values', [])
    fields = {'announcements': {'arrayValue': {'values': [n for n in old if duyuru.notice_id(n) != identifier]}},
              'deletedAnnouncementIds': {'arrayValue': {'values': [{'stringValue': x} for x in removed]}}}
    client.patch('operations/current', document, fields)
    print('BAŞARILI: Duyuru kaldırıldı; aynı kimlik sonraki GitHub yayımında geri eklenmeyecek.')


def player(client, uid):
    valid_uid(uid)
    user = client.user(uid)
    print('UID:', safe(uid), '| Oyuncu:', safe(user.get('displayName', 'İsimsiz oyuncu')))
    save = client.get('playerSaves/' + quote(uid, safe=''))
    if save:
        record = data(save)
        state = record.get('state', {})
        trophy = state.get('trophies', {})
        points = sum(len(trophy.get(k, [])) for k in ('claimed', 'festival', 'premium', 'premiumFestival')) * 20 - trophy.get('prestige', 0) * 1000
        print('Buluttaki bölüm:', safe(state.get('stage')), '| Altın:', safe(state.get('wallet', {}).get('gold')))
        print('Kupa:', points, '| Prestij:', safe(trophy.get('prestige', 0)))
        print('Kayıt zamanı:', safe(record.get('updatedAt')))
    else:
        print('Bulut oyun kaydı yok; bu durum hesabın bulunmadığı anlamına gelmez.')
    premium_status(data(client.get('premium/' + quote(uid, safe=''))))
    print('Yalnızca kayıtlı bulut verileri gösterilir; henüz eşitlenmemiş çevrimdışı ilerleme dahil değildir.')


def main(args=None):
    parser = argparse.ArgumentParser(prog='Seyyah komutları', description=HELP, formatter_class=argparse.RawTextHelpFormatter)
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('premium'); p.add_argument('action', choices=['ver', 'durum', 'iptal']); p.add_argument('uid'); p.add_argument('days', nargs='?', type=int)
    p = sub.add_parser('oyuncu'); p.add_argument('uid')
    p = sub.add_parser('duyuru-sil'); p.add_argument('identifier')
    for name in ('duyurular', 'durum', 'yardım', 'yardim'):
        sub.add_parser(name)
    options = parser.parse_args(sys.argv[1:] if args is None else args)
    if options.command in ('yardım', 'yardim'):
        print(HELP); return 0
    try:
        if hasattr(options, 'uid'):
            valid_uid(options.uid)
        if options.command == 'premium':
            if (options.action == 'ver' and (options.days is None or not 1 <= options.days <= 3650)) or (options.action != 'ver' and options.days is not None):
                raise ValueError('Kullanım: /premium ver UID 365 | /premium durum UID | /premium iptal UID')
        if options.command == 'duyuru-sil' and (not options.identifier or len(options.identifier) > 200 or any(ord(c) < 33 for c in options.identifier)):
            raise ValueError('Geçersiz duyuru kimliği.')
        token = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True).strip()
        if not token:
            raise ValueError('Google yetkilendirmesi tamamlanmadı.')
        client = Client(token)
        if options.command == 'premium':
            premium(client, options.action, options.uid, options.days)
        elif options.command == 'oyuncu':
            player(client, options.uid)
        elif options.command == 'duyuru-sil':
            delete_notice(client, options.identifier)
        else:
            _, record = require_operations(client)
            if options.command == 'duyurular':
                print('Duyuru sayısı:', len(record['announcements']))
                for notice in record['announcements']:
                    print(safe(notice))
            else:
                print('Proje:', duyuru.PROJECT)
                print('Bakım:', safe(record.get('maintenance')))
                print('Bakım yönetimi:', 'Cloud Shell' if record.get('maintenanceOverride') is True else 'GitHub')
                print('Minimum sürüm:', safe(record.get('minimumVersion')), '| Şema:', safe(record.get('minimumSchema')))
                print('Duyuru sayısı:', len(record['announcements']), '| Bayram sistemi:', safe(record.get('holidaysEnabled')))
        return 0
    except urllib.error.HTTPError as error:
        print('İşlem doğrulanamadı. HTTP:', error.code, file=sys.stderr)
        print('401/403: yönetici yetkisini kontrol et. 409/412: kayıt eşzamanlı değişti.', file=sys.stderr)
    except (ValueError, OverflowError) as error:
        print(str(error), file=sys.stderr)
    except (OSError, KeyError, TypeError, subprocess.CalledProcessError):
        print('Bağlantı, yetkilendirme veya kayıt biçimi hatası; işlem doğrulanamadı.', file=sys.stderr)
    print('Özellikle Premium verme işlemini körlemesine tekrarlama: önce /premium durum UID veya /duyurular ile sonucu kontrol et.', file=sys.stderr)
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
