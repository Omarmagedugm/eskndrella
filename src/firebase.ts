import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseConfig from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export const firebaseReady = !!firebaseConfig?.projectId;
export const app = firebaseReady ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null;
const f = app ? getFunctions(app, 'europe-west1') : null;

const recaptchaKey = firebaseConfig.recaptchaSiteKey || import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (app && recaptchaKey && typeof window !== 'undefined') {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn('App Check initialization warning:', e);
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot per Firebase guidelines
if (db) {
  getDocFromServer(doc(db, 'test', 'connection')).catch(error => {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  });
}

export async function login() {
  if (!auth) throw Error('تسجيل الدخول لسه مش متاح. جاري تجهيز الخدمة.');
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export async function emailLogin(email: string, password: string, register = false) {
  if (!auth) throw Error('تسجيل الدخول لسه مش متاح.');
  return register
    ? createUserWithEmailAndPassword(auth, email, password)
    : signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  if (auth) await signOut(auth);
}

export async function call(name: string, data: unknown) {
  if (!f) throw Error('الخدمة لسه بتتجهز. مفيش بيانات اتبعتت.');
  return (await httpsCallable(f, name)(data)).data;
}

export async function loadLines() {
  if (!db) return [];
  const path = 'transport_lines';
  try {
    const snap = await getDocs(
      query(
        collection(db, path),
        where('published', '==', true),
        where('verification', '==', 'verified'),
        limit(100)
      )
    );
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function loadEdges() {
  if (!db) return [];
  const path = 'route_edges';
  try {
    const snap = await getDocs(
      query(
        collection(db, path),
        where('published', '==', true),
        where('verified', '==', true),
        limit(2000)
      )
    );
    return snap.docs.map(d => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function loadPublic(name: string): Promise<any[]> {
  if (f) {
    try {
      const res = (await call('publicContent', { collection: name })) as { records: any[] };
      if (res?.records) return res.records;
    } catch {
      // fallback to Firestore direct query if callable function not deployed
    }
  }
  if (db) {
    try {
      const snap = await getDocs(
        query(collection(db, name), where('published', '==', true), limit(100))
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  }
  return [];
}
