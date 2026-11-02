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
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  limit,
  doc,
  getDocFromServer,
  serverTimestamp,
  runTransaction,
  writeBatch,
  orderBy,
  documentId,
  startAfter,
  getCountFromServer,
} from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseConfig from '../firebase-applet-config.json';

export const ADMIN_EMAIL = 'megastudiodm@gmail.com';

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

async function resolveCurrentRole(): Promise<string> {
  const user = auth?.currentUser;
  if (!user) throw new Error('سجل دخول الأول');
  if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return 'super_admin';
  }
  if (db) {
    const snap = await getDoc(doc(db, 'user_roles', user.uid));
    if (snap.exists() && snap.data()?.role) {
      return snap.data().role;
    }
  }
  throw new Error('حسابك مش مصرح له بالعملية دي');
}

const managedCollections = [
  'transport_lines',
  'route_variants',
  'stops',
  'fares',
  'alerts',
  'transport_modes',
  'regions',
  'data_sources',
  'app_settings',
  'city_places',
  'city_news',
  'city_events',
  'city_services',
  'city_businesses',
];
const reviewCollections = ['community_reports', 'contribution_submissions', 'contributor_applications'];

async function fallbackFirestoreCall(name: string, data: any): Promise<any> {
  if (!db) throw new Error('الخدمة لسه بتتجهز. مفيش بيانات اتبعتت.');
  const user = auth?.currentUser;

  if (name === 'adminSession') {
    const role = await resolveCurrentRole();
    // Ensure bootstrap admin role document exists in user_roles
    if (user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      try {
        await setDoc(
          doc(db, 'user_roles', user.uid),
          {
            role: 'super_admin',
            email: user.email,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch {
        // ignore if already set or offline
      }
    }
    return { role };
  }

  if (name === 'adminOverview') {
    const role = await resolveCurrentRole();
    const cols =
      role === 'moderator' ? reviewCollections : [...managedCollections, ...reviewCollections, 'admin_drafts'];
    const entries = await Promise.all(
      cols.map(async c => {
        try {
          const snap = await getCountFromServer(collection(db!, c));
          return [c, snap.data().count];
        } catch {
          return [c, 0];
        }
      })
    );
    return { counts: Object.fromEntries(entries) };
  }

  if (name === 'adminRecords') {
    const role = await resolveCurrentRole();
    const colName = data.collection as string;
    if (colName === 'user_roles' && role !== 'super_admin') {
      throw new Error('إدارة الصلاحيات للمسؤول الرئيسي بس');
    }
    let q = query(collection(db, colName), orderBy(documentId()), limit(51));
    if (data.cursor) {
      q = query(collection(db, colName), orderBy(documentId()), startAfter(data.cursor), limit(51));
    }
    const snap = await getDocs(q);
    const docs = snap.docs.slice(0, 50);
    return {
      records: docs.map(d => ({ ...d.data(), id: d.id })),
      cursor: snap.size > 50 ? docs.at(-1)!.id : null,
    };
  }

  if (name === 'adminSave') {
    const role = await resolveCurrentRole();
    const colName = data.collection as string;
    const recordId = colName === 'app_settings' ? 'main' : data.id || doc(collection(db, colName)).id;
    const draftRef = doc(db, 'admin_drafts', `${colName}__${recordId}`);
    const liveRef = doc(db, colName, recordId);
    const shouldAutoPublish = ['super_admin', 'admin'].includes(role);

    await runTransaction(db, async tx => {
      const [draftSnap, liveSnap] = await Promise.all([tx.get(draftRef), tx.get(liveRef)]);
      const draftData = draftSnap.data();
      const liveData = liveSnap.data();
      const nextRev = (liveData?.revision || draftData?.revision || 0) + 1;
      const { notes: _privateNotes, ...publicRecord } = data.record || {};

      if (shouldAutoPublish) {
        tx.set(doc(collection(db!, 'data_versions')), {
          collection: colName,
          recordId,
          before: liveData || null,
          after: data.record,
          createdAt: serverTimestamp(),
          actorUid: user!.uid,
        });

        tx.set(liveRef, {
          ...publicRecord,
          published: true,
          verification: 'verified',
          sourceId: 'admin-direct',
          verifiedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdAt: liveData?.createdAt || serverTimestamp(),
          revision: nextRev,
        });
      }

      tx.set(draftRef, {
        collection: colName,
        recordId,
        record: data.record,
        revision: nextRev,
        before: liveData || null,
        baseRevision: nextRev,
        status: shouldAutoPublish ? 'published' : 'draft',
        ...(shouldAutoPublish ? { publishedAt: serverTimestamp() } : {}),
        editorUid: user!.uid,
        updatedAt: serverTimestamp(),
        createdAt: draftData?.createdAt || serverTimestamp(),
      });

      tx.set(doc(collection(db!, 'audit_logs')), {
        action: shouldAutoPublish ? 'published' : 'draft_saved',
        actorUid: user!.uid,
        collection: colName,
        recordId,
        revision: nextRev,
        createdAt: serverTimestamp(),
      });
    });

    if (shouldAutoPublish && colName === 'transport_lines' && Array.isArray(data.record?.stops) && data.record.stops.length >= 2) {
      try {
        const oldEdges = await getDocs(query(collection(db, 'route_edges'), where('line', '==', recordId)));
        const batch = writeBatch(db);
        oldEdges.docs.forEach(e => batch.delete(e.ref));
        if (data.record.status === 'active' || data.record.status === 'unknown') {
          for (let i = 0; i < data.record.stops.length - 1; i++) {
            batch.set(doc(collection(db, 'route_edges')), {
              from: data.record.stops[i],
              to: data.record.stops[i + 1],
              line: recordId,
              status: 'active',
              verified: true,
              published: true,
              minutes: null,
              fare: i === 0 ? (data.record.fare ?? null) : 0,
              createdAt: serverTimestamp(),
            });
          }
        }
        await batch.commit();
      } catch {
        // non-blocking edge sync
      }
    }

    return { id: recordId, revision: (data.revision || 0) + 1, published: shouldAutoPublish };
  }

  if (name === 'adminPublish') {
    const role = await resolveCurrentRole();
    if (!['super_admin', 'admin'].includes(role)) throw new Error('النشر للمسؤولين بس');
    const draftRef = doc(db, 'admin_drafts', data.draftId);

    await runTransaction(db, async tx => {
      const snap = await tx.get(draftRef);
      if (!snap.exists()) throw new Error('المسودة مش موجودة');
      const d = snap.data()!;
      const colName = d.collection as string;
      const liveRef = doc(db!, colName, d.recordId);
      const beforeSnap = await tx.get(liveRef);
      const beforeData = beforeSnap.data();
      const nextRevision = (beforeData?.revision || 0) + 1;
      const { notes: _privateNotes, ...publicRecord } = d.record || {};

      tx.set(doc(collection(db!, 'data_versions')), {
        collection: colName,
        recordId: d.recordId,
        before: beforeData || null,
        after: d.record,
        createdAt: serverTimestamp(),
        actorUid: user!.uid,
      });

      tx.set(liveRef, {
        ...publicRecord,
        published: true,
        verification: 'verified',
        sourceId: data.sourceId || 'admin-direct',
        verifiedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAt: beforeData?.createdAt || serverTimestamp(),
        revision: nextRevision,
      });

      tx.update(draftRef, {
        status: 'published',
        publishedAt: serverTimestamp(),
        baseRevision: nextRevision,
      });

      tx.set(doc(collection(db!, 'audit_logs')), {
        action: 'published',
        actorUid: user!.uid,
        collection: colName,
        recordId: d.recordId,
        sourceId: data.sourceId || 'admin-direct',
        verificationNote: data.verificationNote || '',
        createdAt: serverTimestamp(),
      });
    });

    // If transport_lines has stops, also sync route_edges for trip planning
    try {
      const draftSnap = await getDoc(draftRef);
      const d = draftSnap.data();
      if (d?.collection === 'transport_lines' && Array.isArray(d.record?.stops) && d.record.stops.length >= 2) {
        const oldEdges = await getDocs(query(collection(db, 'route_edges'), where('line', '==', d.recordId)));
        const batch = writeBatch(db);
        oldEdges.docs.forEach(e => batch.delete(e.ref));
        if (d.record.status === 'active' || d.record.status === 'unknown') {
          for (let i = 0; i < d.record.stops.length - 1; i++) {
            batch.set(doc(collection(db, 'route_edges')), {
              from: d.record.stops[i],
              to: d.record.stops[i + 1],
              line: d.recordId,
              status: 'active',
              verified: true,
              published: true,
              minutes: null,
              fare: i === 0 ? (d.record.fare ?? null) : 0,
              createdAt: serverTimestamp(),
            });
          }
        }
        await batch.commit();
      }
    } catch {
      // non-blocking edge sync
    }

    return { ok: true };
  }

  if (name === 'adminArchive') {
    const role = await resolveCurrentRole();
    if (!['super_admin', 'admin'].includes(role)) throw new Error('الأرشفة للمسؤولين بس');
    const ref = doc(db, data.collection, data.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('السجل مش موجود');

    const batch = writeBatch(db);
    batch.set(doc(collection(db, 'data_versions')), {
      collection: data.collection,
      recordId: data.id,
      before: snap.data(),
      createdAt: serverTimestamp(),
      actorUid: user!.uid,
    });
    batch.update(ref, {
      published: false,
      archived: true,
      revision: (snap.data()?.revision || 0) + 1,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(collection(db, 'audit_logs')), {
      action: 'archived',
      actorUid: user!.uid,
      collection: data.collection,
      recordId: data.id,
      reason: data.reason,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return { ok: true };
  }

  if (name === 'adminReview') {
    await resolveCurrentRole();
    const ref = doc(db, data.collection, data.id);
    const batch = writeBatch(db);
    batch.update(ref, {
      status: data.decision,
      moderatorNote: data.note,
      reviewerUid: user!.uid,
      reviewedAt: serverTimestamp(),
    });
    batch.set(doc(collection(db, 'contribution_reviews')), {
      ...data,
      actorUid: user!.uid,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(collection(db, 'audit_logs')), {
      action: 'reviewed',
      ...data,
      actorUid: user!.uid,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return { ok: true };
  }

  if (name === 'adminRole') {
    const role = await resolveCurrentRole();
    if (role !== 'super_admin') throw new Error('إدارة الصلاحيات للمسؤول الرئيسي بس');
    const batch = writeBatch(db);
    batch.set(doc(db, 'user_roles', data.uid), {
      role: data.role,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      editorUid: user!.uid,
    });
    batch.set(doc(collection(db, 'audit_logs')), {
      action: 'role_changed',
      ...data,
      actorUid: user!.uid,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return { ok: true };
  }

  if (name === 'assignContributor') {
    const role = await resolveCurrentRole();
    if (!['super_admin', 'admin'].includes(role)) throw new Error('للمسؤولين بس');
    const batch = writeBatch(db);
    batch.set(doc(db, 'approved_contributors', data.uid), {
      regions: data.regions,
      suspended: data.suspended,
      updatedAt: serverTimestamp(),
      editorUid: user!.uid,
    });
    batch.set(doc(collection(db, 'audit_logs')), {
      action: 'contributor_permissions',
      ...data,
      actorUid: user!.uid,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return { ok: true };
  }

  if (name === 'submitApplication') {
    if (!user) throw new Error('سجّل دخول الأول');
    const ref = await addDoc(collection(db, 'contributor_applications'), {
      ...data,
      uid: user.uid,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, status: 'pending' };
  }

  if (name === 'submitReport') {
    if (!user) throw new Error('سجّل دخول الأول');
    const ref = await addDoc(collection(db, 'community_reports'), {
      ...data,
      uid: user.uid,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, status: 'pending' };
  }

  throw new Error('الخدمة لسه بتتجهز.');
}

export async function call(name: string, data: unknown) {
  if (f) {
    try {
      return (await httpsCallable(f, name)(data)).data;
    } catch {
      return await fallbackFirestoreCall(name, data);
    }
  }
  return await fallbackFirestoreCall(name, data);
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
  if (db) {
    try {
      const snap = await getDocs(
        query(
          collection(db, name),
          where('published', '==', true),
          where('verification', '==', 'verified'),
          limit(100)
        )
      );
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  }
  return [];
}
