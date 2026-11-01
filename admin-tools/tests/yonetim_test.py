import contextlib
from datetime import datetime, timezone
import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import yonetim as m

NOW=datetime(2026,11,1,tzinfo=timezone.utc)
class Fake:
    def __init__(self, record=None):self.record=record;self.writes=[];self.account={'localId':'user','providerUserInfo':[{'providerId':'google.com'}],'displayName':'Test'}
    def user(self,uid):return self.account
    def get(self,path):return self.record
    def patch(self,path,doc,fields):self.writes.append((path,doc,fields));return {}

def premium_doc(enabled=True):
    return {'updateTime':'v1','fields':{'enabled':{'booleanValue':enabled},'expiresAt':{'timestampValue':'2026-12-01T00:00:00Z'},'other':{'stringValue':'keep'}}}

def ops():
    return {'updateTime':'v1','fields':{'announcements':{'arrayValue':{'values':[m.duyuru.field({'id':'release','body':'hello'}),m.duyuru.field({'id':'shell-a','body':'hi'})]}},'maintenance':{'mapValue':{'fields':{'enabled':{'booleanValue':True}}}}}}

class CommandsTest(unittest.TestCase):
    def setUp(self):self.output=io.StringIO();self.redirect=contextlib.redirect_stdout(self.output);self.redirect.__enter__()
    def tearDown(self):self.redirect.__exit__(None,None,None)
    def test_active_extension_and_scoped_fields(self):
        c=Fake(premium_doc());m.premium(c,'ver','user',30,lambda _: 'ONAY user',NOW)
        path,doc,fields=c.writes[0];self.assertEqual(path,'premium/user');self.assertEqual(fields['expiresAt']['timestampValue'],'2026-12-31T00:00:00+00:00');self.assertEqual(set(fields),{'enabled','expiresAt','updatedAt'})
    def test_new_and_disabled_start_from_now(self):
        for old in [None,premium_doc(False)]:
            c=Fake(old);m.premium(c,'ver','user',1,lambda _: 'ONAY user',NOW)
            self.assertEqual(c.writes[0][2]['expiresAt']['timestampValue'],'2026-11-02T00:00:00+00:00')
    def test_expired_start_from_now(self):
        old=premium_doc();old['fields']['expiresAt']['timestampValue']='2026-01-01T00:00:00Z'
        c=Fake(old);m.premium(c,'ver','user',1,lambda _: 'ONAY user',NOW)
        self.assertEqual(c.writes[0][2]['expiresAt']['timestampValue'],'2026-11-02T00:00:00+00:00')
    def test_cancel_and_status_never_touch_cosmetics_or_expiry(self):
        c=Fake(premium_doc());m.premium(c,'durum','user',now=NOW);self.assertEqual(c.writes,[])
        m.premium(c,'iptal','user',reader=lambda _: 'ONAY user',now=NOW)
        self.assertEqual(set(c.writes[0][2]),{'enabled','updatedAt'});self.assertFalse(c.writes[0][2]['enabled']['booleanValue'])
    def test_bad_confirmation_and_anonymous_never_write(self):
        c=Fake(premium_doc())
        with self.assertRaises(ValueError):m.premium(c,'ver','user',1,lambda _: 'ONAY wrong',NOW)
        c.account['providerUserInfo']=[]
        with self.assertRaises(ValueError):m.premium(c,'ver','user',1,lambda _: 'ONAY user',NOW)
        self.assertEqual(c.writes,[])
    def test_delete_exact_notice_and_preserve_other_fields(self):
        c=Fake(ops());m.delete_notice(c,'release',lambda _: 'ONAY release')
        fields=c.writes[0][2];self.assertEqual(set(fields),{'announcements','deletedAnnouncementIds'})
        self.assertEqual(m.unpack(fields['announcements']),[{'id':'shell-a','body':'hi'}]);self.assertEqual(m.unpack(fields['deletedAnnouncementIds']),['release'])
    def test_delete_absent_or_unconfirmed_never_writes(self):
        c=Fake(ops())
        for identifier,reply in [('absent','ONAY absent'),('release','no')]:
            with self.assertRaises(ValueError):m.delete_notice(c,identifier,lambda _:reply)
        self.assertEqual(c.writes,[])
    def test_invalid_input_and_help_never_request_credentials(self):
        with patch.object(m.subprocess,'check_output') as auth,contextlib.redirect_stderr(io.StringIO()):
            for args in [['premium','ver','user','0'],['premium','ver','../bad','365'],['premium','durum','user','10']]:self.assertEqual(m.main(args),1)
            self.assertEqual(m.main(['yardım']),0);auth.assert_not_called()
    def test_transport_create_cas_and_no_retry_after_uncertainty(self):
        requests=[]
        def opener(req,**kwargs):requests.append(req);raise URLError('response lost')
        c=m.Client('mock',opener)
        for old in [None,premium_doc()]:
            with self.assertRaises(URLError):c.patch('premium/user',old,{'enabled':{'booleanValue':True}})
        self.assertEqual(len(requests),2);self.assertIn('currentDocument.exists=false',requests[0].full_url);self.assertIn('currentDocument.updateTime=v1',requests[1].full_url)
        self.assertNotIn('expiresAt',requests[1].full_url)
    def test_auth_lookup_requires_exact_uid(self):
        def opener(req,**kwargs):
            self.assertEqual(req.get_method(),'POST');self.assertEqual(json.loads(req.data),{'localId':['user']})
            return io.BytesIO(b'{"users":[]}')
        with self.assertRaises(ValueError):m.Client('mock',opener).user('user')
    def test_player_and_overview_are_read_only(self):
        c=Fake(None);m.player(c,'user');self.assertEqual(c.writes,[]);self.assertIn('Bulut oyun kaydı yok',self.output.getvalue())
        with patch.object(m.subprocess,'check_output',return_value='mock'),patch.object(m,'Client',return_value=Fake(ops())):
            self.assertEqual(m.main(['durum']),0);self.assertEqual(m.main(['duyurular']),0)
    def test_untrusted_terminal_control_characters_escaped(self):
        self.assertNotIn('\x1b',m.safe('Name\x1b[2J'))

if __name__=='__main__':unittest.main()
