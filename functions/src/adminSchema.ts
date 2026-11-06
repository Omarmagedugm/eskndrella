import {z} from 'zod';
import definitions from './editorDefinitions.json';
export const managedCollections=['transport_lines','route_variants','stops','fares','alerts','transport_modes','regions','data_sources','app_settings','city_places','city_outings','city_news','city_events','city_services','city_businesses','sports_clubs','sports_fixtures','sports_activities'] as const;
export type Managed=typeof managedCollections[number];
export const statusSchema=z.enum(['active','suspended','development','construction','planned','closed','unknown']);
const https=z.string().url().max(1000).refine(value=>{try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}});
export const coverSchema=z.union([https,z.string().max(180000).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]*={0,2}$/),z.string().max(300).regex(/^\/(?!\/)[\w/.-]+$/),z.literal('')]);
const text=z.string().trim().max(3000);
const point=z.tuple([z.number().min(-180).max(180),z.number().min(-90).max(90)]);
function fieldSchema(field:{key:string;type:string;options?:string[]}):z.ZodTypeAny{
 const key=field.key;
 if(field.type==='image')return coverSchema.default('');
 if(field.type==='checkbox')return z.boolean().default(false);
 if(field.type==='number'){if(key==='lat')return z.number().min(-90).max(90).nullable().default(null);if(key==='lng')return z.number().min(-180).max(180).nullable().default(null);return z.number().min(0).max(100000).nullable().default(null);}
 if(field.type==='list')return z.array(z.string().trim().min(1).max(180)).max(100).default([]);
 if(field.type==='json'){if(key==='geometry')return z.array(point).max(1000).default([]);if(['segmentMinutes','segmentFares'].includes(key))return z.array(z.number().min(0).max(10000).nullable()).max(99).default([]);return z.array(z.string().max(180)).max(100).default([]);}
 if(field.type==='select'&&field.options?.length)return z.enum(field.options as [string,...string[]]);
 if(/Url$/.test(key)||key==='website')return z.union([https,z.literal('')]).default('');
 if(key==='name')return text.min(2).max(180);
 if(key==='body')return z.string().trim().max(30000).default('');
 if(field.type==='date')return z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/),z.literal('')]).default('');
 return text.default('');
}
export const schemas=Object.fromEntries(Object.entries(definitions).map(([collection,fields])=>[collection,z.object(Object.fromEntries(fields.map(field=>[field.key,fieldSchema(field)]))).strict()])) as Record<string,z.ZodTypeAny>;
export function validateDraft(collection:Managed,input:unknown):any {return schemas[collection].parse(input);}
export function publicationIssues(collection:Managed,data:any):string[]{
 try{validateDraft(collection,data);}catch{return ['كمل الحقول المطلوبة بصيغة صحيحة'];}
 const errors:string[]=[];
 if(collection==='route_variants'){if(data.stopIds.length<2||new Set(data.stopIds).size!==data.stopIds.length)errors.push('حدد محطتين مختلفتين على الأقل بدون تكرار');if(data.stopIds[0]!==data.originStopId||data.stopIds.at(-1)!==data.destinationStopId)errors.push('البداية والنهاية لازم يطابقوا ترتيب المحطات');if(data.geometry.length<2)errors.push('ارسم مسار الشوارع أو أضف إحداثياته');if(!data.boarding.trim()||!data.exit.trim())errors.push('حدد معالم الركوب والنزول للاتجاه ده');if(data.segmentMinutes.length!==data.stopIds.length-1||data.segmentFares.length!==data.stopIds.length-1)errors.push('أضف وقت وأجرة كل وصلة أو null لو غير مؤكد');}
 if(collection==='stops'&&(data.lat===null||data.lng===null||!data.landmark||!data.streetSide))errors.push('حدد إحداثيات المحطة والمعلم وجانب الشارع');
 if(collection==='fares'){if(data.amount===null)errors.push('حدد الأجرة قبل اعتمادها');if(data.effectiveTo&&data.effectiveTo<data.effectiveFrom)errors.push('تاريخ النهاية لازم يكون بعد البداية');}
 return errors;
}
export const editorialSchema=z.object({name:text.min(2).max(180),summary:text.default(''),body:z.string().trim().max(30000).default(''),category:text.max(80).default(''),region:text.max(180).default(''),authorName:text.max(180).default(''),authorBio:text.default(''),sourceName:text.max(180).default(''),sourceUrl:z.union([https,z.literal('')]).default(''),tags:z.array(z.string().trim().min(1).max(60)).max(16).default([]),publishedDate:z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/),z.literal('')]).default(''),imageUrl:coverSchema.default(''),innerImageUrl:coverSchema.default(''),imageAlt:text.default(''),imageCaption:text.default(''),imageCredit:text.default(''),featured:z.boolean().default(false),notes:text.default('')}).strict();
export function validateArticlePublication(input:unknown){const article=editorialSchema.parse(input);if(article.summary.length<10||article.body.length<20||!article.category||!article.publishedDate)throw Error('أكمل المقدمة والنص والقسم وتاريخ النشر.');if(!article.authorName&&(!article.sourceName||!article.sourceUrl))throw Error('أضف كاتب المادة الأصلية أو اسم المصدر ورابطه.');if(article.imageUrl&&(!article.imageAlt||!article.imageCredit))throw Error('أضف وصف الصورة وحقوق استخدامها.');return article;}
