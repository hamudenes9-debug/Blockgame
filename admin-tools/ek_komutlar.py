"""Additional owner commands. Read-only except explicit confirmed mutations/test push."""
import argparse
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import quote, urlencode
import urllib.error
import uuid
import yonetim as y

NOW = lambda: datetime.now(timezone.utc)
AUTH = 'https://identitytoolkit.googleapis.com/v1/projects/' + y.duyuru.PROJECT + '/accounts:batchGet'
BACKUP_FIELDS = {'format','minimumVersion','minimumSchema','maintenance','maintenanceOverride','rewardEvent',
    'announcements','announcementOverrides','deletedAnnouncementIds','holidaysEnabled','holidays','holidayWindows','levelIds','publishedAt'}


def identifier(value):
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,200}', value):
        raise ValueError('Geçersiz kimlik.')
    return value


def text(value, limit=2000):
    value = value.strip()
    if not value or len(value.encode('utf-16-le')) // 2 > limit:
        raise ValueError('Metin boş olamaz; sınır ' + str(limit) + ' UTF-16 birimidir.')
    return value


def next_page(result, key='nextPageToken'):
    token = result.get(key)
    if token:
        print('Yalnızca bu sayfa tarandı. Devamı için aynı komuta --sayfa ekle:', y.safe(token))
    else:
        print('Son sayfa. Önceki sayfalardan başlanmadıysa sonuçlar tüm listeyi kapsamaz.')


def premium_list(client, days=None, page=None, now=None):
    now = now or NOW()
    query = {'pageSize':200, 'mask.fieldPaths':['enabled','expiresAt']}
    if page:
        query['pageToken'] = page
    result = client.request(y.BASE + '/premium?' + urlencode(query, doseq=True))
    found = 0
    for document in result.get('documents', []):
        record = y.data(document)
        if record.get('enabled') is not True:
            continue
        try:
            end = y.expiry(record.get('expiresAt'))
        except (ValueError, TypeError):
            print('Geçersiz bitiş tarihi olan bir kayıt atlandı.'); continue
        if end <= now or (days is not None and end > now + timedelta(days=days)):
            continue
        print('UID:', y.safe(document['name'].rsplit('/',1)[-1]), '| Bitiş:', end.isoformat())
        found += 1
    print('Bu sayfadaki eşleşme:', found)
    next_page(result)


def fold(value):
    return value.replace('İ','i').replace('I','ı').casefold()


def find_player(client, name, page=None):
    query = {'maxResults':200, 'fields':'users(localId,displayName,disabled),nextPageToken'}
    if page:
        query['nextPageToken'] = page
    result = client.request(AUTH + '?' + urlencode(query))
    found = 0
    for user in result.get('users', []):
        if fold(name) in fold(user.get('displayName','')):
            print('UID:', y.safe(user['localId']), '| Ad:', y.safe(user.get('displayName','')), '| Engelli:', user.get('disabled',False) is True)
            found += 1
    print('Bu sayfadaki ad eşleşmesi:', found, '(aynı isimli hesaplar ayrı gösterilir)')
    next_page(result)


def extend_event(client, minutes, reader=input, clock=NOW):
    if not 1 <= minutes <= 10080:
        raise ValueError('Ek süre 1–10080 dakika olmalı.')
    document, record = y.require_operations(client)
    event = record.get('rewardEvent') or {}
    now = clock()
    if record.get('minimumSchema',0) < 6 or event.get('enabled') is not True or not y.expiry(event['startsAt']) <= now < y.expiry(event['endsAt']):
        raise ValueError('Şema 6 ve aktif etkinlik gerekli. Bitmiş etkinlik yeniden başlatılmaz.')
    end = y.expiry(event['endsAt']) + timedelta(minutes=minutes)
    if end - now > timedelta(minutes=10080):
        raise ValueError('Toplam kalan süre 10080 dakikayı aşamaz.')
    print('Etkinlik:', y.safe(event.get('id')), '| Eski bitiş:', y.safe(event['endsAt']), '| Yeni bitiş:', end.isoformat())
    y.confirm('event-uzat-' + str(minutes), reader)
    if clock() >= y.expiry(event['endsAt']):
        raise ValueError('Onay beklenirken etkinlik bitti; uzatılmadı.')
    # Nested mask preserves the ID/start and all other controls; CAS protects concurrency.
    patch_event_end(client, document, end)
    print('BAŞARILI: Süre mevcut bitişe eklendi. /event durum ile kontrol et; aynı isteği körlemesine tekrarlama.')


def patch_event_end(client, document, end):
    query = urlencode([('updateMask.fieldPaths','rewardEvent.endsAt'),('currentDocument.updateTime',document['updateTime'])])
    client.request(y.BASE + '/operations/current?' + query, 'PATCH',
        {'fields':{'rewardEvent':{'mapValue':{'fields':{'endsAt':{'timestampValue':end.isoformat()}}}}}})


