import importlib.util
import io
import json
from pathlib import Path
import unittest
from urllib.error import HTTPError, URLError

spec=importlib.util.spec_from_file_location('duyuru',Path(__file__).resolve().parents[1]/'duyuru.py')
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class DuyuruTest(unittest.TestCase):
    def document(self, entries=None, version='v1'):
        return {'updateTime':version,'fields':{'announcements':{'arrayValue':{'values':entries or []}},'maintenance':{'mapValue':{'fields':{'enabled':{'booleanValue':True}}}}}}
    def response(self, value):return io.BytesIO(json.dumps(value).encode())
    def test_validation(self):
        for text in ['', '  ', 'x'*2001, '🎉'*1001]:
            with self.assertRaises(ValueError):m.make_notice(text)
        self.assertEqual(m.make_notice('  Merhaba 🎉  ')['body'],'Merhaba 🎉')
        self.assertEqual(m.make_notice('x'*2000)['delivery'],'in-app')
    def test_only_announcements_change(self):
        calls=[];notice=m.make_notice('Merhaba & iyi oyunlar!');old=m.field(m.make_notice('Önceki'))
        def opener(req,**kwargs):
            calls.append(req)
            if req.get_method()=='GET':return self.response(self.document([old]))
            self.assertEqual(set(json.loads(req.data)['fields']),{'announcements'})
            values=json.loads(req.data)['fields']['announcements']['arrayValue']['values']
            self.assertEqual(values,[old,m.field(notice)])
            self.assertIn('updateMask.fieldPaths=announcements',req.full_url)
            self.assertIn('currentDocument.updateTime=v1',req.full_url)
            return self.response({})
        m.publish(notice,'mock-token',opener);self.assertEqual(len(calls),2)
    def test_conflict_rereads_and_preserves_other_admin_notice(self):
        notice=m.make_notice('Yeni');concurrent=m.field(m.make_notice('Diğer yönetici'));calls=[]
        def opener(req,**kwargs):
            calls.append(req)
            if len(calls)==1:return self.response(self.document())
            if len(calls)==2:raise HTTPError(req.full_url,412,'conflict',{},None)
            if len(calls)==3:return self.response(self.document([concurrent],'v2'))
            self.assertEqual(json.loads(req.data)['fields']['announcements']['arrayValue']['values'],[concurrent,m.field(notice)])
            self.assertIn('currentDocument.updateTime=v2',req.full_url)
            return self.response({})
        m.publish(notice,'mock-token',opener);self.assertEqual(len(calls),4)
    def test_uncertain_write_is_not_duplicated(self):
        notice=m.make_notice('Yeni');calls=[]
        def opener(req,**kwargs):
            calls.append(req)
            if len(calls)==1:return self.response(self.document())
            if len(calls)==2:raise URLError('response lost')
            return self.response(self.document([m.field(notice)],'v2'))
        m.publish(notice,'mock-token',opener);self.assertEqual(len(calls),3)
    def test_full_archive_is_not_pruned(self):
        entries=[m.field(m.make_notice(str(i))) for i in range(30)]
        def opener(req,**kwargs):
            self.assertEqual(req.get_method(),'GET');return self.response(self.document(entries))
        with self.assertRaises(ValueError):m.publish(m.make_notice('Yeni'),'mock-token',opener)
    def test_permission_denial_never_claims_success(self):
        def opener(req,**kwargs):raise HTTPError(req.full_url,403,'denied',{},None)
        with self.assertRaises(HTTPError):m.publish(m.make_notice('Yeni'),'mock-token',opener)

if __name__=='__main__':unittest.main()
