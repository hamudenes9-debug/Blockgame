import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('event_upgrade', Path(__file__).parent.parent/'admin-tools/upgrade-event-v1.py')
upgrade = importlib.util.module_from_spec(spec)
spec.loader.exec_module(upgrade)

class EventUpgradeTest(unittest.TestCase):
    def run_upgrade(self, schema=4):
        calls=[]
        document={'updateTime':'2026-11-01T15:00:00Z','fields':{
            'minimumSchema':upgrade.field(schema),'minimumVersion':upgrade.field('1.10.1'),
            'maintenance':upgrade.field({'enabled':True}), 'holidaysEnabled':upgrade.field(False),
            'announcements':upgrade.field([{'id':'other','title':'Preserved'}, {'id':'premium-sales-20261101','title':'Old offer'}])}}
        def respond(req,**kwargs):
            url=req if isinstance(req,str) else req.full_url
            calls.append((url,req))
            if isinstance(req,str):
                self.assertTrue(url.startswith(upgrade.SOURCE))
                return io.BytesIO(b'{"version":"1.12.0"}' if url.endswith('package.json') else b"rules_version = '2'; data.version == 6")
            self.assertEqual(req.get_header('Authorization'),'Bearer mock-token')
            if req.method=='GET':
                body=document if '/documents/' in url else {'name':'projects/blockgame-46ae9/releases/cloud.firestore','rulesetName':'previous'}
            elif req.method=='POST':
                self.assertTrue(url.endswith('/rulesets'));body={'name':'projects/blockgame-46ae9/rulesets/test-new'}
            elif '/releases/' in url:
                payload=json.loads(req.data);self.assertEqual(payload['release']['rulesetName'],'projects/blockgame-46ae9/rulesets/test-new');body={}
            else:
                payload=json.loads(req.data)['fields'];self.assertEqual(set(payload),{'minimumVersion','minimumSchema','levelIds'})
                self.assertIn('currentDocument.updateTime=',url)
                self.assertEqual(payload['minimumSchema']['integerValue'],'6')
                self.assertEqual(len(payload['levelIds']['arrayValue']['values']),124);body={}
            return io.BytesIO(json.dumps(body).encode())
        with tempfile.TemporaryDirectory() as home, patch.dict(os.environ,{'HOME':home}), patch.object(upgrade.subprocess,'check_output',return_value='mock-token'),patch.object(upgrade.urllib.request,'urlopen',side_effect=respond),contextlib.redirect_stdout(io.StringIO()):
            if schema>6:
                with self.assertRaises(ValueError):upgrade.main()
                self.assertFalse(any(not isinstance(req,str) and req.method!='GET' for _,req in calls))
            else:
                upgrade.main();files=list(Path(home).glob('*.json'));self.assertEqual(len(files),1);self.assertEqual(files[0].stat().st_mode & 0o777,0o600)
                self.assertEqual(json.loads(files[0].read_text())['operations'],document)
        return calls
    def test_scoped_deployment_and_backup(self):self.run_upgrade()
    def test_never_downgrades_future_schema(self):self.run_upgrade(7)

if __name__=='__main__':unittest.main()
