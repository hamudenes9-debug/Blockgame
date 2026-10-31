// Curated Turkish puzzles. A letter tile can only be used once per word.
export const REGIONS=[
 {name:'İstanbul',subtitle:'İki kıta, bin kelime',color:'#367f79',sky:'#d5e9e8'},
 {name:'Kapadokya',subtitle:'Masalsı vadiler',color:'#bf825f',sky:'#f6dfcb'},
 {name:'Ege kıyıları',subtitle:'Mavinin peşinde',color:'#448fa4',sky:'#d8edf2'},
 {name:'Pamukkale',subtitle:'Beyaz bir yolculuk',color:'#719fa3',sky:'#e3f3ef'},
 {name:'Kaçkar dağları',subtitle:'Zirveye bir kelime',color:'#668568',sky:'#e2ebdf'},
 {name:'Mardin',subtitle:'Taşların anlattıkları',color:'#af8a56',sky:'#f4e8d4'}
];
const data=[
 ['KALE',['KALE','KEL','KAL','EL','EK'],['AL','AK']],
 ['ELMA',['ELMA','ALEM','MAL','AL','EL'],['AMEL']],
 ['KALEM',['KALEM','KELAM','KALE','ALEM','KEL'],['MAL','EL','EK','AL','AK','AMEL']],
 ['DENİZ',['DENİZ','DİZ','DİN','İZ','İN'],['EN']],
 ['BAHAR',['BAHAR','HARA','ARA','BAR'],['AH']],
 ['SOFRA',['SOFRA','SOR','RAF','FAR','SAF'],['AS']],
 ['YOLCU',['YOLCU','YOL','OY','OL'],[]],
 ['KİTAP',['KİTAP','TAKİP','KAT','PAK','İP'],['AT','AK','KİT']],
 ['KARTAL',['KARTAL','TARLA','KART','KARA','AL'],['AT','AK','KAL','KAT','ARA']],
 ['BULUT',['BULUT','BUL','BUT'],[]],
 ['YAPRAK',['YAPRAK','PARK','PARA','KAYA','YARA'],['ARPA','KAP','YAR','ARA','AY','AK']],
 ['ÇİÇEK',['ÇİÇEK','ÇEK','İÇ','EK'],[]],
 ['KÖPRÜ',['KÖPRÜ','KÖR','KÜP','KÜR','ÖP'],['ÖR']],
 ['GÜNEŞ',['GÜNEŞ','GÜN','GEN','ŞEN','EŞ'],['ÜN']],
 ['ORMAN',['ORMAN','ROMAN','NORM','NAR','MOR'],['ON','AN']],
 ['PAZAR',['PAZAR','PARA','ARPA','ARA','ZAR'],['AZ','ARZ']],
 ['SEVGİ',['SEVGİ','SEV','EV','İS'],['ES']],
 ['KAPLAN',['KAPLAN','KANAL','PLAN','KAN','ALAN'],['KAP','AL','AK','AN']],
 ['DÜNYA',['DÜNYA','DÜN','YAN','AY','AD'],['AN']],
 ['BALIK',['BALIK','AKIL','BAL','BAK','KIL'],['KAL','AL','AK']],
 ['KELİME',['KELİME','EKİM','ELEK','EMEL','EL'],['EK','KEL','İL','İM']],
 ['SAHİL',['SAHİL','İLAH','HAL','SAL','HAS'],['İS','AL','AH']],
 ['MASAL',['MASAL','MASA','ASAL','SAL','AMA'],['AL','AS']],
 ['DOĞA',['DOĞA','DAĞ','AĞ','AD'],[]]
];
export const LEVELS=data.map(([letters,words,bonus],i)=>({id:i+1,letters:[...letters],words,bonus,region:REGIONS[Math.floor(i/4)]}));
