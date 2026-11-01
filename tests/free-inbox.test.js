import test from 'node:test';import assert from 'node:assert/strict';
import {inboxDays,readIds,saveRead,buildInbox} from '../src/free-inbox.js';
function storage(){const data=new Map();return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};}
test('seven Istanbul calendar days cross month and year boundaries',()=>assert.deepEqual(inboxDays(new Date('2027-01-01T21:00:00Z')),['2027-01-02','2027-01-01','2026-12-31','2026-12-30','2026-12-29','2026-12-28','2026-12-27']));
test('read status persists per account and is bounded',()=>{const s=storage();for(let i=0;i<501;i++)saveRead(s,'one','id'+i);assert.equal(readIds(s,'one').size,500);assert.equal(readIds(s,'one').has('id0'),false);assert.equal(readIds(s,'two').size,0);saveRead(s,'one','id500');assert.equal(readIds(s,'one').size,500);});
test('malformed read storage is ignored',()=>{assert.equal(readIds({getItem:()=>'{invalid'},'one').size,0);assert.equal(readIds({getItem:()=>'{}'},'one').size,0);});
test('inbox uses sender UID, truthful fallback, date sorting and local read state',()=>{const result=buildInbox([{id:'old',fromUid:'one',time:1},{id:'new',fromUid:'two',time:2}],new Map([['one','Ümit']]),new Set(['old']));assert.equal(result[0].body,'Bir seyyah seni beğendi.');assert.equal(result[0].read,false);assert.equal(result[1].body,'Ümit seni beğendi.');assert.equal(result[1].read,true);});
test('empty likes produce no invented notifications',()=>assert.deepEqual(buildInbox([],new Map(),new Set()),[]));
