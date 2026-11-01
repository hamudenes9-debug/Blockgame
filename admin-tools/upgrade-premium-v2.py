"""Run in Google Cloud Shell as the project owner after installing 1.11.0.
Deploys the tagged Firestore rules and updates only version/announcement fields.
No service-account key, paid plan, player save or Premium expiry is changed.
"""
import json
import os
import subprocess
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

PROJECT = 'blockgame-46ae9'
REF = 'v1.11.0'
SOURCE = 'https://raw.githubusercontent.com/hamudenes9-debug/Blockgame/' + REF + '/'

def field(value):
    if isinstance(value, bool): return {'booleanValue': value}
    if isinstance(value, int): return {'integerValue': str(value)}
    if isinstance(value, str): return {'stringValue': value}
    if isinstance(value, list): return {'arrayValue': {'values': [field(x) for x in value]}}
    return {'mapValue': {'fields': {k: field(v) for k, v in value.items()}}}

def main():
    token = subprocess.check_output(['gcloud', 'auth', 'print-access-token'], text=True).strip()
    def api(url, method='GET', body=None):
        request = urllib.request.Request(url, headers={'Authorization': 'Bearer '+token, 'Content-Type':'application/json'}, method=method,
            data=None if body is None else json.dumps(body).encode())
        with urllib.request.urlopen(request, timeout=45) as response:
            return json.load(response)
    # Public source requests deliberately do not carry the Google credential.
    def source(name):
        with urllib.request.urlopen(SOURCE+name, timeout=30) as response:
            return response.read().decode()
    if json.loads(source('package.json'))['version'] != '1.11.0':
        raise ValueError('Sürüm doğrulanamadı.')
    rules = source('firestore.rules')
    if "rules_version = '2'" not in rules or 'data.version == 5' not in rules:
        raise ValueError('Kural kaynağı doğrulanamadı.')
    url = 'https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents/operations/current'
    document = api(url)
    current_fields = document['fields']
    schema = int(current_fields.get('minimumSchema',{}).get('integerValue',0))
    version = tuple(int(x) for x in current_fields.get('minimumVersion',{}).get('stringValue','0.0.0').split('.'))
    if schema > 5 or version > (1,11,0):
        raise ValueError('Daha yeni canlı sürüm var; eski güncelleyici uygulanmadı.')
    root = 'https://firebaserules.googleapis.com/v1/projects/'+PROJECT
    old_entries = current_fields.get('announcements',{}).get('arrayValue',{}).get('values',[])
    if sum(n.get('mapValue',{}).get('fields',{}).get('id',{}).get('stringValue') not in ['premium-sales-20261101','premium-benefits-111'] for n in old_entries) >= 30:
        raise ValueError('Duyuru listesi dolu; hiçbir ayar değiştirilmedi.')
    old_release = api(root+'/releases/cloud.firestore')
    stamp = datetime.now(timezone.utc)
    backup_path = os.path.expanduser('~/seyyah-before-premium-v2-'+stamp.strftime('%Y%m%dT%H%M%SZ')+'.json')
    with os.fdopen(os.open(backup_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600), 'w') as backup:
        json.dump({'release':old_release,'operations':document}, backup, ensure_ascii=False, indent=2)
    print('Proje:', PROJECT, '— önceki ayar yedeği:', backup_path)
    compiled = api(root+'/rulesets', 'POST', {'source':{'files':[{'name':'firestore.rules','content':rules}]}})
    api(root+'/releases/cloud.firestore', 'PATCH', {'release':{'name':'projects/'+PROJECT+'/releases/cloud.firestore','rulesetName':compiled['name']}})
    print('Şema 5 güvenlik kuralları yayımlandı; şimdi canlı sürüm ve duyuru güncelleniyor.')
    notice = {'id':'premium-benefits-111','title':'Premium yenilendi: 2× ödül ve kalıcı avatarlar!',
        'body':'1.11.0 ile yıllık 99,99 TL Premium paketi yenilendi. Sınırsız Harf aç kaldırıldı. Yeni bölümün ilk tamamlamasında 2× altın ve 40 kupa; bayramla birleşince 80 kupa. Günlük keşif görevlerinde 2× altın, aynı ipucu ödülü. Premium aktifken açılan 4 saç, 4 kıyafet ve 4 şapka süre bitince de kalır. Ödül çarpanları çevrimiçi sunucu onayı ister; eski bakiyeleri katlamaz. Mevcut Premium bitiş tarihin değişmez. Satın alma ve önceki paketle ilgili sorular: tirezteknoloji@gmail.com.',
        'startsAt':stamp.isoformat(), 'endsAt':(stamp+timedelta(days=30)).isoformat()}
    old_notices = current_fields.get('announcements',{}).get('arrayValue',{}).get('values',[])
    notices = [n for n in old_notices if n.get('mapValue',{}).get('fields',{}).get('id',{}).get('stringValue') not in ['premium-sales-20261101','premium-benefits-111']]
    if len(notices) >= 30:
        raise ValueError('Duyuru listesi dolu. Kurallar yayımlandı, canlı ayar güncellenmedi.')
    notices.append(field(notice))
    updated = {'minimumVersion':field('1.11.0'), 'minimumSchema':field(5),
        'levelIds':field(list(range(1,125))), 'announcements':{'arrayValue':{'values':notices}}}
    query = urlencode([('updateMask.fieldPaths',key) for key in updated]+[('currentDocument.updateTime',document['updateTime'])])
    api(url+'?'+query, 'PATCH', {'fields':updated})
    print('BAŞARILI: Premium v2 kuralları, sürüm ayarı ve oyun içi duyuru yayımlandı.')
    print('Oyuncu bakiyeleri, Premium bitiş tarihleri ve bakım/bayram ayarları değiştirilmedi.')
    print('1.11.0 uygulamasında Mağaza → Premium durumunu yenile. Bu komut push göndermez.')

if __name__ == '__main__':
    try:
        main()
    except urllib.error.HTTPError as error:
        print('İşlem tamamlanamadı. HTTP hata kodu:', error.code)
        print('Yukarıda kuralların yayımlandığı yazıyorsa yalnızca son adım eksik olabilir. Çıktıyı kontrol et; anahtar veya token paylaşma.')
        raise SystemExit(1)
    except (subprocess.CalledProcessError, urllib.error.URLError, ValueError, KeyError) as error:
        print('İşlem tamamlanamadı. Yetkilendirme, sürüm kaynağı ve canlı ayarları kontrol et. Bazı adımlar uygulanmış olabilir.')
        raise SystemExit(1)
