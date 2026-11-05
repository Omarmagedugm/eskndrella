import type {CityEntry} from './cityContent';
import {directoryEntries} from './cityDirectory';
import {normalize} from './data';
import {safeCover} from './coverImage';

export type Article = CityEntry & {authorName?:string; authorBio?:string; tags?:string[]; updatedDate?:string; imageAlt?:string; imageCaption?:string; imageCredit?:string; featured?:boolean; workflowStatus?:string};
export type ArticleBlock = {type:'paragraph'|'heading'|'quote'|'image'|'list'|'video'; text:string; id?:string; url?:string; caption?:string};
export function safeLink(value:unknown):string|null { try {const url=new URL(String(value));return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:null;}catch{return null;} }
export function articleBlocks(body:string):ArticleBlock[] {
  let heading=0;
  return String(body||'').split(/\n\s*\n/).map(text=>text.trim()).filter(Boolean).map(text=>{
    if (/^#{2,3}\s/.test(text)) return {type:'heading',text:text.replace(/^#{2,3}\s+/,''),id:`part-${++heading}`};
    if (/^>\s?/.test(text)) return {type:'quote',text:text.replace(/^>\s?/gm,'')};
    const img=text.match(/^!\[([^\]]*)\]\((https:\/\/[^\s)]+)(?:\s+"([^"]*)")?\)$/);
    if(img&&safeCover(img[2]))return {type:'image',text:img[1],url:img[2],caption:img[3]};
    const video=text.match(/^@\[youtube\]\(https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})\)$/);
    if(video)return {type:'video',text:'فيديو مرتبط بالمادة',url:`https://www.youtube-nocookie.com/embed/${video[1]}`};
    if(text.split('\n').every(line=>/^[-*]\s/.test(line)))return {type:'list',text};
    return {type:'paragraph',text};
  });
}
export function readingMinutes(body:string):number { return Math.max(1,Math.ceil(String(body||'').replace(/[#>*\[\]()]/g,' ').trim().split(/\s+/).filter(Boolean).length/190)); }
export function articleTags(item:Article):string[] { return Array.isArray(item.tags)?item.tags.filter((s):s is string=>typeof s==='string'&&!!s.trim()):[]; }
export function magazineArticles(remote:Article[]=[],now=Date.now()):Article[] {
  return directoryEntries('city_news',remote,now).filter(item=>!['draft','scheduled','archived'].includes(item.workflowStatus)&&(!item.publishAt||Date.parse(item.publishAt)<=now));
}
export function filterArticles(items:Article[],options:{query?:string;category?:string;tag?:string;author?:string;region?:string;sort?:string}) {
  const q=normalize(options.query||'');
  return items.filter(item=>(!options.category||item.category===options.category)&&(!options.region||item.region===options.region)&&(!options.tag||articleTags(item).includes(options.tag))&&(!options.author||item.authorName===options.author)&&normalize([item.name,item.summary,item.body,item.category,item.region,item.authorName,...articleTags(item)].join(' ')).includes(q)).sort((a,b)=>options.sort==='oldest'?String(a.publishedDate||'').localeCompare(String(b.publishedDate||'')):String(b.publishedDate||'').localeCompare(String(a.publishedDate||'')));
}
export function relatedArticles(article:Article,items:Article[]):Article[] {
  return items.filter(item=>item.id!==article.id).map(item=>({item,score:(item.category&&item.category===article.category?3:0)+(item.region===article.region?1:0)+articleTags(item).filter(tag=>articleTags(article).includes(tag)).length*2})).filter(({score})=>score>0).sort((a,b)=>b.score-a.score).slice(0,3).map(({item})=>item);
}
export function articleSaved(item:Article,saved:string[]):boolean{return saved.includes(`article:${item.id}`)||saved.includes(`خبر: ${item.name}`)||saved.includes(item.name);}
export function articleImage(item:Article):string|null {const cover=safeCover(item.imageUrl)||safeCover(item.innerImageUrl);return cover&&!['/brand/magazine.jpeg','/brand/eskendrella.png'].includes(cover)?cover:null;}
