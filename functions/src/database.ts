import {getFirestore} from 'firebase-admin/firestore';
// Both clients and Functions must address the same existing named database.
export const getDatabase=()=>getFirestore(process.env.FIRESTORE_DATABASE_ID||'ai-studio-eskndrella-ce3d849f-30ae-4bcf-a341-119fb9d46309');
