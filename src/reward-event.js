// Eligibility uses the trusted server clock. Expiry is exclusive and needs no cron.
export function eventWindow(raw){
 if(!raw||raw.enabled!==true)return null;
 const time=v=>typeof v?.toMillis==='function'?v.toMillis():Date.parse(v);
 const start=time(raw.startsAt),end=time(raw.endsAt);
 if(!/^[a-zA-Z0-9_-]{1,80}$/.test(raw.id)||!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return null;
 return {id:raw.id,startsAt:start,endsAt:end};
}
export const activeEvent=(policy,now)=>{const e=policy?.rewardEvent;return e&&Number.isFinite(now)&&e.startsAt<=now&&now<e.endsAt?e:null;};
export const questMultiplier=(premium,event)=> (premium?2:1)*(event?2:1);
