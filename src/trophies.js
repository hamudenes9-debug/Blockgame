import {LEVELS} from './word-levels.js';
export function cleanTrophies(raw={}){const claimed=Array.isArray(raw?.claimed)?[...new Set(raw.claimed.filter(n=>Number.isInteger(n)&&n>=1&&n<=LEVELS.length))].sort((a,b)=>a-b):[];const prestige=Math.max(0,Math.min(Math.floor(claimed.length*20/1000),Math.floor(Number(raw?.prestige)||0)));return {season:1,claimed,prestige};}
export const trophyCount=raw=>{const t=cleanTrophies(raw);return t.claimed.length*20-t.prestige*1000;};
export function awardTrophies(raw,level){const t=cleanTrophies(raw);if(!Number.isInteger(level)||level<1||level>LEVELS.length||t.claimed.includes(level))return {trophies:t,earned:0};t.claimed.push(level);return {trophies:cleanTrophies(t),earned:20};}
export function prestigeUp(raw){const t=cleanTrophies(raw);if(trophyCount(t)<1000)return {ok:false,trophies:t};t.prestige++;return {ok:true,trophies:t};}
