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
spec=importlib.util.spec_from_file_location('bildirim',ROOT/'bildirim.py')
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class BildirimTest(unittest.TestCase):
    def response(self,data):return io.BytesIO(json.dumps(data).encode())
    def device(self,name,token,platform='android'):
        return {'name':'projects/blockgame-46ae9/databases/(default)/documents/'+name,'fields':{'platform':{'stringValue':platform},'token':{'stringValue':token}}}
    def notice(self):return m.duyuru.make_notice('Merhaba seyyahlar!',identifier='shell-push-test')
    def test_pagination_dedup_payload_and_scoped_writes(self):
        pages=[[self.device('users/a/devices/1','token-a'),self.device('users/b/devices/2','ios','ios')],
               [self.device('users/c/devices/3','token-a'),self.device('other/x/devices/4','not-owned')],
               [self.device('users/d/devices/5','token-b')]]
        calls=[];sent=[];queries=[]
        def opener(req,**kwargs):
            calls.append(req);body=json.loads(req.data)
            self.assertEqual(req.get_header('Authorization'),'Bearer mock-owner-token')
            if ':runQuery' in req.full_url:
                query=body['structuredQuery'];queries.append(query)
                if len(queries)>1:self.assertFalse(query['startAt']['before'])
                return self.response([{'document':d} for d in pages[len(queries)-1]])
            if req.full_url==m.FCM:
                sent.append(body['message']['token']);message=body['message']
                self.assertEqual(message['data'],{'route':'news','noticeId':'shell-push-test'})
                self.assertEqual(message['android']['notification']['channelId'],'news')
                self.assertEqual(message['android']['priority'],'HIGH')
                self.assertEqual(message['notification']['body'],'Merhaba seyyahlar!')
                return self.response({'name':'projects/blockgame-46ae9/messages/accepted'})
            self.assertIn('/notificationDeliveries',req.full_url)
            if req.method=='PATCH':
                self.assertEqual(body['fields']['accepted']['integerValue'],'2')
                self.assertTrue(body['fields']['scanComplete']['booleanValue'])
            return self.response({})
        with patch.object(m,'PAGE_SIZE',2):counts,complete,recorded=m.dispatch(self.notice(),'mock-owner-token',opener,workers=1)
        self.assertEqual(sent,['token-a','token-b']);self.assertTrue(complete);self.assertTrue(recorded)
        self.assertEqual(counts,{'accepted':2,'failed':0,'uncertain':0,'skipped':0})
        self.assertIn('/notificationDeliveries?',calls[0].full_url)
    def test_reservation_failure_never_sends(self):
        calls=[]
        def opener(req,**kwargs):
            calls.append(req);raise HTTPError(req.full_url,409,'exists',{},None)
        with self.assertRaises(HTTPError):m.dispatch(self.notice(),'mock',opener)
        self.assertEqual(len(calls),1)
    def failure_case(self,uncertain=False):
        sends=[]
        def opener(req,**kwargs):
            if ':runQuery' in req.full_url:return self.response([{'document':self.device('users/a/devices/'+str(i),'token-'+str(i))} for i in range(3)])
            if req.full_url==m.FCM:
                sends.append(req)
                if uncertain:raise URLError('response lost')
                raise HTTPError(req.full_url,403,'permission',{},None)
            return self.response({})
        counts,complete,recorded=m.dispatch(self.notice(),'mock',opener,workers=1)
        self.assertEqual(len(sends),1);self.assertFalse(complete);self.assertTrue(recorded)
        self.assertEqual(counts['uncertain' if uncertain else 'failed'],1);self.assertEqual(counts['skipped'],2)
    def test_permission_failure_stops_further_sends(self):self.failure_case()
    def test_ambiguous_fcm_response_is_never_retried(self):self.failure_case(True)
    def test_no_registered_devices_is_not_a_delivery_claim(self):
        def opener(req,**kwargs):return self.response([] if ':runQuery' in req.full_url else {})
        counts,complete,recorded=m.dispatch(self.notice(),'mock',opener)
        self.assertEqual(sum(counts.values()),0);self.assertTrue(complete);self.assertTrue(recorded)
    def test_empty_or_oversize_text_never_authenticates_or_sends(self):
        with patch.object(m.subprocess,'check_output') as auth,contextlib.redirect_stdout(io.StringIO()),contextlib.redirect_stderr(io.StringIO()):
            for args in [[],[' '],['x'*501],['🎉'*251]]:self.assertNotEqual(m.main(args),0)
            self.assertEqual(m.main(['--help']),0);auth.assert_not_called()
    def test_no_tokens_in_results(self):
        target=self.device('users/a/devices/1','PRIVATE-DEVICE-TOKEN')
        def opener(req,**kwargs):
            if ':runQuery' in req.full_url:return self.response([{'document':target}])
            if req.full_url==m.FCM:return self.response({'name':'accepted'})
            payload=json.loads(req.data);self.assertNotIn('PRIVATE-DEVICE-TOKEN',json.dumps(payload))
            return self.response({})
        result=m.dispatch(self.notice(),'mock',opener);self.assertNotIn('PRIVATE-DEVICE-TOKEN',str(result))

if __name__=='__main__':unittest.main()