def edit_notice(client, notice_id, body, reader=input):
    identifier(notice_id); body = text(body)
    if len(notice_id)>80:
        raise ValueError('Duyuru kimliği en fazla 80 karakter olabilir.')
    document, record = y.require_operations(client)
    notices = document['fields']['announcements']['arrayValue'].get('values',[])
    matches = [n for n in notices if y.duyuru.notice_id(n) == notice_id]
    if len(matches) != 1:
        raise ValueError('Duyuru bulunamadı veya kimlik tekrarlanmış; değişiklik yapılmadı.')
    overrides = record.get('announcementOverrides', {})
    if (not isinstance(overrides,dict) or len(set(overrides) | {notice_id}) > 1000
        or any(not re.fullmatch(r'[A-Za-z0-9_-]{1,80}',key) or not isinstance(value,str) or not value.strip() or len(value.encode('utf-16-le'))//2>2000 for key,value in overrides.items())):
        raise ValueError('Duyuru düzenleme geçmişi geçersiz veya dolu.')
    print('Eski:', y.safe(y.unpack(matches[0]))); print('Yeni metin:', y.safe(body))
    y.confirm(notice_id, reader)
    fields = matches[0]['mapValue']['fields']
    fields['body'] = {'stringValue':body}
    fields['delivery'] = {'stringValue':'in-app'}
    encoded = dict(document['fields'].get('announcementOverrides',{}).get('mapValue',{}).get('fields',{}))
    encoded[notice_id] = {'stringValue':body}
    client.patch('operations/current',document,{'announcements':{'arrayValue':{'values':notices}},'announcementOverrides':{'mapValue':{'fields':encoded}}})
    print('BAŞARILI: Metin güncellendi. Yeni push gönderilmedi; başlamış gönderim geri çekilmez.')


def archive_clean(client, selected=None, reader=input, now=None):
    now = now or NOW()
    document, record = y.require_operations(client)
    archived = {}
    for notice in record['announcements']:
        try:
            expired = y.expiry(notice.get('endsAt')) <= now
        except (ValueError, TypeError):
            print('Tarihi geçersiz duyuru atlandı.'); continue
        if expired:
            if notice['id'] in archived:
                raise ValueError('Tekrarlanan kimlik; işlem yapılmadı.')
            archived[notice['id']] = notice
            print(y.safe(notice))
    if not archived:
        print('Süresi bitmiş duyuru yok.'); return
    if selected is None:
        try:
            answer = reader('Silinecek kimlikleri boşlukla ayır (hepsi / boş: iptal): ').strip()
        except EOFError:
            answer = ''
        selected = list(archived) if answer == 'hepsi' else answer.replace(',',' ').split()
    selected = list(dict.fromkeys(selected))
    if not selected or any(i not in archived for i in selected):
        raise ValueError('Seçim iptal edildi/geçersiz. Aktif veya gelecek duyurular silinmez.')
    removed = record.get('deletedAnnouncementIds', [])
    if not isinstance(removed,list) or any(not isinstance(v,str) for v in removed):
        raise ValueError('Silme geçmişi geçersiz.')
    removed = list(dict.fromkeys(removed + selected))
    if len(removed) > 1000:
        raise ValueError('Silme geçmişi dolu; hiçbir duyuru silinmedi.')
    print('Seçilen kimlikler:', y.safe(selected)); y.confirm('arsiv-temizle', reader)
    old = document['fields']['announcements']['arrayValue'].get('values',[])
    client.patch('operations/current',document,{
        'announcements':{'arrayValue':{'values':[n for n in old if y.duyuru.notice_id(n) not in selected]}},
        'deletedAnnouncementIds':{'arrayValue':{'values':[{'stringValue':i} for i in removed]}}})
    print('BAŞARILI: Seçilen arşiv kayıtları kaldırıldı. Gönderilmiş telefon bildirimleri geri çekilmez.')


def delivery_status(client, notice_id):
    identifier(notice_id)
    document = client.get('notificationDeliveries/' + quote(notice_id,safe=''))
    if not document:
        raise ValueError('Gönderim kaydı bulunamadı.')
    record = y.data(document)
    allowed = ('status','source','targetUid','startedAt','finishedAt','scanComplete','accepted','failed','uncertain','skipped','success','failure','sent')
    print(y.safe({k:record[k] for k in allowed if k in record}))
    print('Eksik sayaç sıfır anlamına gelmez. sending/partial: sonuç tamamlanmamış veya belirsiz olabilir.')
    print('FCM kabulü telefonda teslim/gösterim kanıtı değildir. Otomatik yeniden gönderim yapılmaz.')


def test_push(client, uid, body, reader=input):
    import bildirim
    y.valid_uid(uid); body = text(body,500)
    user = client.user(uid)
    print('Hedef UID:',y.safe(uid),'| Ad:',y.safe(user.get('displayName','İsimsiz')))
    print('Metin:',y.safe(body)); print('Yalnız bu UID altında kayıtlı Android cihazları hedeflenir. Genel duyuru yayımlanmaz.')
    y.confirm(uid,reader)
    notice = y.duyuru.make_notice(body,identifier='shell-test-' + uuid.uuid4().hex)
    notice['title'] = 'Seyyah Bildirim Testi'
    print('Gönderim kimliği:',notice['id'])
    counts, complete, recorded = bildirim.dispatch(notice,client.token,uid=uid)
    print('Sonuç:',y.safe(counts),'| Tarama tamam:',complete,'| Özet kaydı:',recorded)
    if complete and not any(counts.values()):
        print('Bu hesaba ait izin-kayıtlı Android cihazı bulunamadı.')
    print('FCM kabulü teslimat kanıtı değildir. Sonucu /bildirim-durum ile oku; belirsiz sonucu tekrar gönderme.')
    if not complete or not recorded or counts['failed'] or counts['uncertain'] or counts['skipped']:
        raise ValueError('Test gönderimi tam doğrulanamadı; aynı metni körlemesine tekrar gönderme.')


def backup(client, directory=None):
    document, _ = y.require_operations(client)
    payload = {'format':1,'project':y.duyuru.PROJECT,'createdAt':NOW().isoformat(),'updateTime':document['updateTime'],
               'operations':{'fields':{k:v for k,v in document['fields'].items() if k in BACKUP_FIELDS}}}
    folder = Path(directory) if directory is not None else Path.home()/'.local/share/kelime-seyyahi/backups'
    if folder.is_symlink():
        raise ValueError('Yedek klasörü sembolik bağlantı olamaz.')
    folder.mkdir(parents=True,exist_ok=True,mode=0o700); folder.chmod(0o700)
    path = folder/('ayarlar-'+NOW().strftime('%Y%m%dT%H%M%SZ')+'-'+uuid.uuid4().hex+'.json')
    with os.fdopen(os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600),'w',encoding='utf-8') as output:
        json.dump(payload,output,ensure_ascii=False,indent=2); output.flush(); os.fsync(output.fileno())
    print('YEDEKLENDİ:',path)
    print('Yalnız seçili operations/current yönetim alanları. Oyuncular, cihazlar, tokenlar, Rules ve diğer belgeler dahil değil; geri yükleme yapılmadı.')
    return path


def system_check(client):
    failed = False
    schema = None
    def check(label, operation):
        nonlocal failed
        try:
            detail = operation()
            print('OK:',label,detail or '')
        except (urllib.error.HTTPError, OSError, ValueError, KeyError, TypeError) as error:
            failed = True
            print('DOĞRULANAMADI:',label,('HTTP '+str(error.code)) if isinstance(error,urllib.error.HTTPError) else 'Eksik/geçersiz veri veya bağlantı/yetki sorunu.')
    def controls():
        nonlocal schema
        _, record = y.require_operations(client)
        if not isinstance(record.get('maintenance',{}).get('enabled'),bool) or type(record.get('minimumSchema')) is not int or not isinstance(record.get('minimumVersion'),str):
            raise ValueError('Ayarlar eksik.')
        schema = record['minimumSchema']
        if record['minimumSchema'] < 6:
            print('UYARI: Etkinlik için şema 6 kurulumu gerekli.')
        return 'Sürüm '+record['minimumVersion']+' / şema '+str(record['minimumSchema'])
    def permissions():
        wanted = ['datastore.entities.get','datastore.entities.list','datastore.entities.update','datastore.entities.create','firebaseauth.users.get','cloudmessaging.messages.create']
        result = client.request('https://cloudresourcemanager.googleapis.com/v1/projects/'+y.duyuru.PROJECT+':testIamPermissions','POST',{'permissions':wanted})
        missing = set(wanted)-set(result.get('permissions',[]))
        if missing:
            print('Eksik yönetici yetkileri:',y.safe(sorted(missing))); raise ValueError('Eksik yetki')
    def fcm():
        result = client.request('https://serviceusage.googleapis.com/v1/projects/509266149759/services/fcm.googleapis.com')
        print('FCM API durumu:', y.safe(result.get('state')))
        if result.get('state') != 'ENABLED':
            raise ValueError('FCM API açık değil.')
    def rules():
        result = client.request('https://firebaserules.googleapis.com/v1/projects/'+y.duyuru.PROJECT+'/releases/cloud.firestore')
        name = result.get('rulesetName','')
        if not name.startswith('projects/'+y.duyuru.PROJECT+'/rulesets/'):
            raise ValueError('Rules yayımı yok/geçersiz.')
        ruleset = client.request('https://firebaserules.googleapis.com/v1/'+name)
        source = '\n'.join(f.get('content','') for f in ruleset.get('source',{}).get('files',[]) if f.get('name')=='firestore.rules')
        versions = [int(v) for v in re.findall(r'data\.version\s*==\s*(\d+)',source)]
        if not versions or (schema is not None and max(versions)<schema):
            raise ValueError('Kaydetme şeması doğrulanamadı/geride.')
        return 'Metin tabanlı kaydetme şeması: '+str(max(versions))+'; emülatör/davranış testi değildir.'
    check('Canlı ayarlar okunabiliyor',controls)
    check('Yönetici IAM izinleri',permissions)
    check('FCM API etkinliği',fcm)
    check('Firestore Rules yayımı',rules)
    print('Salt okunur kontrol: ayar/yetki/API değiştirilmedi, deneme yazması veya bildirim gönderilmedi. Cihaz teslimini ve tüm Rules davranışlarını doğrulamaz.')
    return not failed


def main(args=None):
    parser = argparse.ArgumentParser(description='APK değiştirmeden Cloud Shell yönetim araçları')
    sub = parser.add_subparsers(dest='command',required=True)
    p=sub.add_parser('event-uzat');p.add_argument('minutes',type=int)
    for command in ('premium-liste','premium-bitenler','oyuncu-bul'):
        p=sub.add_parser(command);p.add_argument('--sayfa')
        if command=='premium-bitenler':p.add_argument('days',type=int)
        if command=='oyuncu-bul':p.add_argument('name')
    p=sub.add_parser('duyuru-duzenle');p.add_argument('identifier');p.add_argument('body')
    p=sub.add_parser('duyuru-onizle');p.add_argument('body')
    p=sub.add_parser('bildirim-durum');p.add_argument('identifier')
    p=sub.add_parser('bildirim-test');p.add_argument('uid');p.add_argument('body')
    p=sub.add_parser('arsiv-temizle');p.add_argument('ids',nargs='*')
    sub.add_parser('ayar-yedekle');sub.add_parser('sistem-kontrol')
    options=parser.parse_args(sys.argv[1:] if args is None else args)
    try:
        command=options.command
        if hasattr(options,'body'):options.body=text(options.body,500 if command=='bildirim-test' else 2000)
        if hasattr(options,'identifier'):identifier(options.identifier)
        if hasattr(options,'uid'):y.valid_uid(options.uid)
        if hasattr(options,'minutes') and not 1<=options.minutes<=10080:raise ValueError('Süre 1–10080 dakika olmalı.')
        if hasattr(options,'days') and not 1<=options.days<=3650:raise ValueError('Gün sayısı 1–3650 olmalı.')
        if hasattr(options,'name'):options.name=text(options.name,100)
        if command=='duyuru-onizle':
            print('ÖNİZLEME — yayımlanmadı / ağ isteği yapılmadı.')
            print('Başlık: Seyyah Postası | Metin:',y.safe(options.body))
            print('Uzunluk:',len(options.body.encode('utf-16-le'))//2,'/ 2000 UTF-16 birimi. APK ekranının birebir görseli değildir.')
            return 0
        token=subprocess.check_output(['gcloud','auth','print-access-token'],text=True).strip()
        if not token:raise ValueError('Google yetkilendirmesi tamamlanmadı.')
        client=y.Client(token)
        if command=='event-uzat':extend_event(client,options.minutes)
        elif command in ('premium-liste','premium-bitenler'):premium_list(client,getattr(options,'days',None),options.sayfa)
        elif command=='oyuncu-bul':find_player(client,options.name,options.sayfa)
        elif command=='duyuru-duzenle':edit_notice(client,options.identifier,options.body)
        elif command=='arsiv-temizle':archive_clean(client,options.ids or None)
        elif command=='bildirim-durum':delivery_status(client,options.identifier)
        elif command=='bildirim-test':test_push(client,options.uid,options.body)
        elif command=='ayar-yedekle':backup(client)
        elif command=='sistem-kontrol':return 0 if system_check(client) else 1
        return 0
    except urllib.error.HTTPError as error:
        print('İşlem doğrulanamadı. HTTP:',error.code,file=sys.stderr)
    except ValueError as error:
        print(str(error),file=sys.stderr)
    except (OSError,KeyError,TypeError,OverflowError,subprocess.CalledProcessError):
        print('Bağlantı, yetki veya kayıt biçimi hatası; işlem doğrulanamadı.',file=sys.stderr)
    print('Değişiklik/gönderim belirsizse tekrarlamadan önce ilgili durum komutuyla kontrol et.',file=sys.stderr)
    return 1


if __name__=='__main__':
    raise SystemExit(main())
