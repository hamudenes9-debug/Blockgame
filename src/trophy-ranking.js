import {collection,query,orderBy,limit,where,getDocsFromServer} from 'firebase/firestore';
import {requireCloudUser} from './firebase.js';import {withTimeout} from './cloud-status.js';
export async function getTrophyRanking(prestige=false){const {db}=await requireCloudUser();const constraints=prestige?[where('prestige','>',0),orderBy('prestige','desc'),limit(20)]:[orderBy('trophies','desc'),limit(20)];const result=await withTimeout(getDocsFromServer(query(collection(db,'trophyPlayers'),...constraints)));return result.docs.map(d=>({uid:d.id,...d.data()}));}
