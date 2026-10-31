// A quiet two-part pluck generated locally: no downloads, music, or audio SDK.
const NOTES=[523.25,587.33,659.25,783.99,880,1046.5];
export function letterFrequency(depth){return NOTES[Math.max(0,Math.min(NOTES.length-1,Math.floor(Number(depth)||1)-1))];}
export function createLetterSound(isEnabled,environment=globalThis){
 let context;
 const active=new Set();
 return function playLetter(depth){
  if(!isEnabled())return;
  try{
   const Audio=environment.AudioContext||environment.webkitAudioContext;
   if(!Audio)return;
   context??=new Audio();
   if(context.state==='suspended'){
    // Unlock within the pointer/keyboard gesture. A blocked context must never
    // interrupt letter selection or cause an unhandled rejected promise.
    Promise.resolve(context.resume()).catch(()=>{});
   }
   if(active.size>=12)return;
   const now=context.currentTime,frequency=letterFrequency(depth);
   for(const [ratio,volume,duration] of [[1,.035,.17],[2,.007,.10]]){
    const oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.type='sine';
    oscillator.frequency.setValueAtTime(frequency*ratio,now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency*ratio*.985,now+duration);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(volume,now+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    oscillator.connect(gain);gain.connect(context.destination);active.add(oscillator);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();active.delete(oscillator);};
    oscillator.start(now);oscillator.stop(now+duration+.015);
   }
  }catch{/* Audio unavailable? The puzzle remains fully playable. */}
 };
}
