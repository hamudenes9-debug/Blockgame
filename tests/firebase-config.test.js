import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
test('native Google provider uses JS Firebase session',()=>{
 const cap=read('capacitor.config.json');
 assert.equal(cap.plugins.FirebaseAuthentication.skipNativeAuth,true);
 assert.deepEqual(cap.plugins.FirebaseAuthentication.providers,['google.com','github.com','yahoo.com']);
 const services=read('android/app/google-services.json');
 const client=services.client.find(c=>c.client_info.android_client_info.package_name===cap.appId);
 assert.ok(client.oauth_client.some(c=>c.client_type===3));
 const generated=read('src/firebase-android.json');
 assert.equal(generated.projectId,services.project_info.project_id);
 assert.equal(generated.apiKey,client.api_key[0].current_key);
 assert.equal(generated.appId,client.client_info.mobilesdk_app_id);
});
test('Android OAuth client matches the registered APK certificate',()=>{
 const cap=read('capacitor.config.json');
 const services=read('android/app/google-services.json');
 const client=services.client.find(c=>c.client_info.android_client_info.package_name===cap.appId);
 assert.ok(client.oauth_client.some(c=>c.client_type===1 && c.android_info.package_name===cap.appId && c.android_info.certificate_hash.toLowerCase()==='09fa6f51c6701f1891fd5e7d117d1c11180a2aae'));
});
