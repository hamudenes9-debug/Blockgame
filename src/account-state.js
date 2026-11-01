import {LEVELS} from './word-levels.js';
import {cleanTrophies} from './trophies.js';
import {cleanAvatar} from './avatar.js';
import {cleanWallet} from './word-wallet.js';
const number=(v,max)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
const strings=(v,n)=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string').map(x=>x.slice(0,30)))].slice(0,n):[];
export function cleanAccount(raw={}){
 if(!raw||typeof raw!=='object')raw={};
 const progress={};for(let i=1;i<=LEVELS.length;i++){const p=raw.progress?.[i];if(p&&typeof p==='object')progress[i]={found:strings(p.found,30),bonus:strings(p.bonus,30),hints:strings(p.hints,200),hintsUsed:number(p.hintsUsed,10000),completed:p.completed===true};}
 const wallet=cleanWallet(raw.wallet);wallet.hints=number(wallet.hints,1000000);wallet.claimed=wallet.claimed.filter(n=>n<=LEVELS.length);
 const records=[]; // Retire all legacy points; never convert them into trophies.

 const s=raw.streak||{};const streak={lastDay:typeof s.lastDay==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s.lastDay)?s.lastDay:null,streak:number(s.streak,100000),best:number(s.best,100000),count:number(s.count,1000000)};
 return {stage:Math.max(1,number(raw.stage,LEVELS.length)),wallet,progress,records,streak,trophies:cleanTrophies(raw.trophies),avatar:cleanAvatar(raw.avatar)};
}
export const accountKey=uid=>'seyyah-account-v1-'+(uid?'uid:'+uid:'guest');
export const sameState=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
