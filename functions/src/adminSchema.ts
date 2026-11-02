import {z} from 'zod';
const name=z.string().trim().min(2).max(180), note=z.string().trim().max(3000).default(''), id=z.string().regex(/^[\w-]{1,128}$/), ids=z.array(id).max(100), texts=z.array(name).max(100);
export const managedCollections=['transport_lines','route_variants','stops','fares','alerts','transport_modes','regions','data_sources','app_settings','city_places','city_news','city_events','city_services','city_businesses'] as const;
export const statusSchema=z.enum(['active','suspended','development','construction','planned','closed','unknown']);
const point=z.tuple([z.number().min(-180).max(180),z.number().min(-90).max(90)]);
export const coverSchema=z.union([z.string().url().max(1000).refine(v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password}catch{return false}}),z.string().max(180000).regex(/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/),z.literal('')]);
const cityBase={name,summary:note,region:name,address:note,sourceUrl:z.union([z.string().url().max(1000).refine(v=>v.startsWith('https://')),z.literal('')]),imageUrl:coverSchema,notes:note};
export const schemas={
 city_places:z.object({...cityBase,category:z.enum(['landmark','beach','restaurant','cafe','park','museum']),lat:z.number().min(-90).max(90).nullable(),lng:z.number().min(-180).max(180).nullable(),openingHours:note,priceNote:note}).strict(),
 city_news:z.object({...cityBase,body:z.string().trim().min(20).max(15000),publishedDate:z.string().max(40)}).strict(),
 city_events:z.object({...cityBase,startsAt:z.string().min(10).max(40),endsAt:z.string().max(40),venue:name,bookingUrl:z.union([z.string().url().max(1000).refine(v=>v.startsWith('https://')),z.literal('')]),priceNote:note}).strict(),
 city_services:z.object({...cityBase,category:name,phone:z.string().max(40),website:z.union([z.string().url().max(1000).refine(v=>v.startsWith('https://')),z.literal('')]),openingHours:note}).strict(),
 city_businesses:z.object({...cityBase,category:name,phone:z.string().max(40),website:z.union([z.string().url().max(1000).refine(v=>v.startsWith('https://')),z.literal('')]),openingHours:note}).strict(),
 transport_lines:z.object({name,mode:id,origin:name,destination:name,status:statusSchema,aliases:texts,regionIds:ids,notes:note}).strict(),
 route_variants:z.object({name,lineId:id,direction:z.enum(['outbound','inbound']),originStopId:id,destinationStopId:id,stopIds:ids,boarding:note,exit:note,transferInstructions:note,geometry:z.array(point).max(1000),status:statusSchema,segmentMinutes:z.array(z.number().min(0).max(1440).nullable()).max(99),segmentFares:z.array(z.number().min(0).max(10000).nullable()).max(99),notes:note}).strict(),
 stops:z.object({name,aliases:texts,regionId:id,lat:z.number().min(-90).max(90).nullable(),lng:z.number().min(-180).max(180).nullable(),landmark:note,boarding:note,exit:note,streetSide:note,accessibility:note,notes:note}).strict(),
 fares:z.object({name,lineId:id,variantId:z.union([id,z.literal('')]),type:z.enum(['fixed','distance','zone']),amount:z.number().min(0).max(10000).nullable(),effectiveFrom:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),effectiveTo:z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/),z.literal('')]),rules:note,notes:note}).strict().refine(d=>!d.effectiveTo||d.effectiveTo>=d.effectiveFrom,{message:'تاريخ النهاية لازم يكون بعد البداية'}),
 alerts:z.object({name,description:note,severity:z.enum(['info','warning','critical']),lineIds:ids,active:z.boolean(),expiresAt:z.string().max(40),notes:note}).strict(),
 transport_modes:z.object({name,color:z.string().regex(/^#[0-9a-fA-F]{6}$/),icon:z.enum(['bus','tram','train','car']),enabled:z.boolean(),notes:note}).strict(),
 regions:z.object({name,parent:name,aliases:texts,notes:note}).strict(),
 data_sources:z.object({name,type:z.enum(['field_visit','operator','community','document','other']),reference:z.string().trim().min(2).max(1000),observedAt:z.string().max(40),notes:note}).strict(),
 app_settings:z.object({name,slogan:name,notice:note,maintenance:z.boolean(),showGuides:z.boolean(),showFares:z.boolean(),contact:z.string().max(180),notes:note}).strict()
};
export type Managed=typeof managedCollections[number];
export function validateDraft(collection:Managed,input:unknown){return schemas[collection].parse(input)}
export function publicationIssues(collection:Managed,d:any):string[]{const errors:string[]=[];try{validateDraft(collection,d)}catch{return ['كمل الحقول المطلوبة بصيغة صحيحة']}
 if(collection==='route_variants'){if(d.stopIds.length<2||new Set(d.stopIds).size!==d.stopIds.length)errors.push('حدد محطتين مختلفتين على الأقل بدون تكرار');if(d.stopIds[0]!==d.originStopId||d.stopIds.at(-1)!==d.destinationStopId)errors.push('البداية والنهاية لازم يطابقوا ترتيب المحطات');if(d.geometry.length<2)errors.push('ارسم مسار الشوارع أو أضف إحداثياته');if(!d.boarding.trim()||!d.exit.trim())errors.push('حدد معالم الركوب والنزول للاتجاه ده');if(d.segmentMinutes.length!==d.stopIds.length-1||d.segmentFares.length!==d.stopIds.length-1)errors.push('أضف وقت وأجرة كل وصلة أو null لو غير مؤكد');}
 if(collection==='stops'&&(d.lat===null||d.lng===null||!d.landmark||!d.streetSide))errors.push('حدد إحداثيات المحطة والمعلم وجانب الشارع');
 if(collection==='fares'&&d.amount===null)errors.push('حدد الأجرة قبل اعتمادها');
 return errors;
}
