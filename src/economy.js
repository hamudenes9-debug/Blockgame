export const ITEMS={
 speed:{name:'Hızlı ateş',icon:'zap',description:'Her seviyede daha kısa atış aralığı.',base:120,max:3},
 power:{name:'Güçlü mermi',icon:'target',description:'Her seviyede mermilere +1 hasar.',base:200,max:2},
 armor:{name:'Ekstra can',icon:'heart',description:'Her oyuna +1 canla başla.',base:160,max:2}
};
export function normalizeEconomy(raw={}){return {gold:Math.max(0,Math.min(1e9,Math.floor(Number(raw?.gold)||0))),upgrades:Object.fromEntries(Object.entries(ITEMS).map(([id,item])=>[id,Math.max(0,Math.min(item.max,Math.floor(Number(raw?.upgrades?.[id])||0)))])),paid:Array.isArray(raw?.paid)?raw.paid.filter(id=>typeof id==='string').slice(-200):[]};}
export function priceFor(raw,id){const e=normalizeEconomy(raw),item=Object.hasOwn(ITEMS,id)?ITEMS[id]:null;return !item||e.upgrades[id]>=item.max?null:item.base*(e.upgrades[id]+1);}
export function purchase(raw,id){const e=normalizeEconomy(raw),price=priceFor(e,id);if(price===null)return {ok:false,reason:'Bu geliştirme en yüksek seviyede.',economy:e};if(e.gold<price)return {ok:false,reason:'Bu geliştirme için yeterli altının yok.',economy:e};e.gold-=price;e.upgrades[id]++;return {ok:true,economy:e};}
export function goldReward(result){return Math.max(0,Math.min(1000,Math.floor(Number(result.kills)||0)))*5+(result.won?50:0);}
export function settle(raw,id,result){const e=normalizeEconomy(raw);if(e.paid.includes(id))return {economy:e,earned:0};const earned=goldReward(result);e.gold+=earned;e.paid=[...e.paid,id].slice(-200);return {economy:e,earned};}
export function loadout(raw){const e=normalizeEconomy(raw);return {maxLives:3+e.upgrades.armor,damage:1+e.upgrades.power,fireInterval:.16-e.upgrades.speed*.025};}
