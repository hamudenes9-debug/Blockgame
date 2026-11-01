import contextlib
from datetime import datetime, timedelta, timezone
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import ek_komutlar as m
import yonetim as y
import bildirim
NOW=datetime(2026,11,1,tzinfo=timezone.utc)
def field(v):
    if isinstance(v,bool):return {'booleanValue':v}
    if isinstance(v,int):return {'integerValue':str(v)}
    if isinstance(v,str):return {'stringValue':v}
    if isinstance(v,list):return {'arrayValue':{'values':[field(i) for i in v]}}
    return {'mapValue':{'fields':{k:field(i) for k,i in v.items()}}}
def doc(record):return {'updateTime':'v1','fields':{k:field(v) for k,v in record.items()}}
def operations():return doc({'minimumSchema':6,'minimumVersion':'1.12.0','maintenance':{'enabled':False},'announcements':[{'id':'old','body':'Old','endsAt':'2026-10-01T00:00:00Z'},{'id':'active','body':'Active','endsAt':'2027-01-01T00:00:00Z'}],'rewardEvent':{'id':'event-a','enabled':True,'startsAt':'2026-10-31T23:59:00Z','endsAt':'2026-11-01T00:10:00Z'}})
class Fake:
    token='mock-token'
    def __init__(self,document=None):self.document=document or operations();self.writes=[];self.requests=[]
    def get(self,path):self.requests.append(('GET',path));return self.document
    def patch(self,path,old,fields):self.writes.append((path,old,fields));return {}
    def request(self,url,method='GET',body=None):self.requests.append((method,url,body));return {}
    def user(self,uid):return {'localId':uid,'displayName':'Test'}
