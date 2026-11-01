export function turkeyDay(date){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(date));return ['year','month','day'].map(k=>p.find(v=>v.type===k).value).join('-');}
export function validLike({day,targetUid,fromUid},like,score,createdAt){
 if(!like||!score||!Number.isFinite(createdAt)||!Number.isFinite(score.date))return false;
 return fromUid!==targetUid&&like.fromUid===fromUid&&like.toUid===targetUid&&like.day===day&&score.uid===targetUid&&score.mode==='word'&&turkeyDay(createdAt)===day&&turkeyDay(score.date)===day;
}
