import test from 'node:test';
import assert from 'node:assert/strict';
import {withTimeout,describeCloudError} from '../src/cloud-status.js';
test('successful server response is retained',async()=>assert.equal(await withTimeout(Promise.resolve('ok'),20),'ok'));
test('server denial code survives',async()=>{const error={code:'permission-denied'};await assert.rejects(withTimeout(Promise.reject(error),20),e=>e===error);});
test('stalled server request times out',async()=>await assert.rejects(withTimeout(new Promise(()=>{}),10),e=>e.code==='client-timeout'));
test('late server rejection is handled',async()=>{let reject;const p=new Promise((_,r)=>reject=r);await assert.rejects(withTimeout(p,5));reject(Error('late'));await new Promise(r=>setTimeout(r,5));});
test('timeout does not falsely claim write was rejected',()=>{assert.match(describeCloudError({code:'client-timeout'},true),/henüz doğrulanamadı/);});
test('permission and auth errors have distinct advice',()=>{assert.match(describeCloudError({code:'permission-denied'}),/Rules/);assert.match(describeCloudError({code:'unauthenticated'}),/Google/);});
