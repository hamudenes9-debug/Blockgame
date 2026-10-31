import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyBoard,canPlace,place,hasMove,seededRandom} from '../src/game.js';
test('bounds and occupied cells reject placement',()=>{const b=emptyBoard();b[0][0]=1;assert.equal(canPlace(b,[[0,0]],0,0),false);assert.equal(canPlace(b,[[0,0],[0,1]],0,7),false);assert.equal(canPlace(b,[[0,0]],-1,0),false);});
test('clears a row and column simultaneously without mutating input',()=>{const b=emptyBoard();for(let i=1;i<8;i++){b[0][i]=1;b[i][0]=1;}const result=place(b,[[0,0]],0,0,2);assert.equal(result.lines,2);assert.equal(result.points,410);assert.deepEqual(result.board,emptyBoard());assert.equal(b[0][1],1);});
test('rejects invalid placement',()=>assert.equal(place(emptyBoard(),[[0,0]],8,0,1),null));
test('detects blocked boards and skips consumed pieces',()=>{const b=emptyBoard().map(row=>row.map(()=>1));assert.equal(hasMove(b,[null,{shape:[[0,0]]}]),false);b[4][4]=0;assert.equal(hasMove(b,[null,{shape:[[0,0]]}]),true);assert.equal(hasMove(b,[{shape:[[0,0],[0,1]]}]),false);});
test('daily random sequences are reproducible',()=>{const a=seededRandom(20261031),b=seededRandom(20261031);for(let i=0;i<50;i++)assert.equal(a(),b());});