class ExtraTest(unittest.TestCase):
    def setUp(self):self.out=io.StringIO();self.redir=contextlib.redirect_stdout(self.out);self.redir.__enter__()
    def tearDown(self):self.redir.__exit__(None,None,None)
    def test_extend_preserves_start_id_and_uses_nested_cas(self):
        c=Fake();m.extend_event(c,15,lambda _:'ONAY event-uzat-15',lambda:NOW)
        method,url,body=c.requests[-1];self.assertEqual(method,'PATCH');self.assertIn('updateMask.fieldPaths=rewardEvent.endsAt',url);self.assertIn('currentDocument.updateTime=v1',url)
        self.assertEqual(body,{'fields':{'rewardEvent':{'mapValue':{'fields':{'endsAt':{'timestampValue':'2026-11-01T00:25:00+00:00'}}}}}})
    def test_extend_never_revives_expired_or_unconfirmed_event(self):
        for reply,clock in [('no',lambda:NOW),('ONAY event-uzat-15',lambda:NOW+timedelta(hours=1))]:
            c=Fake()
            with self.assertRaises(ValueError):m.extend_event(c,15,lambda _:reply,clock)
            self.assertFalse(any(r[0]=='PATCH' for r in c.requests))
        times=iter([NOW,NOW+timedelta(minutes=10)]);c=Fake()
        with self.assertRaises(ValueError):m.extend_event(c,15,lambda _:'ONAY event-uzat-15',lambda:next(times))
        self.assertEqual(len(c.requests),1)
    def test_extend_does_not_retry_ambiguous_write(self):
        c=Fake()
        with patch.object(c,'request',side_effect=URLError('lost')) as req:
            with self.assertRaises(URLError):m.extend_event(c,15,lambda _:'ONAY event-uzat-15',lambda:NOW)
            self.assertEqual(req.call_count,1)
    def test_edit_preserves_notice_metadata_and_stores_override(self):
        c=Fake();m.edit_notice(c,'active','New body',lambda _:'ONAY active')
        fields=c.writes[0][2];self.assertEqual(set(fields),{'announcements','announcementOverrides'})
        values=y.unpack(fields['announcements']);self.assertEqual(values[0]['body'],'Old');self.assertEqual(values[1]['body'],'New body');self.assertEqual(values[1]['endsAt'],'2027-01-01T00:00:00Z');self.assertEqual(values[1]['delivery'],'in-app');self.assertEqual(y.unpack(fields['announcementOverrides']),{'active':'New body'})
    def test_edit_requires_match_confirmation_and_valid_text(self):
        for ident,body,reply in [('none','text','ONAY none'),('active','text','no'),('active','x'*2001,'ONAY active')]:
            c=Fake()
            with self.assertRaises(ValueError):m.edit_notice(c,ident,body,lambda _:reply)
            self.assertEqual(c.writes,[])
    def test_archive_removes_only_expired_selected_and_tombstones(self):
        c=Fake();m.archive_clean(c,['old'],lambda _:'ONAY arsiv-temizle',NOW)
        fields=c.writes[0][2];self.assertEqual(set(fields),{'announcements','deletedAnnouncementIds'});self.assertEqual([v['id'] for v in y.unpack(fields['announcements'])],['active']);self.assertEqual(y.unpack(fields['deletedAnnouncementIds']),['old'])
    def test_archive_interactive_selection_and_cancel(self):
        c=Fake();answers=iter(['old','ONAY arsiv-temizle']);m.archive_clean(c,reader=lambda _:next(answers),now=NOW);self.assertEqual(len(c.writes),1)
        for selection in [['active'],[],['missing']]:
            c=Fake()
            with self.assertRaises(ValueError):m.archive_clean(c,selection,lambda _:'ONAY arsiv-temizle',NOW)
            self.assertEqual(c.writes,[])
    def test_preview_and_bad_input_never_authenticate(self):
        with patch.object(m.subprocess,'check_output') as auth,contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(m.main(['duyuru-onizle','Hello']),0)
            for args in [['event-uzat','0'],['premium-bitenler','0'],['bildirim-test','u','x'*501],['oyuncu-bul',' ']]:self.assertEqual(m.main(args),1)
            auth.assert_not_called()
    def test_premium_filter_boundaries_and_pagination(self):
        records=[]
        for uid,enabled,end in [('active',True,NOW+timedelta(days=7)),('later',True,NOW+timedelta(days=8)),('expired',True,NOW),('disabled',False,NOW+timedelta(days=1))]:
            d=doc({'enabled':enabled,'expiresAt':end.isoformat()});d['name']='projects/p/documents/premium/'+uid;records.append(d)
        c=Fake()
        with patch.object(c,'request',return_value={'documents':records,'nextPageToken':'NEXT'}) as req:
            m.premium_list(c,7,'CURRENT',NOW)
            self.assertIn('pageToken=CURRENT',req.call_args.args[0]);self.assertIn('mask.fieldPaths=expiresAt',req.call_args.args[0])
        self.assertIn('"active"',self.out.getvalue());self.assertNotIn('"later"',self.out.getvalue());self.assertNotIn('"expired"',self.out.getvalue());self.assertIn('NEXT',self.out.getvalue());self.assertEqual(c.writes,[])
    def test_player_search_keeps_duplicate_names_and_redacts_private_fields(self):
        c=Fake();users=[{'localId':u,'displayName':'İpek','email':'SECRET-EMAIL','passwordHash':'SECRET-HASH'} for u in ['a','b']]
        with patch.object(c,'request',return_value={'users':users,'nextPageToken':'MORE'}) as req:
            m.find_player(c,'ipek','PAGE');self.assertIn('fields=',req.call_args.args[0]);self.assertIn('nextPageToken=PAGE',req.call_args.args[0])
        output=self.out.getvalue();self.assertIn('"a"',output);self.assertIn('"b"',output);self.assertNotIn('SECRET',output);self.assertEqual(c.writes,[])
    def test_backup_private_exclusive_allowlist_no_credentials_or_writes(self):
        c=Fake();c.document['fields']['accessToken']=field('SECRET')
        with tempfile.TemporaryDirectory() as temp:
            a=m.backup(c,Path(temp)/'backups');b=m.backup(c,Path(temp)/'backups')
            self.assertNotEqual(a,b);self.assertEqual(a.stat().st_mode&0o777,0o600);self.assertEqual(a.parent.stat().st_mode&0o777,0o700)
            value=json.loads(a.read_text());self.assertEqual(value['project'],'blockgame-46ae9');self.assertNotIn('SECRET',a.read_text());self.assertNotIn('mock-token',a.read_text());self.assertIn('rewardEvent',value['operations']['fields'])
        self.assertEqual(c.writes,[])
    def test_delivery_status_filters_tokens_and_supports_legacy_sent(self):
        c=Fake(doc({'status':'finished','sent':3,'failed':1,'token':'SECRET','accessToken':'SECRET'}));m.delivery_status(c,'notice')
        self.assertIn('"sent": 3',self.out.getvalue());self.assertNotIn('SECRET',self.out.getvalue());self.assertIn('teslim',self.out.getvalue());self.assertEqual(c.writes,[])
    def test_targeted_push_confirmation_and_no_public_announcement(self):
        c=Fake()
        with patch.object(bildirim,'dispatch',return_value=({'accepted':1,'failed':0,'uncertain':0,'skipped':0},True,True)) as send,patch.object(y.duyuru,'publish') as public:
            with self.assertRaises(ValueError):m.test_push(c,'a','test',lambda _:'no')
            send.assert_not_called();m.test_push(c,'a','test',lambda _:'ONAY a');self.assertEqual(send.call_args.kwargs,{'uid':'a'});public.assert_not_called()
        self.assertEqual(c.writes,[])
    def test_system_check_is_read_only_and_reports_inconclusive_checks(self):
        c=Fake()
        def request(url,method='GET',body=None):
            if ':testIamPermissions' in url:
                self.assertEqual(method,'POST');return {'permissions':body['permissions']}
            self.assertEqual(method,'GET')
            if 'serviceusage' in url:return {'state':'ENABLED'}
            if '/releases/' in url:return {'rulesetName':'projects/blockgame-46ae9/rulesets/test'}
            return {'source':{'files':[{'name':'firestore.rules','content':'data.version == 6'}]}}
        with patch.object(c,'request',side_effect=request):self.assertTrue(m.system_check(c))
        self.assertEqual(c.writes,[])
        with patch.object(c,'request',side_effect=HTTPError('url',403,'denied',{},None)):
            self.assertFalse(m.system_check(c))
        self.assertIn('DOĞRULANAMADI',self.out.getvalue())

