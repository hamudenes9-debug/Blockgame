import {LEVELS} from './word-levels.js';
export function cleanTrophies(raw={}){
 const claimed=Array.isArray(raw?.claimed)?[...new Set(raw.claimed.filter(n=>Number.isInteger(n)&&n>=1&&n<=LEVELS.length))].sort((a,b)=>a-b):[];
 const list=(key,allowed)=>Array.isArray(raw?.[key])?[...new Set(raw[key].filter(n=>allowed.includes(n)))].sort((a,b)=>a-b):[];
 const festival=list('festival',claimed),premium=list('premium',claimed),premiumFestival=list('premiumFestival',premium.filter(n=>festival.includes(n)));
 const events=Object.fromEntries(Object.entries(raw?.events||{}).filter(([key,id])=>String(Number(key))===key&&claimed.includes(Number(key))&&typeof id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(id)));
 const eventPoints=Object.keys(events).length?Math.max(0,Math.min(Object.keys(events).length*80,Math.floor((Number(raw?.eventPoints)||0)/20)*20)):0;
 const prestige=Math.max(0,Math.min(Math.floor(((claimed.length+festival.length+premium.length+premiumFestival.length)*20+eventPoints)/1000),Math.floor(Number(raw?.prestige)||0)));
 return {season:1,claimed,prestige,...(festival.length?{festival}:{}),...(premium.length?{premium}:{}),...(premiumFestival.length?{premiumFestival}:{}),...(Object.keys(events).length?{events,eventPoints}:{})};
}
export const trophyCount=raw=>{const t=cleanTrophies(raw);return (t.claimed.length+(t.festival?.length||0)+(t.premium?.length||0)+(t.premiumFestival?.length||0))*20+(t.eventPoints||0)-t.prestige*1000;};
export function awardTrophies(raw,level,festival=false,premium=false,eventId=null){const t=cleanTrophies(raw);if(!Number.isInteger(level)||level<1||level>LEVELS.length||t.claimed.includes(level))return {trophies:t,earned:0};t.claimed.push(level);if(festival)t.festival=[...(t.festival||[]),level];if(premium)t.premium=[...(t.premium||[]),level];if(premium&&festival)t.premiumFestival=[...(t.premiumFestival||[]),level];const base=20*(festival?2:1)*(premium?2:1);if(eventId){t.events={...(t.events||{}),[level]:eventId};t.eventPoints=(t.eventPoints||0)+base;}return {trophies:cleanTrophies(t),earned:base*(eventId?2:1)};}
export function prestigeUp(raw){const t=cleanTrophies(raw);if(trophyCount(t)<1000)return {ok:false,trophies:t};t.prestige++;return {ok:true,trophies:t};}
