import {withTimeout} from './cloud-status.js';
import {initializeApp} from 'firebase/app';
import {getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut} from 'firebase/auth';
import {getFirestore, collection, addDoc, query, orderBy, limit, getDocsFromServer} from 'firebase/firestore';
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
export async function login(){
  if(!configured)throw Error('Web Google girişi henüz yapılandırılmadı. Android uygulamasında Google ile giriş yapabilirsin.');
  let stage=native?'Android Google hesap seçimi':'Web Google girişi';
  try{
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
  // A world ranking must come from the server, never a local cached result.
  const snapshot=await withTimeout(getDocsFromServer(query(collection(db,'wordScores'),orderBy('score','desc'),limit(20))));
  return snapshot.docs.map(d=>d.data());
}

export async function getSessionUser(){if(!auth)return null;await withTimeout(auth.authStateReady(),5000);return auth.currentUser;}
