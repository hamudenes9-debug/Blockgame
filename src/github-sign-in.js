// The OAuth secret stays in Firebase Console. Only the short-lived sign-in
// result crosses the native bridge; never persist or log its access token.
export async function githubSignIn({native,nativeAuth,auth,makeProvider,makeCredential,popup,credentialSignIn,clearJS,onStage=()=>{}}){
 if(!native){onStage('Web GitHub girişi');const provider=makeProvider();provider.addScope('user:email');return (await popup(auth,provider)).user;}
 try{
  onStage('Android GitHub yetkilendirmesi');
  // Android's generic Firebase OAuth flow signs into native Auth first, even
  // when the app's Google provider uses skipNativeAuth. Explicitly opt in here.
  const result=await nativeAuth.signInWithGithub({skipNativeAuth:false,scopes:['user:email']});
  const token=result?.credential?.accessToken;
  if(typeof token!=='string'||!token||result.credential.providerId!=='github.com'){
   const error=Error('GitHub kimlik bilgisi alınamadı.');error.code='auth/missing-github-credential';throw error;
  }
  onStage('GitHub Firebase oturumu');
  const {user}=await credentialSignIn(auth,makeCredential(token));
  if(result.user?.uid&&user.uid!==result.user.uid){
   await clearJS(auth);const error=Error('GitHub oturumu doğrulanamadı.');error.code='auth/github-session-mismatch';throw error;
  }
  return user;
 }finally{
  // Firestore and all app features use the JavaScript Firebase session only.
  // Native cleanup must not turn a successful JS sign-in into a UI failure.
  await nativeAuth.signOut().catch(()=>{});
 }
}
