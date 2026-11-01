import {yahooSignIn} from './yahoo-sign-in.js';
import {githubSignIn} from './github-sign-in.js';
import {collectScoreTotals} from './leaderboard.js';
import {withTimeout} from './cloud-status.js';
import {initializeApp} from 'firebase/app';
import {getAuth, signInAnonymously, getIdTokenResult, GoogleAuthProvider, GithubAuthProvider, OAuthProvider, signInWithPopup, signInWithCredential, signOut} from 'firebase/auth';
import {getFirestore, collection, addDoc, query, orderBy, limit, startAfter, documentId, getDocsFromServer} from 'firebase/firestore';
import {Capacitor} from '@capacitor/core';
import {FirebaseAuthentication} from '@capacitor-firebase/authentication';
import {describeAuthError} from './auth-errors.js';
import {nativeGoogleSignIn} from './google-sign-in.js';
import nativeConfig from './firebase-android.json';
const native=Capacitor.isNativePlatform();
const config=native?nativeConfig:{apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
const configured=!!config.apiKey;
let auth,db;
if(configured){const app=initializeApp(config);auth=getAuth(app);db=getFirestore(app);}
export {configured};
export async function login(provider='google'){
  if(!['google','github','yahoo'].includes(provider))throw Error('Desteklenmeyen giriş yöntemi.');
  if(!configured)throw Error('Web hesap girişi henüz yapılandırılmadı. Android uygulamasında Google, GitHub veya Yahoo ile giriş yapabilirsin.');
  let stage=native?'Android Google hesap seçimi':'Web Google girişi';
  try{
    if(provider==='yahoo')return await yahooSignIn({native,nativeAuth:FirebaseAuthentication,auth,makeProvider:()=>new OAuthProvider('yahoo.com'),popup:signInWithPopup,credentialSignIn:signInWithCredential,clearJS:signOut,onStage:value=>stage=value});
    if(provider==='github')return await githubSignIn({native,nativeAuth:FirebaseAuthentication,auth,makeProvider:()=>new GithubAuthProvider(),makeCredential:token=>GithubAuthProvider.credential(token),popup:signInWithPopup,credentialSignIn:signInWithCredential,clearJS:signOut,onStage:value=>stage=value});
    if(native){
      const result=await nativeGoogleSignIn(FirebaseAuthentication);
      if(!result.credential?.idToken)throw Error('Google kimlik bilgisi alınamadı. Lütfen tekrar dene.');
      stage='Firebase oturumu';
      const credential=GoogleAuthProvider.credential(result.credential.idToken);
      return (await signInWithCredential(auth,credential)).user;
    }
    return (await signInWithPopup(auth,new GoogleAuthProvider())).user;
  }catch(error){
    throw Error(describeAuthError(error,stage));
  }
}
export async function logout(){if(auth)await signOut(auth);if(native)await FirebaseAuthentication.signOut();}
function cloudError(code){const error=new Error(code);error.code=code;return error;}
export async function submitScore(score,mode){
  if(!db||!auth)throw cloudError('not-configured');
  return withTimeout((async()=>{
    await auth.authStateReady();
    const user=auth.currentUser;
    if(!user)throw cloudError('unauthenticated');
    const result=await addDoc(collection(db,'wordScores'),{uid:user.uid,name:(user.displayName||'Oyuncu').slice(0,100),score,mode,date:Date.now()});
    return {id:result.id};
  })());
}
export async function getScores(){
  if(!db)throw cloudError('not-configured');
  let active=true;
  try{
    const totals=await withTimeout(collectScoreTotals(async cursor=>{
      const constraints=[orderBy(documentId()),limit(500)];
      if(cursor)constraints.push(startAfter(cursor));
      const snapshot=await getDocsFromServer(query(collection(db,'wordScores'),...constraints));
      return {records:snapshot.docs.map(d=>({id:d.id,data:d.data()})),nextCursor:snapshot.size===500?snapshot.docs.at(-1).id:null};
    },()=>active));
    // Limit players only AFTER every stored game has contributed to totals.
    return totals.slice(0,20);
  }finally{active=false;}
}


export async function getSessionUser(){if(!auth)return null;await withTimeout(auth.authStateReady(),5000);return auth.currentUser;}

// Shared authenticated access for community and private notification settings.
export async function requireCloudUser(){
 if(!auth||!db)throw cloudError('not-configured');
 await withTimeout(auth.authStateReady());
 if(!auth.currentUser)throw cloudError('unauthenticated');
 return {db,user:auth.currentUser};
}

let anonymousAttempt=null;
export async function freshIdentity(){
 if(!auth)throw Error('Firebase web yapılandırması gerekiyor.');
 await auth.authStateReady();
 if(!auth.currentUser){if(!anonymousAttempt)anonymousAttempt=signInAnonymously(auth).finally(()=>anonymousAttempt=null);await anonymousAttempt;}
 const user=auth.currentUser;let result;try{result=await withTimeout(getIdTokenResult(user,true),7000);}catch(error){if(auth.currentUser&&auth.currentUser.uid!==user.uid)throw Error('Hesap değişti.');throw error;}
 if(auth.currentUser?.uid!==user.uid)throw Error('Hesap değişti.');
 return {uid:user.uid,anonymous:user.isAnonymous,issuedAt:Date.parse(result.issuedAtTime)};
}
