// Yahoo's access token alone is not an audience-verifiable sign-in credential.
// Require the provider ID token from native OAuth; never substitute a Firebase
// session ID token or persist/log the provider credentials.
export async function yahooSignIn({native,nativeAuth,auth,makeProvider,popup,credentialSignIn,clearJS,onStage=()=>{}}){
 const provider=makeProvider();
 if(!native){onStage('Web Yahoo girişi');return (await popup(auth,provider)).user;}
 try{
  onStage('Android Yahoo yetkilendirmesi');
  const result=await nativeAuth.signInWithYahoo({skipNativeAuth:false});
  const credential=result?.credential;
  if(credential?.providerId!=='yahoo.com'||typeof credential.idToken!=='string'||!credential.idToken||!result.user?.uid){
   const error=Error('Yahoo kimlik bilgisi alınamadı.');error.code='auth/missing-yahoo-credential';throw error;
  }
  const options={idToken:credential.idToken};
  if(credential.nonce)options.rawNonce=credential.nonce;
  onStage('Yahoo Firebase oturumu');
  const {user}=await credentialSignIn(auth,provider.credential(options));
  if(user.uid!==result.user.uid){await clearJS(auth);const error=Error('Yahoo oturumu doğrulanamadı.');error.code='auth/yahoo-session-mismatch';throw error;}
  return user;
 }finally{await nativeAuth.signOut().catch(()=>{});}
}
