import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root=new URL('../download-site/',import.meta.url);
const html=fs.readFileSync(new URL('index.html',root),'utf8');
test('all three Hemen indir CTAs open latest GitHub release securely',()=>{
 const buttons=[...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].filter(m=>m[2].includes('Hemen indir'));
 assert.equal(buttons.length,3);
 for(const [,attrs] of buttons){assert.match(attrs,/href="https:\/\/github\.com\/hamudenes9-debug\/Blockgame\/releases\/latest"/);assert.match(attrs,/target="_blank"/);assert.match(attrs,/rel="noopener noreferrer"/);}
});
test('static site has all local scenery, fonts, CSS and script assets',()=>{
 for(const file of ['style.css','site.js','assets/compass.svg',...Array.from({length:10},(_,i)=>`assets/region-${i}.svg`)])assert.ok(fs.existsSync(new URL(file,root)),file);
 const css=fs.readFileSync(new URL('style.css',root),'utf8');for(const [,file] of css.matchAll(/url\('([^']+)'\)/g))assert.ok(fs.existsSync(new URL(file,root)),file);
});
test('download site remains independent of the Android game entry',()=>{
 assert.match(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),/src="\/src\/main.js"/);
 assert.doesNotMatch(html,/firebase|analytics|<iframe|<form/i);
 assert.match(html,/lang="tr"/);assert.match(html,/role="tablist"/);
});
