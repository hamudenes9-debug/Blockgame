const supported=['google.com','github.com','yahoo.com'];
export function sessionProfile(user,hint){const providers=(user?.providerData||[]).map(p=>p.providerId).filter(p=>supported.includes(p));const provider=supported.includes(hint)&&(!providers.length||providers.includes(hint))?hint:providers[0]||'google.com';return {uid:user.uid,name:user.displayName||'Oyuncu',guest:false,provider};}
export const accountLabel=profile=>!profile||profile.guest?'Misafir hesap':profile.provider==='yahoo.com'?'Yahoo hesabı':profile.provider==='github.com'?'GitHub hesabı':'Google hesabı';
