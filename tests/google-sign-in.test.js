import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeGoogleSignIn} from '../src/google-sign-in.js';
test('successful Credential Manager sign-in is not retried',async()=>{
 const calls=[]; const result={credential:{idToken:'test-token'}};
 assert.equal(await nativeGoogleSignIn({signInWithGoogle:async opts=>{calls.push(opts);return result;}}),result);
 assert.deepEqual(calls,[{useCredentialManager:true}]);
});
test('no credentials opens alternative picker',async()=>{
 const calls=[];const result={credential:{idToken:'test-token'}};
 assert.equal(await nativeGoogleSignIn({signInWithGoogle:async opts=>{calls.push(opts);if(opts.useCredentialManager)throw Error('No credentials available');return result;}}),result);
 assert.deepEqual(calls,[{useCredentialManager:true},{useCredentialManager:false}]);
});
test('cancellation and configuration errors are not retried',async()=>{
 for(const message of ['User canceled','DEVELOPER_ERROR','Network error']){
  let calls=0;const error=Error(message);
  await assert.rejects(nativeGoogleSignIn({signInWithGoogle:async()=>{calls++;throw error;}}),e=>e===error);
  assert.equal(calls,1);
 }
});
test('fallback errors propagate, without retry loops',async()=>{
 let calls=0;
 await assert.rejects(nativeGoogleSignIn({signInWithGoogle:async()=>{calls++;throw Error('No credentials available');}}),/No credentials/);
 assert.equal(calls,2);
});
