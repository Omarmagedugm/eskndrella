import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readRoute,routeHref} from '../src/navigation';
import {articleBlocks,filterArticles,readingMinutes,relatedArticles,magazineArticles,cairoDateTimeToISO,safeLink,type Article} from '../src/editorialModel';
import {ArticleBody} from '../src/ArticleContent';
import {editorialSchema,validateArticlePublication} from '../functions/src/adminSchema';
const article:Article={id:'test',name:'حكاية اختبار',summary:'مقدمة للمادة لا تُنشر في المحتوى الحقيقي',body:'نص لاختبار خصائص القراءة فقط وليس مادة تحريرية.',category:'ثقافة',region:'الشاطبي',authorName:'كاتب الاختبار',sourceName:'',sourceUrl:'',reviewedAt:'',publishedDate:'2026-11-06',tags:['قراءة']};
test('all application routes and Arabic article identifiers survive reload and encoding',()=>{
 for(const route of ['city','city-news','city-outings','city-sports','city-services','city-businesses','home','directory','map','saved','profile','admin','editorial','news:حكاية %','tag:ثقافة','author:اسم الكاتب','category:حكايات','search:الحجر الجيري'])assert.equal(readRoute(routeHref(route)),route);
 for(const path of ['/missing','/read/%E0%A4%A','/read/a%2Fb','/read/'])assert.equal(readRoute(path),'not-found');
});
test('search combines full text, normalized Arabic, category, author and tags',()=>{
 assert.equal(filterArticles([article],{query:'خصائص',category:'ثقافة',author:'كاتب الاختبار',tag:'قراءة'}).length,1);
 assert.equal(filterArticles([article],{query:'غير موجود'}).length,0);assert.equal(filterArticles([article],{region:'الأنفوشي'}).length,0);
 assert.equal(relatedArticles(article,[article,{...article,id:'related'},{...article,id:'different',category:'رياضة',region:'بحري',tags:[]}]).length,1);
});
test('draft and scheduled remote records cannot appear in the public magazine',()=>{
 for(const state of ['draft','scheduled','archived'])assert.ok(!magazineArticles([{...article,workflowStatus:state}]).some(item=>item.id===article.id));
 assert.ok(!magazineArticles([{...article,published:false}]).some(item=>item.id===article.id));
 assert.ok(magazineArticles([{...article,published:true}]).some(item=>item.id===article.id));
});
test('rich text supports headings, lists, quotes and explicit safe video embeds while escaping HTML',()=>{
 assert.deepEqual(articleBlocks('## عنوان\n\n> اقتباس\n\n- واحد\n- اثنان').map(item=>item.type),['heading','quote','list']);
 assert.equal(articleBlocks('@[youtube](https://youtu.be/abcdefghijk)')[0].url,'https://www.youtube-nocookie.com/embed/abcdefghijk');
 const html=renderToStaticMarkup(createElement(ArticleBody,{body:'<img src=x onerror="alert(1)">\n\n[رابط](https://example.com)'}));
 assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img'));assert.ok(html.includes('rel="noreferrer"'));assert.equal(safeLink('javascript:alert(1)'),null);
 assert.equal(readingMinutes('كلمة '.repeat(400)),3);
});
test('draft validation rejects privilege injection and publication requires provenance and image rights',()=>{
 assert.ok(editorialSchema.safeParse(article).success===false); // UI metadata is deliberately excluded from write payloads.
 const {id,reviewedAt,...record}=article;assert.doesNotThrow(()=>validateArticlePublication(record));
 assert.throws(()=>validateArticlePublication({...record,authorName:''}));assert.throws(()=>validateArticlePublication({...record,imageUrl:'https://example.com/photo.jpg'}));
 assert.throws(()=>editorialSchema.parse({...record,role:'super_admin'}));
});
test('Cairo schedule conversion follows winter and summer time and rejects invalid clock dates',()=>{
 assert.equal(cairoDateTimeToISO('2026-11-06T18:00'),'2026-11-06T16:00:00.000Z');
 assert.equal(cairoDateTimeToISO('2026-07-06T18:00'),'2026-07-06T15:00:00.000Z');
 assert.throws(()=>cairoDateTimeToISO('2026-02-31T12:00'));assert.throws(()=>cairoDateTimeToISO('invalid'));
});
