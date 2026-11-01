import test from 'node:test';import assert from 'node:assert/strict';
import {mergeAnnouncements} from '../notices.mjs';
test('scheduled publication preserves manual notices and excludes them from push',()=>{const manual={id:'shell-123',body:'Manual'};const merged=mergeAnnouncements([{id:'source'}],[manual,{id:'retired-source'}]);assert.deepEqual(merged,[{id:'source'},{...manual,delivery:'in-app'}]);assert.deepEqual(manual,{id:'shell-123',body:'Manual'});});
test('capacity and duplicate failures never silently discard archive entries',()=>{assert.throws(()=>mergeAnnouncements([{id:'new'}],Array.from({length:30},(_,i)=>({id:'shell-'+i}))));assert.throws(()=>mergeAnnouncements([{id:'shell-owned'}]));assert.throws(()=>mergeAnnouncements([{id:'a'},{id:'a'}]));});
