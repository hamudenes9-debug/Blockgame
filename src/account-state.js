import {cleanWallet} from './word-wallet.js';
const number=(v,max)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
const strings=(v,n)=>Array.isArray(v)?[...new Set(v.filter(x=>typeof x==='string').map(x=>x.slice(0,30)))].slice(0,n):[];
export function cleanAccount(raw={}){
 if(!raw||typeof raw!=='object')raw={};
 const progress={};for(let i=1;i<=24;i++){const p=raw.progress?.[i];if(p&&typeof p==='object')progress[i]={found:strings(p.found,30),bonus:strings(p.bonus,30),hints:strings(p.hints,200),hintsUsed:number(p.hintsUsed,10000),completed:p.completed===true};}
 const wallet=cleanWallet(raw.wallet);wallet.hints=number(wallet.hints,1000000);wallet.claimed=wallet.claimed.filter(n=>n<=24);
 const records=(Array.isArray(raw.records)?raw.records:[]).filter(r=>r?.mode==='word').slice(0,100).map(r=>({score:number(r.score,10000000),words:number(r.words,30),stage:Math.max(1,number(r.stage,24)),mode:'word',date:number(r.date,8640000000000000),name:String(r.name||'Oyuncu').slice(0,100),uid:typeof r.uid==='string'?r.uid.slice(0,128):null}));
 const s=raw.streak||{};const streak={lastDay:typeof s.lastDay==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s.lastDay)?s.lastDay:null,streak:number(s.streak,100000),best:number(s.best,100000),count:number(s.count,1000000)};
 return {stage:Math.max(1,number(raw.stage,24)),wallet,progress,records,streak};
}
export const accountKey=uid=>'seyyah-account-v1-'+(uid?'uid:'+uid:'guest');
export const sameState=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