class TargetedTransportTest(unittest.TestCase):
    def test_uid_scoped_query_path_defence_dedup_and_pagination(self):
        prefix='projects/blockgame-46ae9/databases/(default)/documents/'
        def device(uid,key,token):return {'name':prefix+'users/'+uid+'/devices/'+key,'fields':{'platform':field('android'),'token':field(token)}}
        pages=[[device('chosen','1','chosen-token'),device('other','2','other-token')],[device('chosen','3','chosen-token')]];sent=[];queries=[]
        def opener(req,**kwargs):
            body=json.loads(req.data)
            if ':runQuery' in req.full_url:
                self.assertEqual(req.full_url,bildirim.ROOT+'/users/chosen:runQuery');self.assertFalse(body['structuredQuery']['from'][0]['allDescendants']);queries.append(body)
                response=[{'document':d} for d in pages[len(queries)-1]]
            elif req.full_url==bildirim.FCM:sent.append(body['message']['token']);response={'name':'accepted'}
            else:
                self.assertIn('/notificationDeliveries',req.full_url);self.assertNotIn('chosen-token',json.dumps(body))
                if req.get_method()=='POST':self.assertEqual(body['fields']['targetUid'],field('chosen'))
                response={}
            return io.BytesIO(json.dumps(response).encode())
        with patch.object(bildirim,'PAGE_SIZE',2):result=bildirim.dispatch(y.duyuru.make_notice('test'),'mock',opener,workers=1,uid='chosen')
        self.assertEqual(sent,['chosen-token']);self.assertEqual(result[0]['accepted'],1);self.assertEqual(len(queries),2)
    def test_empty_uid_never_falls_back_to_broadcast(self):
        with patch.object(bildirim,'request_json') as request:
            with self.assertRaises(ValueError):bildirim.dispatch(y.duyuru.make_notice('test'),'mock',uid='')
            request.assert_not_called()
if __name__=='__main__':unittest.main()
