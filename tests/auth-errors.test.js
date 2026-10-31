import test from 'node:test';
import assert from 'node:assert/strict';
import {describeAuthError} from '../src/auth-errors.js';
test('Firebase error code and stage are retained',()=>{
 const result=describeAuthError({code:'auth/configuration-not-found',message:'Firebase error'},'Firebase oturumu');
 assert.match(result,/auth\/configuration-not-found/);
 assert.match(result,/Firebase oturumu/);
 assert.doesNotMatch(result,/tekrar ekle/);
});
test('native error status is preserved without echoing payloads',()=>{
 const result=describeAuthError({message:'10: DEVELOPER_ERROR token=secret'},'Android Google hesap seçimi');
 assert.match(result,/10|DEVELOPER_ERROR/);
 assert.doesNotMatch(result,/token|secret/);
});
test('cancellation stays distinct from configuration failure',()=>{
 assert.match(describeAuthError({message:'12501: canceled'},'Google'),/iptal/);
});
