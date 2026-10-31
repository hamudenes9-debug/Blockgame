import {initializeApp} from 'firebase/app';
import {getAuth, GoogleAuthProvider, signInWithPopup, signOut} from 'firebase/auth';
import {getFirestore, collection, addDoc, query, orderBy, limit, getDocs} from 'firebase/firestore';
const configured=!!import.meta.env.VITE_FIREBASE_API_KEY;
let auth,db;
if(configured){const app=initializeApp({apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID});auth=getAuth(app);db=getFirestore(app);}
export {configured};
export async function login(){if(!configured)throw Error('Google girişi için Firebase bağlantısı henüz yapılandırılmadı. Misafir olarak hemen oynayabilirsin.');return (await signInWithPopup(auth,new GoogleAuthProvider())).user;}
export async function logout(){if(auth)await signOut(auth);}
export async function submitScore(score,mode){if(auth?.currentUser)await addDoc(collection(db,'scores'),{uid:auth.currentUser.uid,name:auth.currentUser.displayName,score,mode,date:Date.now()});}
export async function getScores(){if(!db)return [];return (await getDocs(query(collection(db,'scores'),orderBy('score','desc'),limit(20)))).docs.map(d=>d.data());}
