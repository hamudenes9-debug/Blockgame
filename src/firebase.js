import {initializeApp} from 'firebase/app';
import {getAuth, GoogleAuthProvider, signInWithPopup, signInWithCredential, signOut} from 'firebase/auth';
import {getFirestore, collection, addDoc, query, orderBy, limit, getDocs} from 'firebase/firestore';
import {Capacitor} from '@capacitor/core';
import {FirebaseAuthentication} from '@capacitor-firebase/authentication';
import nativeConfig from './firebase-android.json';
const native=Capacitor.isNativePlatform();
const config=native?nativeConfig:{apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
const configured=!!config.apiKey;
let auth,db;
if(configured){const app=initializeApp(config);auth=getAuth(app);db=getFirestore(app);}
export {configured};
export async function login(){
  if(!configured)throw Error('Web Google girişi henüz yapılandırılmadı. Android uygulamasında Google ile giriş yapabilirsin.');
  try{
    if(native){
      const result=await FirebaseAuthentication.signInWithGoogle();
      if(!result.credential?.idToken)throw Error('Google kimlik bilgisi alınamadı. Lütfen tekrar dene.');
      const credential=GoogleAuthProvider.credential(result.credential.idToken);
      return (await signInWithCredential(auth,credential)).user;
    }
    return (await signInWithPopup(auth,new GoogleAuthProvider())).user;
  }catch(error){
    const detail=String(error.message||error);
    if(/10:|DEVELOPER_ERROR|12500|configuration/i.test(detail))throw Error('Google giriş yapılandırması eksik. Bu APK’nın SHA-1 ve SHA-256 değerlerini Firebase Android uygulamasına ekleyip tekrar dene.');
    if(/cancel|12501|closed-by-user/i.test(detail))throw Error('Giriş iptal edildi. İstersen tekrar deneyebilirsin.');
    throw error;
  }
}
export async function logout(){if(auth)await signOut(auth);if(native)await FirebaseAuthentication.signOut();}
export async function submitScore(score,mode){if(auth){await auth.authStateReady();if(auth.currentUser)await addDoc(collection(db,'scores'),{uid:auth.currentUser.uid,name:auth.currentUser.displayName||'Oyuncu',score,mode,date:Date.now()});}}
export async function getScores(){if(!db)return [];return (await getDocs(query(collection(db,'scores'),orderBy('score','desc'),limit(20)))).docs.map(d=>d.data());}
