import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync('capacitor.config.json','utf8'));
const services=JSON.parse(fs.readFileSync('android/app/google-services.json','utf8'));
const client=services.client.find(c=>c.client_info.android_client_info?.package_name===config.appId);
if(!client)throw Error('Firebase package name does not match appId');
if(!client.oauth_client.some(c=>c.client_type===3))throw Error('Google web OAuth client missing');
// Public client configuration, not a service-account key. Native Google token
// is exchanged with the JS SDK so Firestore shares the authenticated session.
fs.writeFileSync('src/firebase-android.json',JSON.stringify({apiKey:client.api_key[0].current_key,projectId:services.project_info.project_id,appId:client.client_info.mobilesdk_app_id,authDomain:`${services.project_info.project_id}.firebaseapp.com`},null,2)+'\n');
