import test from 'node:test';
import assert from 'node:assert/strict';
import {createShooter,stepShooter,HEIGHT} from '../src/shooter-engine.js';
test('shooting creates moving projectiles',()=>{const s=createShooter();stepShooter(s,.016,true,()=>.5);assert.equal(s.bullets.length,1);assert.ok(s.bullets[0].y<HEIGHT-51);});
test('projectiles damage blocks and score once',()=>{const s=createShooter();s.spawn=100;s.blocks=[{x:200,y:100,size:40,hp:1,maxHp:2,color:0}];s.bullets=[{x:200,y:125}];stepShooter(s,.03,false);assert.equal(s.score,100);assert.equal(s.kills,1);assert.equal(s.blocks.length,0);assert.equal(s.bullets.length,0);});
test('escaped blocks consume lives and end game',()=>{const s=createShooter();s.spawn=100;s.lives=1;s.blocks=[{x:100,y:HEIGHT-49,size:40,hp:1}];stepShooter(s,.016,false);assert.equal(s.lives,0);assert.equal(s.over,true);const time=s.time;stepShooter(s,.04,true);assert.equal(s.time,time);});
test('armored blocks need multiple hits',()=>{const s=createShooter();s.spawn=100;s.blocks=[{x:100,y:100,size:40,hp:2,maxHp:2}];s.bullets=[{x:100,y:125}];stepShooter(s,.03,false);assert.equal(s.blocks[0].hp,1);assert.equal(s.score,0);});
