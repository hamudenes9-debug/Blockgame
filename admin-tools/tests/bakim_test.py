import contextlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
spec=importlib.util.spec_from_file_location('bakim',ROOT/'bakim.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class BakimTest(unittest.TestCase):
    def document(self, enabled=False, manual=False, version='v1'):
        return {'updateTime':version,'fields':{'maintenance':m.encode(m.clean_maintenance({'enabled':enabled})), 'maintenanceOverride':{'booleanValue':manual},'announcements':{'arrayValue':{'values':[]}},'minimumSchema':{'integerValue':'5'}}}
    def response(self,value):return io.BytesIO(json.dumps(value).encode())
    def test_status_never_writes(self):
        def opener(req,**kwargs):self.assertEqual(req.get_method(),'GET');return self.response(self.document())
        value,manual=m.control('durum','mock',opener=opener);self.assertFalse(value['enabled']);self.assertFalse(manual)
    def test_open_scopes_write_and_preserves_concurrent_changes(self):
        calls=[]
        def opener(req,**kwargs):
            calls.append(req)
            if len(calls)==1:return self.response(self.document())
            if len(calls)==2:raise HTTPError(req.full_url,412,'conflict',{},None)
            if len(calls)==3:return self.response(self.document(version='v2'))
            fields=json.loads(req.data)['fields'];self.assertEqual(set(fields),{'maintenance','maintenanceOverride'})
            self.assertTrue(fields['maintenanceOverride']['booleanValue']);self.assertIn('currentDocument.updateTime=v2',req.full_url)
            self.assertEqual(fields['maintenance']['mapValue']['fields']['until']['stringValue'],'19:30');return self.response({})
        value,manual=m.control('aç','mock','Güncelleme','19:30',opener);self.assertTrue(value['enabled']);self.assertTrue(manual);self.assertEqual(len(calls),4)
    def test_close_is_explicit_manual_override(self):
        def opener(req,**kwargs):
            if req.get_method()=='GET':return self.response(self.document(True,True))
            fields=json.loads(req.data)['fields'];self.assertFalse(fields['maintenance']['mapValue']['fields']['enabled']['booleanValue']);self.assertTrue(fields['maintenanceOverride']['booleanValue']);return self.response({})
        self.assertFalse(m.control('kapat','mock',opener=opener)[0]['enabled'])
    def test_github_release_never_leaks_google_token_to_source(self):
        def opener(req,**kwargs):
            if isinstance(req,str):self.assertEqual(req,m.SOURCE);return self.response({'maintenance':{'enabled':True,'message':'GitHub bakımı'}})
            if req.get_method()=='GET':return self.response(self.document(False,True))
            fields=json.loads(req.data)['fields'];self.assertFalse(fields['maintenanceOverride']['booleanValue']);return self.response({})
        value,manual=m.control('github','mock',opener=opener);self.assertTrue(value['enabled']);self.assertFalse(manual)
    def test_uncertain_write_is_confirmed_by_read_without_duplicate_write(self):
        calls=[]
        def opener(req,**kwargs):
            calls.append(req)
            if len(calls)==1:return self.response(self.document(True,True))
            if len(calls)==2:raise URLError('response lost')
            return self.response(self.document(False,True,'v2'))
        value,manual=m.control('kapat','mock',opener=opener);self.assertFalse(value['enabled']);self.assertTrue(manual);self.assertEqual(len(calls),3)
    def test_validation_before_credentials(self):
        with patch.object(m.subprocess,'check_output') as auth,contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(m.main(['aç','x'*1001]),1);auth.assert_not_called()
        with self.assertRaises(ValueError):m.clean_maintenance({'enabled':'true'})
    def test_permission_error_is_not_success(self):
        def opener(req,**kwargs):raise HTTPError(req.full_url,403,'permission',{},None)
        with self.assertRaises(HTTPError):m.control('aç','mock',opener=opener)

if __name__=='__main__':unittest.main()
