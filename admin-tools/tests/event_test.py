import contextlib
from datetime import datetime, timedelta, timezone
import importlib.util
import io
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import event as m
from yonetim import data
NOW=datetime(2026,11,1,tzinfo=timezone.utc)
class Fake:
    def __init__(self,schema=6):self.writes=[];self.doc={'updateTime':'v1','fields':{'minimumSchema':{'integerValue':str(schema)},'announcements':{'arrayValue':{}},'maintenance':{'mapValue':{'fields':{'enabled':{'booleanValue':True}}}}}}
    def get(self,path):return self.doc
    def patch(self,path,old,fields):self.writes.append(fields);self.doc['fields'].update(fields)
class EventTest(unittest.TestCase):
    def setUp(self):self.output=io.StringIO();self.redirect=contextlib.redirect_stdout(self.output);self.redirect.__enter__()
    def tearDown(self):self.redirect.__exit__(None,None,None)
    def test_exact_minutes_scoped_write_and_status(self):
        c=Fake();m.control(c,'30',lambda _:'ONAY event-30',NOW);self.assertEqual(set(c.writes[0]),{'rewardEvent'});event=data(c.doc)['rewardEvent'];self.assertEqual(event['endsAt'],'2026-11-01T00:30:00+00:00');m.control(c,'durum',now=NOW);self.assertEqual(len(c.writes),1)
        with self.assertRaises(ValueError):m.control(c,'30',lambda _:'ONAY event-30',NOW)
        m.control(c,'kapat',lambda _:'ONAY event-kapat',NOW);self.assertFalse(data(c.doc)['rewardEvent']['enabled'])
    def test_confirmation_and_schema_guard(self):
        for c,reply in [(Fake(),'wrong'),(Fake(5),'ONAY event-30')]:
            with self.assertRaises(ValueError):m.control(c,'30',lambda _:reply,NOW)
            self.assertEqual(c.writes,[])
    def test_invalid_minutes_no_credentials(self):
        with patch.object(m.subprocess,'check_output') as token,contextlib.redirect_stderr(io.StringIO()):
            for v in ['0','-1','1.5','10081','nan']:
                self.assertEqual(m.main([v]),1)
            token.assert_not_called()
    def test_expiry_status_is_read_only(self):
        c=Fake();m.control(c,'1',lambda _:'ONAY event-1',NOW);m.control(c,'durum',now=datetime(2026,11,1,0,1,tzinfo=timezone.utc));self.assertIn('SONA ERMİŞ',self.output.getvalue());self.assertEqual(len(c.writes),1)
    def test_full_duration_starts_after_confirmation(self):
        c=Fake()
        with patch.object(m,'datetime') as clock:
            clock.now.side_effect=[NOW,NOW+timedelta(minutes=15)]
            m.control(c,'30',lambda _:'ONAY event-30')
        value=data(c.doc)['rewardEvent']
        self.assertEqual(value['startsAt'],'2026-11-01T00:15:00+00:00')
        self.assertEqual(value['endsAt'],'2026-11-01T00:45:00+00:00')
if __name__=='__main__':unittest.main()
