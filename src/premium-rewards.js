import {LEVELS} from './word-levels.js';
import {cleanAccount} from './account-state.js';
// Called inside the same transaction as the immutable Premium receipt. Pending
// bonus gold is never placed in the spendable local wallet before confirmation.
export function settlePremiumGold(state, previous){
 const eventExtra=Object.keys(state.trophies.events||{}).filter(n=>!previous?.trophies?.events?.[n]&&!previous?.wallet?.claimed?.includes(Number(n))).reduce((sum,n)=>sum+(LEVELS[Number(n)-1].words.length*5+25)*(state.trophies.premium?.includes(Number(n))?2:1),0);
 const extra=(state.trophies.premium||[]).filter(n=>!previous?.trophies?.premium?.includes(n)&&!previous?.wallet?.claimed?.includes(n)).reduce((sum,n)=>sum+LEVELS[n-1].words.length*5+25,0);
 return cleanAccount({...state,wallet:{...state.wallet,gold:Math.min(1e9,state.wallet.gold+extra+eventExtra)}});
}
