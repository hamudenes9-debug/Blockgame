import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {APP_VERSION,compareVersions,checkUpdate} from '../src/version.js';
const mock=(tag,assets=[{name:'Blokko.apk'}])=>async()=>({ok:true,json:async()=>({tag_name:tag,assets})});
test('semantic versions compare numerically',()=>{assert.equal(compareVersions('v1.10.0','1.9.0'),1);assert.equal(compareVersions('v1.4.0','1.4.0'),0);assert.equal(compareVersions('junk','1.4.0'),null);});
test('APK package and update checker versions agree',()=>{const pkg=JSON.parse(fs.readFileSync('package.json'));assert.equal(pkg.version,APP_VERSION);assert.ok(fs.readFileSync('android/app/build.gradle','utf8').includes(`versionName "${APP_VERSION}"`));});
test('new release with APK offers trusted release page',async()=>{const r=await checkUpdate(mock('v9.0.0'));assert.equal(r.status,'update');assert.equal(r.url,'https://github.com/hamudenes9-debug/Blockgame/releases/tag/v9.0.0');});
test('current release, missing APK, rate limit and offline handled',async()=>{assert.equal((await checkUpdate(mock(APP_VERSION))).status,'current');assert.equal((await checkUpdate(mock('v9.0.0',[]))).status,'unknown');assert.equal((await checkUpdate(async()=>({ok:false,status:403}))).status,'unknown');assert.equal((await checkUpdate(async()=>{throw Error('offline');})).status,'unknown');});
