import test from 'node:test';import assert from 'node:assert/strict';import {validLike,turkeyDay} from '../src/like-validation.js';
const time=Date.parse('2026-11-01T09:00:00Z'),params={day:'2026-11-01',targetUid:'recipient',fromUid:'sender'},like={...params,toUid:'recipient'},score={uid:'recipient',mode:'word',date:time};
test('genuine like validates against score owner and creation day',()=>assert.equal(validLike(params,like,score,time),true));
test('self likes and forged recipient cannot send notifications',()=>{assert.equal(validLike({...params,fromUid:'recipient'},like,score,time),false);assert.equal(validLike(params,like,{...score,uid:'other'},time),false);});
test('old-day and missing timestamp notifications are rejected',()=>{assert.equal(validLike(params,like,score,time-86400000),false);assert.equal(validLike(params,like,score,NaN),false);});
test('day boundary is Turkey midnight, not UTC midnight',()=>assert.equal(turkeyDay('2026-10-31T21:00:00Z'),'2026-11-01'));
