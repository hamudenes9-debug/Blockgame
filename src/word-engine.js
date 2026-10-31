export const normalizeWord=s=>String(s).trim().normalize('NFC').toLocaleUpperCase('tr-TR');
export function canSpell(word,letters){const bag={};for(const c of letters)bag[c]=(bag[c]||0)+1;for(const c of normalizeWord(word)){if(!bag[c])return false;bag[c]--;}return true;}
export function buildCrossword(words){
 let grid=new Map();const placed=[];
 const at=(r,c)=>grid.get(`${r},${c}`);
 function valid(word,r,c,dir){const dr=dir==='v'?1:0,dc=dir==='h'?1:0;if(at(r-dr,c-dc)||at(r+dr*word.length,c+dc*word.length))return false;let crosses=0;for(let i=0;i<word.length;i++){const y=r+dr*i,x=c+dc*i,old=at(y,x);if(old){if(old.letter!==word[i]||old.dirs.includes(dir))return false;crosses++;}else if(at(y+dc,x+dr)||at(y-dc,x-dr))return false;}return placed.length===0||crosses>0;}
 function put(word,r,c,dir){const cells=[];for(let i=0;i<word.length;i++){const y=r+(dir==='v'?i:0),x=c+(dir==='h'?i:0),key=`${y},${x}`;const old=grid.get(key);grid.set(key,{letter:word[i],dirs:[...(old?.dirs||[]),dir],r:y,c:x});cells.push(key);}placed.push({word,r,c,dir,cells});}
 const remaining=[...words].sort((a,b)=>b.length-a.length);put(remaining.shift(),0,0,'h');

 let nodes=0;
 function solve(todo){if(!todo.length)return true;if(++nodes>50000)return false;const options=[];for(let w=0;w<todo.length;w++){const word=todo[w];for(const cell of grid.values())for(let i=0;i<word.length;i++){if(word[i]!==cell.letter)continue;for(const dir of ['h','v']){const r=cell.r-(dir==='v'?i:0),c=cell.c-(dir==='h'?i:0);if(!valid(word,r,c,dir))continue;const ys=[...grid.values()].map(v=>v.r),xs=[...grid.values()].map(v=>v.c);const h=Math.max(...ys,r+(dir==='v'?word.length-1:0))-Math.min(...ys,r)+1,b=Math.max(...xs,c+(dir==='h'?word.length-1:0))-Math.min(...xs,c)+1;options.push({w,word,r,c,dir,score:w*10+h*b+Math.abs(h-b)*3});}}}
 options.sort((a,b)=>a.score-b.score);for(const candidate of options){const old=grid;grid=new Map(grid);put(candidate.word,candidate.r,candidate.c,candidate.dir);if(solve(todo.filter((_,i)=>i!==candidate.w)))return true;grid=old;placed.pop();}return false;}
 if(!solve(remaining))throw Error('Crossword cannot connect: '+words.join(', '));

 const ys=[...grid.values()].map(v=>v.r),xs=[...grid.values()].map(v=>v.c),minR=Math.min(...ys),minC=Math.min(...xs);return {rows:Math.max(...ys)-minR+1,cols:Math.max(...xs)-minC+1,cells:[...grid.entries()].map(([key,v])=>({...v,key,row:v.r-minR,col:v.c-minC})),words:placed};
}
export function restorePuzzle(level,saved={}){const layout=buildCrossword(level.words);return {found:[...new Set((saved.found||[]).filter(w=>level.words.includes(w)))],bonus:[...new Set((saved.bonus||[]).filter(w=>level.bonus.includes(w)))],hints:[...new Set((saved.hints||[]).filter(k=>layout.cells.some(c=>c.key===k)))],hintsUsed:Math.max(0,Math.floor(Number(saved.hintsUsed)||0))};}
export function revealedCells(layout,state){return new Set([...state.hints,...layout.words.filter(w=>state.found.includes(w.word)).flatMap(w=>w.cells)]);}
export function guessWord(level,state,input){const word=normalizeWord(input);if(!canSpell(word,level.letters))return 'invalid';if(state.found.includes(word)||state.bonus.includes(word))return 'duplicate';if(level.words.includes(word)){state.found.push(word);return 'found';}if(level.bonus.includes(word)){state.bonus.push(word);return 'bonus';}return 'unknown';}
export function revealHint(layout,state){const revealed=revealedCells(layout,state),cell=layout.cells.find(c=>!revealed.has(c.key));if(!cell)return null;state.hints.push(cell.key);state.hintsUsed++;const now=revealedCells(layout,state);for(const word of layout.words)if(!state.found.includes(word.word)&&word.cells.every(k=>now.has(k)))state.found.push(word.word);return cell;}
export const puzzleScore=(level,state)=>Math.max(0,level.words.reduce((n,w)=>n+w.length*20,0)+100+state.bonus.length*10-state.hintsUsed*10);
