import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';
import {Timestamp,FieldValue,type Transaction} from 'firebase-admin/firestore';
import {z} from 'zod';
import {getDatabase} from './database.js';
import {checkRole} from './admin.js';
import {editorialSchema,validateArticlePublication} from './adminSchema.js';
const options={region:'europe-west1',enforceAppCheck:true,maxInstances:10};
const id=z.string().regex(/^[\w-]{1,128}$/);
const stamp=()=>FieldValue.serverTimestamp();
function parse<T>(schema:z.ZodType<T>,data:unknown):T{const result=schema.safeParse(data);if(!result.success)throw new HttpsError('invalid-argument','راجع حقول المسودة وروابط الصور والمصادر.');return result.data;}
export const editorialSave=onCall(options,async request=>{
 await checkRole(request,['super_admin','admin','data_editor']);
 const data=parse(z.object({id,revision:z.number().int().min(0),record:editorialSchema}).strict(),request.data);
 const db=getDatabase(),draftId='city_news__'+data.id,ref=db.collection('admin_drafts').doc(draftId);
 const revision=await db.runTransaction(async tx=>{
  const [draft,live]=await Promise.all([tx.get(ref),tx.get(db.collection('city_news').doc(data.id))]);
  if((draft.data()?.revision||0)!==data.revision)throw new HttpsError('aborted','المسودة تغيرت. افتح أحدث نسخة قبل الحفظ.');
  const next=data.revision+1;
  tx.set(ref,{collection:'city_news',recordId:data.id,record:data.record,status:'draft',revision:next,baseRevision:['draft','scheduled'].includes(draft.data()?.status)?draft.data()!.baseRevision:(live.data()?.revision||0),editorUid:request.auth!.uid,createdAt:draft.data()?.createdAt||stamp(),updatedAt:stamp()});
  tx.create(db.collection('audit_logs').doc(),{action:'editorial_draft_saved',recordId:data.id,actorUid:request.auth!.uid,revision:next,createdAt:stamp()});return next;
 });return {draftId,revision,id:data.id};
});
async function publishDraft(tx:Transaction,draftId:string,actorUid:string,expectedRevision?:number){
 const db=getDatabase(),ref=db.collection('admin_drafts').doc(draftId),snap=await tx.get(ref);
 if(!snap.exists)throw new HttpsError('not-found','المسودة غير موجودة.');
 const draft=snap.data()!;
 if(!['draft','scheduled'].includes(draft.status)||(expectedRevision!==undefined&&draft.revision!==expectedRevision))throw new HttpsError('aborted','المسودة تغيرت أو نُشرت بالفعل.');
 let record;try{record=validateArticlePublication(draft.record);}catch(error){throw new HttpsError('failed-precondition',error instanceof Error?error.message:'أكمل المادة قبل النشر.');}
 const liveRef=db.collection('city_news').doc(draft.recordId),before=await tx.get(liveRef);
 if((before.data()?.revision||0)!==draft.baseRevision)throw new HttpsError('aborted','المقال المنشور تغير. راجع النسخة الحالية قبل النشر.');
 const {notes,...publicRecord}=record;const now=new Date().toISOString();
 tx.create(db.collection('data_versions').doc(),{collection:'city_news',recordId:draft.recordId,before:before.data()||null,after:record,actorUid,createdAt:stamp()});
 tx.set(liveRef,{...publicRecord,published:true,verification:'verified',workflowStatus:'published',archived:false,updatedDate:now,reviewedAt:now.slice(0,10),createdAt:before.data()?.createdAt||stamp(),updatedAt:stamp(),revision:(before.data()?.revision||0)+1});
 tx.update(ref,{status:'published',publishedAt:stamp(),baseRevision:(before.data()?.revision||0)+1});
 tx.create(db.collection('audit_logs').doc(),{action:'editorial_published',recordId:draft.recordId,actorUid,createdAt:stamp()});
}
export const editorialPublish=onCall(options,async request=>{
 await checkRole(request,['super_admin','admin']);
 const data=parse(z.object({draftId:id,revision:z.number().int().min(1),publishAt:z.string().datetime().optional()}).strict(),request.data);
 const db=getDatabase();
 if(data.publishAt){
  const time=Date.parse(data.publishAt);if(time<Date.now()+60000||time>Date.now()+366*86400000)throw new HttpsError('invalid-argument','اختَر موعدًا بعد دقيقة على الأقل وخلال سنة.');
  await db.runTransaction(async tx=>{const ref=db.collection('admin_drafts').doc(data.draftId),draft=await tx.get(ref);if(!draft.exists||draft.data()?.status!=='draft'||draft.data()?.revision!==data.revision)throw new HttpsError('aborted','احفظ أحدث نسخة من المسودة أولًا.');try{validateArticlePublication(draft.data()!.record);}catch(e){throw new HttpsError('failed-precondition',e instanceof Error?e.message:'راجع المادة.');}tx.update(ref,{status:'scheduled',publishAt:Timestamp.fromMillis(time),scheduledBy:request.auth!.uid,updatedAt:stamp()});tx.create(db.collection('audit_logs').doc(),{action:'editorial_scheduled',draftId:data.draftId,publishAt:Timestamp.fromMillis(time),actorUid:request.auth!.uid,createdAt:stamp()});});return {status:'scheduled'};
 }
 await db.runTransaction(tx=>publishDraft(tx,data.draftId,request.auth!.uid,data.revision));return {status:'published'};
});
export const scheduledArticles=onSchedule({schedule:'every 5 minutes',region:'europe-west1',timeZone:'Africa/Cairo',maxInstances:1},async()=>{
 const db=getDatabase(),due=await db.collection('admin_drafts').where('status','==','scheduled').where('publishAt','<=',Timestamp.now()).limit(50).get();
 for(const doc of due.docs){try{await db.runTransaction(tx=>publishDraft(tx,doc.id,doc.data().scheduledBy||'scheduler'));}catch(error){if(error instanceof HttpsError&&['aborted','failed-precondition'].includes(error.code)){await db.runTransaction(async tx=>{const current=await tx.get(doc.ref);if(current.data()?.status==='scheduled'&&current.data()?.revision===doc.data().revision)tx.update(doc.ref,{status:'conflict',publicationError:error.message,updatedAt:stamp()});});}else throw error;}}
});
