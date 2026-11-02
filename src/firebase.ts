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
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { seedWorkspace } from './adminModel';

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
  if (!user) {
    return 'super_admin';
  }
  if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return 'super_admin';
  }
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'user_roles', user.uid));
      if (snap.exists() && snap.data()?.role) {
        return snap.data().role;
      }
    } catch {
      // fallback to super_admin in admin workspace
    }
  }
  return 'super_admin';
}

export const managedCollections = [
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
  'city_outings',
  'city_news',
  'city_events',
  'city_services',
  'city_businesses',
  'sports_clubs',
  'sports_fixtures',
  'sports_activities',
];
const reviewCollections = ['community_reports', 'contribution_submissions', 'contributor_applications'];

async function fallbackFirestoreCall(name: string, data: any): Promise<any> {
  if (!db) throw new Error('الخدمة لسه بتتجهز. مفيش بيانات اتبعتت.');
  const user = auth?.currentUser;
  const actorUid = user?.uid || 'admin-megastudiodm';
  const actorEmail = user?.email || ADMIN_EMAIL;

  if (name === 'adminSession') {
    const role = await resolveCurrentRole();
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
        // ignore if offline
      }
    }
    return { role, email: actorEmail };
  }

  if (name === 'adminOverview') {
    const role = await resolveCurrentRole();
    const seeded = seedWorkspace();
    const cols =
      role === 'moderator' ? reviewCollections : [...managedCollections, ...reviewCollections, 'admin_drafts'];
    const entries = await Promise.all(
      cols.map(async c => {
        try {
          const snap = await getDocs(query(collection(db!, c), limit(300)));
          const remoteDocs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          const remoteIds = new Set(remoteDocs.map(d => d.id));
          const defaults = (seeded[c] || []).filter(item => !remoteIds.has(item.id));
          const activeCount = remoteDocs.filter(d => !d.archived).length + defaults.length;
          return [c, activeCount];
        } catch {
          return [c, (seeded[c] || []).length];
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
    let q = query(collection(db, colName), orderBy(documentId()), limit(250));
    if (data.cursor) {
      q = query(collection(db, colName), orderBy(documentId()), startAfter(data.cursor), limit(250));
    }
    const snap = await getDocs(q);
    const remoteRecords = snap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
    if (managedCollections.includes(colName) && !data.cursor) {
      const seeded = seedWorkspace()[colName] || [];
      const remoteIds = new Set(remoteRecords.map(r => r.id));
      const merged = [
        ...remoteRecords.filter(r => !r.archived),
        ...seeded.filter(s => !remoteIds.has(s.id)).map(s => ({ ...s, published: true, _seeded: true })),
      ];
      return {
        records: merged,
        cursor: null,
      };
    }
    const docs = remoteRecords.slice(0, 100);
    return {
      records: docs,
      cursor: snap.size > 100 ? docs.at(-1)!.id : null,
    };
  }

  if (name === 'adminSave') {
    const role = await resolveCurrentRole();
    const colName = data.collection as string;
    const recordId = colName === 'app_settings' ? 'main' : data.id || doc(collection(db, colName)).id;
    const draftRef = doc(db, 'admin_drafts', `${colName}__${recordId}`);
    const liveRef = doc(db, colName, recordId);
    const shouldAutoPublish = ['super_admin', 'admin', 'data_editor'].includes(role);

    await runTransaction(db, async tx => {
      const [draftSnap, liveSnap] = await Promise.all([tx.get(draftRef), tx.get(liveRef)]);
      const draftData = draftSnap.data();
      const liveData = liveSnap.data();
      const nextRev = (liveData?.revision || draftData?.revision || 0) + 1;
      const { notes: _privateNotes, _localDraft, _seeded, ...publicRecord } = data.record || {};

      if (shouldAutoPublish) {
        tx.set(doc(collection(db!, 'data_versions')), {
          collection: colName,
          recordId,
          before: liveData || null,
          after: publicRecord,
          createdAt: serverTimestamp(),
          actorUid,
          actorEmail,
        });

        tx.set(liveRef, {
          ...publicRecord,
          id: recordId,
          published: true,
          archived: false,
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
        record: publicRecord,
        revision: nextRev,
        before: liveData || null,
        baseRevision: nextRev,
        status: shouldAutoPublish ? 'published' : 'draft',
        ...(shouldAutoPublish ? { publishedAt: serverTimestamp() } : {}),
        editorUid: actorUid,
        editorEmail: actorEmail,
        updatedAt: serverTimestamp(),
        createdAt: draftData?.createdAt || serverTimestamp(),
      });

      tx.set(doc(collection(db!, 'audit_logs')), {
        action: shouldAutoPublish ? 'published' : 'draft_saved',
        actorUid,
        actorEmail,
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
        if (data.record.status === 'active' || data.record.status === 'unknown' || !data.record.status) {
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
      const { notes: _privateNotes, _localDraft, _seeded, ...publicRecord } = d.record || {};

      tx.set(doc(collection(db!, 'data_versions')), {
        collection: colName,
        recordId: d.recordId,
        before: beforeData || null,
        after: publicRecord,
        createdAt: serverTimestamp(),
        actorUid,
      });

      tx.set(liveRef, {
        ...publicRecord,
        id: d.recordId,
        published: true,
        archived: false,
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
        actorUid,
        collection: colName,
        recordId: d.recordId,
        sourceId: data.sourceId || 'admin-direct',
        verificationNote: data.verificationNote || '',
        createdAt: serverTimestamp(),
      });
    });

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

  if (name === 'adminArchive' || name === 'adminDelete') {
    const ref = doc(db, data.collection, data.id);
    const snap = await getDoc(ref);
    const seededItem = (seedWorkspace()[data.collection] || []).find((x: any) => x.id === data.id);
    const existingData = snap.exists() ? snap.data() : seededItem || { id: data.id };

    const batch = writeBatch(db);
    batch.set(doc(collection(db, 'data_versions')), {
      collection: data.collection,
      recordId: data.id,
      before: existingData,
      createdAt: serverTimestamp(),
      actorUid,
    });
    batch.set(
      ref,
      {
        ...existingData,
        id: data.id,
        published: true,
        verification: 'verified',
        archived: true,
        revision: (existingData?.revision || 0) + 1,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    batch.set(doc(collection(db, 'audit_logs')), {
      action: 'archived',
      actorUid,
      collection: data.collection,
      recordId: data.id,
      reason: data.reason || 'حذف مباشر من لوحة التحكم',
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return { ok: true };
  }

  if (name === 'adminReview') {
    const ref = doc(db, data.collection, data.id);
    const batch = writeBatch(db);
    batch.update(ref, {
      status: data.decision,
      moderatorNote: data.note,
      reviewerUid: actorUid,
      reviewedAt: serverTimestamp(),
    });
    batch.set(doc(collection(db, 'contribution_reviews')), {
      ...data,
      actorUid,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(collection(db, 'audit_logs')), {
      action: 'reviewed',
      ...data,
      actorUid,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return { ok: true };
  }

  if (name === 'adminRole') {
    const batch = writeBatch(db);
    batch.set(doc(db, 'user_roles', data.uid), {
      role: data.role,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      editorUid: actorUid,
    });
    batch.set(doc(collection(db, 'audit_logs')), {
      action: 'role_changed',
      ...data,
      actorUid,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return { ok: true };
  }

  if (name === 'assignContributor') {
    const batch = writeBatch(db);
    batch.set(doc(db, 'approved_contributors', data.uid), {
      regions: data.regions,
      suspended: data.suspended,
      updatedAt: serverTimestamp(),
      editorUid: actorUid,
    });
    batch.set(doc(collection(db, 'audit_logs')), {
      action: 'contributor_permissions',
      ...data,
      actorUid,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return { ok: true };
  }

  if (name === 'submitApplication') {
    const ref = await addDoc(collection(db, 'contributor_applications'), {
      ...data,
      uid: user?.uid || 'guest-applicant',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, status: 'pending' };
  }

  if (name === 'submitReport') {
    const ref = await addDoc(collection(db, 'community_reports'), {
      ...data,
      uid: user?.uid || 'guest-reporter',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id, status: 'pending' };
  }

  throw new Error('الخدمة لسه بتتجهز.');
}

export async function call(name: string, data: unknown) {
  return await fallbackFirestoreCall(name, data);
}

/**
 * Automatically migrates any previously saved local drafts from localStorage ('alex-admin-workspace-v1')
 * to Firestore so all earlier user edits are published online immediately.
 */
export async function syncLocalDraftsToCloud(): Promise<number> {
  if (!db || typeof window === 'undefined') return 0;
  const KEY = 'alex-admin-workspace-v1';
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const recordsByCol = parsed?.records;
    if (!recordsByCol || typeof recordsByCol !== 'object') return 0;

    let syncedCount = 0;
    for (const colName of managedCollections) {
      const list = recordsByCol[colName];
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        if (item && item._localDraft) {
          const { _localDraft, _seeded, id, ...recordData } = item;
          await fallbackFirestoreCall('adminSave', {
            collection: colName,
            id: id && !String(id).startsWith('local-') ? id : undefined,
            record: recordData,
          });
          syncedCount++;
        }
      }
    }
    localStorage.removeItem(KEY);
    return syncedCount;
  } catch (e) {
    console.warn('Could not migrate local drafts:', e);
    return 0;
  }
}

export async function loadLines(): Promise<any[]> {
  if (!db) return [];
  const path = 'transport_lines';
  try {
    const snap = await getDocs(query(collection(db, path), limit(250)));
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeLines(onUpdate: (lines: any[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, 'transport_lines'), limit(250));
  return onSnapshot(
    q,
    snap => {
      onUpdate(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    },
    err => {
      console.warn('subscribeLines error:', err);
    }
  );
}

export async function loadEdges(): Promise<any[]> {
  if (!db) return [];
  const path = 'route_edges';
  try {
    const snap = await getDocs(query(collection(db, path), limit(2000)));
    return snap.docs.map(d => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function loadPublic(name: string): Promise<any[]> {
  if (db) {
    try {
      const snap = await getDocs(query(collection(db, name), limit(250)));
      return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    } catch {
      return [];
    }
  }
  return [];
}

export function subscribePublic(name: string, onUpdate: (items: any[]) => void): () => void {
  if (!db) return () => {};
  const q = query(collection(db, name), limit(250));
  return onSnapshot(
    q,
    snap => {
      onUpdate(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    },
    err => {
      console.warn(`subscribePublic(${name}) error:`, err);
    }
  );
}
