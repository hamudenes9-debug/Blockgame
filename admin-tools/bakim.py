"""Cloud Shell maintenance control. No player, entitlement or rules writes."""
import argparse
import json
import subprocess
import sys
from urllib.parse import urlencode
import urllib.request
import urllib.error
import duyuru

SOURCE = 'https://raw.githubusercontent.com/hamudenes9-debug/Blockgame/arena/d699cecb-blockgame/operations/live.json'
DEFAULT_MESSAGE = 'Oyunumuz bakımda. Biraz sonra tekrar dene.'


def clean_maintenance(value):
    if not isinstance(value, dict) or type(value.get('enabled')) is not bool:
        raise ValueError('Bakım ayarı geçersiz; hiçbir ayar değiştirilmedi.')
    result = {'enabled': value['enabled']}
    for key, limit in [('message', 1000), ('until', 100)]:
        text = value.get(key, '')
        if not isinstance(text, str) or len(text.encode('utf-16-le')) // 2 > limit:
            raise ValueError('Bakım mesajı en fazla 1000, bitiş açıklaması en fazla 100 karakter olabilir.')
        result[key] = text
    return result


def encode(value):
    return {'mapValue': {'fields': {
        'enabled': {'booleanValue': value['enabled']},
        'message': {'stringValue': value['message']},
        'until': {'stringValue': value['until']}}}}


def decode(document):
    fields = document.get('fields', {}).get('maintenance', {}).get('mapValue', {}).get('fields', {})
    return clean_maintenance({'enabled': fields.get('enabled', {}).get('booleanValue'),
        'message': fields.get('message', {}).get('stringValue', ''),
        'until': fields.get('until', {}).get('stringValue', '')})


def control(action, token, message='', until='', opener=urllib.request.urlopen):
    desired = None
    if action == 'aç':
        desired = clean_maintenance({'enabled': True, 'message': message or DEFAULT_MESSAGE, 'until': until})
    elif action == 'kapat':
        desired = clean_maintenance({'enabled': False})
    elif action == 'github':
        # Never send the Google OAuth credential to the public GitHub source.
        with opener(SOURCE, timeout=30) as response:
            desired = clean_maintenance(json.load(response).get('maintenance'))
    elif action != 'durum':
        raise ValueError('Geçersiz işlem.')
    headers = {'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
    for _ in range(3):
        with opener(urllib.request.Request(duyuru.URL, headers=headers), timeout=30) as response:
            document = json.load(response)
        current = decode(document)
        override = document.get('fields', {}).get('maintenanceOverride', {}).get('booleanValue', False)
        if desired is None:
            return current, override
        manual = action != 'github'
        if current == desired and override == manual:
            return current, override
        body = {'fields': {'maintenance': encode(desired), 'maintenanceOverride': {'booleanValue': manual}}}
        query = urlencode([('updateMask.fieldPaths','maintenance'), ('updateMask.fieldPaths','maintenanceOverride'),
                           ('currentDocument.updateTime', document['updateTime'])])
        request = urllib.request.Request(duyuru.URL + '?' + query, headers=headers, method='PATCH', data=json.dumps(body).encode('utf-8'))
        try:
            with opener(request, timeout=30) as response:
                response.read()
            return desired, manual
        except urllib.error.HTTPError as error:
            if error.code not in (409, 412):
                raise
        except (urllib.error.URLError, TimeoutError):
            # Reread before retrying. This is an idempotent state change, not a broadcast.
            continue
    raise ValueError('Bakım değişikliği doğrulanamadı. /bakım durum ile kontrol et.')


def main(args=None):
    parser = argparse.ArgumentParser(prog='/bakım', description='Bakım modunu aç, kapat veya durumunu gör. Tek başına kullanılırsa sadece durumu okur.')
    parser.add_argument('islem', nargs='?', default='durum', choices=['aç','ac','kapat','durum','github'])
    parser.add_argument('mesaj', nargs='*', help='Bakım ekranındaki açıklama')
    parser.add_argument('--bitis', default='', help='Tahmini bitiş açıklaması; otomatik kapatma yapmaz')
    options = parser.parse_args(sys.argv[1:] if args is None else args)
    action = 'aç' if options.islem == 'ac' else options.islem
    if action != 'aç' and (options.mesaj or options.bitis):
        parser.error('Mesaj ve --bitis yalnızca aç işlemiyle kullanılır.')
    try:
        # Validate all text before requesting credentials or making any write.
        message = ' '.join(options.mesaj).strip()
        if action == 'aç':
            clean_maintenance({'enabled':True,'message':message or DEFAULT_MESSAGE,'until':options.bitis})
        token = subprocess.check_output(['gcloud','auth','print-access-token'], text=True).strip()
        if not token:
            raise ValueError('Google yetkilendirmesi tamamlanmadı.')
        state, manual = control(action, token, message, options.bitis)
        if action != 'durum':
            print('BAŞARILI: Bakım ayarı doğrulandı.')
        print('Bakım:', 'AÇIK' if state['enabled'] else 'KAPALI')
        print('Yönetim:', 'Cloud Shell' if manual else 'GitHub')
        if state['enabled']:
            print('Mesaj:', state['message'])
            if state['until']:
                print('Tahmini bitiş:', state['until'], '(otomatik kapanmaz)')
        print('Çevrimiçi oyuncuların sonraki başarılı ayar kontrolünde uygulanır. Çevrimdışı oyunu uzaktan kilitlemez; bildirim göndermez.')
        return 0
    except urllib.error.HTTPError as error:
        print('İşlem doğrulanamadı. HTTP hata kodu:', error.code, file=sys.stderr)
        print('Yönetici hesabını, kaynak bağlantısını ve operations/current kurulumunu kontrol et.', file=sys.stderr)
    except subprocess.CalledProcessError:
        print('Google yetkilendirmesi tamamlanmadı.', file=sys.stderr)
    except (ValueError, KeyError, TypeError, OSError):
        print('İşlem doğrulanamadı. Bağlantı ve bakım alanlarını kontrol et; /bakım durum ile sonucu oku. Mesaj en fazla 1000, bitiş açıklaması 100 karakter olabilir.', file=sys.stderr)
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
