"""Owner-only timed reward event. Expiry is enforced by server request.time."""
import argparse
from datetime import datetime, timedelta, timezone
import subprocess
import sys
import uuid
import urllib.error
from yonetim import Client, require_operations, safe, confirm, expiry


def control(client, action, reader=input, now=None):
    fixed_clock = now is not None
    now = now or datetime.now(timezone.utc)
    document, record = require_operations(client)
    event = record.get('rewardEvent') or {}
    active = event.get('enabled') is True and expiry(event['startsAt']) <= now < expiry(event['endsAt'])
    print('Etkinlik:', 'AKTİF' if active else 'KAPALI / SONA ERMİŞ')
    if event.get('endsAt'):
        print('Bitiş:', safe(event['endsAt']))
    if action == 'durum':
        return
    if action == 'kapat':
        fields = {'enabled': {'booleanValue': False}}
        if not active:
            print('Aktif etkinlik yok; yazma yapılmadı.')
            return
        # Keep event ID and dates for diagnosis; only disable the window.
        fields = {**document['fields']['rewardEvent']['mapValue']['fields'], **fields}
        confirm('event-kapat', reader)
    else:
        if not action.isascii() or not action.isdecimal() or not 1 <= int(action) <= 10080:
            raise ValueError('Süre 1–10080 dakika arasında tam sayı olmalı.')
        if int(record.get('minimumSchema', 0)) < 6:
            raise ValueError('Önce 1.12.0 APK ve etkinlik sunucu güncellemesini kur. Şema 6 gerekli.')
        if active:
            raise ValueError('Bir etkinlik zaten açık. Önce /event kapat; süre sessizce uzatılmaz veya değiştirilmez.')
        end = now + timedelta(minutes=int(action))
        print('Süre:', action, 'dakika | Bitiş:', end.isoformat())
        print('2× bölüm/görev altını + 2× ilk tamamlama kupası. Premium ve bayramla çarpılır; eski bakiyeler değişmez.')
        confirm('event-' + action, reader)
        # Start the full duration after confirmation, not at the initial prompt.
        start = now if fixed_clock else datetime.now(timezone.utc)
        end = start + timedelta(minutes=int(action))
        fields = {'enabled': {'booleanValue': True}, 'id': {'stringValue': 'event-' + uuid.uuid4().hex},
                  'startsAt': {'timestampValue': start.isoformat()}, 'endsAt': {'timestampValue': end.isoformat()}}
    client.patch('operations/current', document, {'rewardEvent': {'mapValue': {'fields': fields}}})
    if action != 'kapat':
        print('Başlangıç:', fields['startsAt']['timestampValue'], '| Bitiş:', fields['endsAt']['timestampValue'])
    print('BAŞARILI: Etkinlik ayarı kaydedildi. /event durum ile kontrol et.')
    print('Süre dolunca bonus otomatik biter; cron veya ücretli sunucu gerekmez. Push gönderilmedi.')


def main(args=None):
    parser = argparse.ArgumentParser(prog='/event', description='Dakika cinsinden 2× altın ve kupa etkinliği. Örnek: /event 30')
    parser.add_argument('action', nargs='?', default='durum', help='1–10080 dakika, durum veya kapat')
    options = parser.parse_args(sys.argv[1:] if args is None else args)
    try:
        action = options.action
        if action not in ('durum','kapat') and (not action.isascii() or not action.isdecimal() or not 1<=int(action)<=10080):
            raise ValueError('Kullanım: /event 30 | /event durum | /event kapat. Süre: 1–10080 dakika.')
        token = subprocess.check_output(['gcloud','auth','print-access-token'],text=True).strip()
        if not token:
            raise ValueError('Google yetkilendirmesi tamamlanmadı.')
        control(Client(token), action)
        return 0
    except urllib.error.HTTPError as error:
        print('İşlem doğrulanamadı. HTTP:',error.code,file=sys.stderr)
    except ValueError as error:
        print(str(error),file=sys.stderr)
    except (OSError,KeyError,TypeError,subprocess.CalledProcessError):
        print('Bağlantı, yetki veya kayıt biçimi hatası.',file=sys.stderr)
    print('İşlemi tekrar etmeden önce /event durum ile kontrol et.',file=sys.stderr)
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
