import {initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,signInWithEmailAndPassword,createUserWithEmailAndPassword} from 'firebase/auth';
import {getFirestore,collection,getDocs,query,where,limit,onSnapshot,type QueryConstraint} from 'firebase/firestore';
import bundledConfig from '../firebase-applet-config.json';
export const ADMIN_EMAIL='megastudiodm@gmail.com';
const config=import.meta.env.VITE_FIREBASE_CONFIG?JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG):bundledConfig;
export const firebaseReady=import.meta.env.VITE_FIREBASE_DISABLED!=='true'&&!!config.projectId;
export const app=firebaseReady?initializeApp(config):null;
export const auth=app?getAuth(app):null;
export const db=app?getFirestore(app,config.firestoreDatabaseId||'(default)'):null;
export async function login(){if(!auth)throw Error('تسجيل الدخول غير مفعّل في هذه النسخة.');return signInWithPopup(auth,new GoogleAuthProvider());}
export async function emailLogin(email:string,password:string,register=false){if(!auth)throw Error('تسجيل الدخول غير مفعّل في هذه النسخة.');return register?createUserWithEmailAndPassword(auth,email,password):signInWithEmailAndPassword(auth,email,password);}
export async function logout(){if(auth)await signOut(auth);}
let callableClient:Promise<import('firebase/functions').Functions>|undefined;
async function functionClient(){
  if(!app)throw Error('خدمة النشر غير مفعّلة في هذه النسخة.');
  if(!callableClient)callableClient=(async()=>{
    const key=import.meta.env.VITE_RECAPTCHA_SITE_KEY||config.recaptchaSiteKey;
    if(key&&typeof window!=='undefined'){const {initializeAppCheck,ReCaptchaV3Provider}=await import('firebase/app-check');initializeAppCheck(app!,{provider:new ReCaptchaV3Provider(key),isTokenAutoRefreshEnabled:true});}
    const {getFunctions}=await import('firebase/functions');return getFunctions(app!,import.meta.env.VITE_FUNCTIONS_REGION||'europe-west1');
  })().catch(error=>{callableClient=undefined;throw error;});
  return callableClient;
}
export async function call(name:string,data:unknown):Promise<any>{
  if(!auth?.currentUser)throw Error('سجّل دخولك بحساب مصرح له أولًا. القراءة العامة لا تحتاج حسابًا.');
  try{const functions=await functionClient();const {httpsCallable}=await import('firebase/functions');const canonical=name==='adminWrite'?'adminSave':name==='adminDelete'?'adminArchive':name;const result=await httpsCallable(functions,canonical)(data);return result.data;}
  catch(error){const code=(error as {code?:string}).code;if(code==='functions/not-found'||code==='functions/unavailable'||code==='functions/internal')throw Error('خدمة الإدارة لم تستجب. يلزم نشر Firebase Functions وإعداد App Check. لم يتم تأكيد حفظ أي تعديل.');throw error;}
}
function constraints(name:string):QueryConstraint[]{return name==='route_edges'?[where('published','==',true),where('verified','==',true),limit(2000)]:[where('published','==',true),where('verification','==','verified'),limit(250)];}
export async function loadPublic(name:string):Promise<any[]>{if(!db)return [];const snap=await getDocs(query(collection(db,name),...constraints(name)));return snap.docs.map(doc=>({...doc.data(),id:doc.id})).filter(item=>!(item as any).archived);}
export function subscribePublic(name:string,onUpdate:(items:any[])=>void,onError?:(error:unknown)=>void):()=>void{
  if(!db)return()=>{};
  return onSnapshot(query(collection(db,name),...constraints(name)),snap=>onUpdate(snap.docs.map(doc=>({...doc.data(),id:doc.id})).filter(item=>!(item as any).archived)),error=>{onError?.(error);});
}
export const loadLines=()=>loadPublic('transport_lines');
export const loadEdges=()=>loadPublic('route_edges');
export const subscribeLines=(onUpdate:(items:any[])=>void)=>subscribePublic('transport_lines',onUpdate);
