import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Bookmark,Check,Copy,ExternalLink,Share2,Type,Newspaper} from 'lucide-react';
import {useMagazine} from './useMagazine';
import {ArticleCard} from './ArticleCard';
import {articleBlocks,articleImage,articleSaved,articleTags,readingMinutes,relatedArticles,safeLink,type Article} from './editorialModel';
import {formatCityDate} from './cityContent';
import {routeHref} from './navigation';

export function InlineText({text}:{text:string}){
  const parts=text.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*]+\*\*)/g);
  return <>{parts.map((part,index)=>{const link=part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);if(link&&safeLink(link[2]))return <a key={index} href={safeLink(link[2])!} target="_blank" rel="noreferrer">{link[1]}<ExternalLink size={13}/></a>;return part.startsWith('**')&&part.endsWith('**')?<strong key={index}>{part.slice(2,-2)}</strong>:part;})}</>;
}
function EmbeddedVideo({url}:{url:string}){const [open,setOpen]=useState(false);return open?<iframe className="ed-embed" src={url} title="فيديو مرتبط بالمادة" loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<button className="ed-video-button" onClick={()=>setOpen(true)}>تشغيل الفيديو من YouTube <ExternalLink size={16}/></button>;}
export function ArticleBody({body}:{body:string}){return <>{articleBlocks(body).map((block,index)=>block.type==='heading'?<h2 id={block.id} key={index}>{block.text}</h2>:block.type==='quote'?<blockquote key={index}><InlineText text={block.text}/></blockquote>:block.type==='image'?<figure key={index}><img src={block.url} alt={block.text} loading="lazy" width="1000" height="650"/>{block.caption&&<figcaption>{block.caption}</figcaption>}</figure>:block.type==='list'?<ul key={index}>{block.text.split('\n').map((line,i)=><li key={i}><InlineText text={line.replace(/^[-*]\s+/,'')}/></li>)}</ul>:block.type==='video'?<EmbeddedVideo key={index} url={block.url!}/>:<p key={index}><InlineText text={block.text}/></p>)}</>;}

export default function NewsArticlePage({articleId,navigate,save,saved=[],previewArticle}:{articleId:string;navigate:(route:string)=>void;save?:(key:string)=>void;saved?:string[];magazineCover?:string;previewArticle?:Article}){
  const {articles,loading}=useMagazine();
  const article=previewArticle||articles.find(item=>item.id===articleId);
  const [message,setMessage]=useState('');const [large,setLarge]=useState(false);const [progress,setProgress]=useState(0);
  const bodyRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{setMessage('');setProgress(0);},[articleId]);
  useEffect(()=>{
    let frame=0;
    const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const el=bodyRef.current;if(!el)return;const rect=el.getBoundingClientRect();const length=rect.height-window.innerHeight*.5;setProgress(Math.round(Math.max(0,Math.min(100,(-rect.top+window.innerHeight*.25)/Math.max(1,length)*100))));});};
    update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
  },[article?.id]);
  useEffect(()=>{
    if(!article||previewArticle)return;
    document.title=article.name+' | إسكندريلا';
    const setMeta=(name:string,content:string,property=false)=>{let el=document.head.querySelector<HTMLMetaElement>(`meta[${property?'property':'name'}="${name}"]`);if(!el){el=document.createElement('meta');el.setAttribute(property?'property':'name',name);document.head.appendChild(el);}el.content=content;};
    const url=new URL(routeHref('news:'+article.id),location.origin).href;
    setMeta('description',article.summary);setMeta('og:title',article.name,true);setMeta('og:description',article.summary,true);setMeta('og:url',url,true);setMeta('og:type','article',true);
    setMeta('og:image',new URL(articleImage(article)||'/brand/magazine.jpeg',location.origin).href,true);
    let canonical=document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.appendChild(canonical);}canonical.href=url;
    const json=document.createElement('script');json.type='application/ld+json';json.textContent=JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:article.name,description:article.summary,datePublished:article.publishedDate||undefined,dateModified:article.updatedDate||undefined,author:article.authorName?{'@type':'Person',name:article.authorName}:undefined,publisher:{'@type':'Organization',name:'إسكندريلا'},mainEntityOfPage:url});document.head.appendChild(json);
    return()=>{json.remove();canonical?.remove();};
  },[article,previewArticle]);
  if(!article)return <section className="ed-empty" aria-live="polite"><Newspaper size={38}/><p className="ed-kicker">{loading?'جاري البحث عن المادة':'٤٠٤ / صفحة غير موجودة'}</p><h1>{loading?'لحظة، نفتح الحكاية…':'هذه الحكاية غير موجودة'}</h1><p>{loading?'نحاول تحميل أحدث نسخة منشورة.':'قد يكون الرابط قديمًا، أو أن المادة لم تُنشر بعد.'}</p><button className="ed-button" onClick={()=>navigate('city-news')}>تصفّح المجلة <ArrowLeft size={18}/></button></section>;
  const body=article.body||'';const headings=articleBlocks(body).filter(block=>block.type==='heading');const image=articleImage({...article,imageUrl:article.innerImageUrl||article.imageUrl});const related=relatedArticles(article,articles);
  const savedKey=saved.includes(`خبر: ${article.name}`)?`خبر: ${article.name}`:saved.includes(article.name)?article.name:`article:${article.id}`;
  const copy=async()=>{try{await navigator.clipboard.writeText(new URL(routeHref('news:'+article.id),location.origin).href);setMessage('تم نسخ رابط المقال');}catch{setMessage('تعذّر النسخ. يمكنك نسخ الرابط من شريط العنوان.');}};
  const share=async()=>{try{if(navigator.share)await navigator.share({title:article.name,url:new URL(routeHref('news:'+article.id),location.origin).href});else await copy();}catch(error){if(!(error instanceof Error&&error.name==='AbortError'))setMessage('تعذّرت المشاركة. جرّب نسخ الرابط.');}};
  return <article className={`ed-article ${large?'ed-large-type':''} ${previewArticle?'ed-is-preview':''}`} dir="rtl">
    {!previewArticle&&<div className="ed-reading-track" aria-hidden="true"><span style={{width:progress+'%'}}/></div>}
    <nav className="ed-breadcrumb" aria-label="مسار المقال"><a href="/" onClick={e=>{e.preventDefault();navigate('city');}}>الرئيسية</a><span>/</span><a href="/magazine" onClick={e=>{e.preventDefault();navigate('city-news');}}>المجلة</a><span>/</span><span>{article.category||'من المدينة'}</span></nav>
    {previewArticle&&<p className="ed-status">معاينة مسودة · لا تظهر للقراء</p>}
    <div className="ed-article-header"><a className="ed-kicker" href={routeHref('category:'+(article.category||'أخبار المدينة'))} onClick={e=>{e.preventDefault();navigate('category:'+(article.category||'أخبار المدينة'));}}>{article.category||'أخبار المدينة'}</a><h1>{article.name}</h1><p className="ed-article-deck">{article.summary}</p><div className="ed-byline"><div>{article.authorName?<a href={routeHref('author:'+article.authorName)} onClick={e=>{e.preventDefault();navigate('author:'+article.authorName);}}>بقلم <b>{article.authorName}</b></a>:<span>المصدر: <b>{article.sourceName||'غير محدد'}</b></span>}<span className="ed-meta">{article.publishedDate&&<time dateTime={article.publishedDate}>{formatCityDate(article.publishedDate)}</time>}{article.updatedDate&&<time dateTime={article.updatedDate}>تحديث: {formatCityDate(article.updatedDate)}</time>}<span>{readingMinutes(body||article.summary).toLocaleString('ar-EG')} د قراءة</span></span></div><div className="ed-reading-actions"><button className="icon-button" title="حجم النص" aria-label="تكبير نص المقال" aria-pressed={large} onClick={()=>setLarge(!large)}><Type size={19}/></button>{save&&!previewArticle&&<button className="icon-button" aria-label={articleSaved(article,saved)?'إلغاء حفظ المقال':'حفظ المقال'} aria-pressed={articleSaved(article,saved)} onClick={()=>save(savedKey)}><Bookmark size={19} fill={articleSaved(article,saved)?'currentColor':'none'}/></button>}<button className="icon-button" aria-label="نسخ رابط المقال" onClick={copy}><Copy size={18}/></button></div></div></div>
    {message&&<p className="ed-share-message" role="status"><Check size={16}/>{message}</p>}
    {image&&<figure className="ed-article-cover"><img src={image} alt={article.imageAlt||article.name} width="1200" height="750" fetchPriority="high"/>{(article.imageCaption||article.imageCredit)&&<figcaption>{article.imageCaption}{article.imageCredit&&<span> — {article.imageCredit}</span>}</figcaption>}</figure>}
    <div className="ed-reading-layout"><aside className="ed-reading-sidebar"><span className="ed-kicker">في هذه المادة</span>{headings.length>=2?<nav aria-label="فهرس المقال">{headings.map(heading=><a key={heading.id} href={'#'+heading.id}>{heading.text}</a>)}</nav>:<p>{article.region}<br/>من دفتر إسكندريلا</p>}<div className="ed-sidebar-rule"/><button onClick={share}><Share2 size={16}/> مشاركة المادة</button><button onClick={copy}><Copy size={16}/> نسخ الرابط</button></aside><div className="ed-reading-body" ref={bodyRef}>{body&&body.trim()!==article.summary.trim()&&<ArticleBody body={body}/>}{safeLink(article.sourceUrl)&&<div className="ed-source-note"><span className="ed-kicker">للقراءة والتحقق</span><p>هذه المادة مستندة إلى {article.sourceName||'المصدر المرفق'}.{article.reviewedAt?' آخر مراجعة للمصدر: '+formatCityDate(article.reviewedAt)+'.':''}</p><a href={safeLink(article.sourceUrl)!} target="_blank" rel="noreferrer">افتح المادة من مصدرها <ExternalLink size={16}/></a></div>}{articleTags(article).length>0&&<nav className="ed-tags" aria-label="وسوم المقال">{articleTags(article).map(tag=><a key={tag} href={routeHref('tag:'+tag)} onClick={e=>{e.preventDefault();navigate('tag:'+tag);}}>#{tag}</a>)}</nav>}<div className="ed-article-end"><span>نهاية الحكاية، بداية اكتشاف آخر.</span><button className="ed-button" onClick={share}><Share2 size={17}/> شارك المقال</button></div></div></div>
    {!previewArticle&&related.length>0&&<section className="ed-section ed-related"><div className="ed-section-heading"><div><span className="ed-kicker">خيط لحكاية أخرى</span><h2>على صلة بما قرأت</h2></div></div><div className="ed-card-grid">{related.map((item,index)=><ArticleCard key={item.id} article={item} index={index} navigate={navigate} save={save} saved={saved}/>)}</div></section>}
    {!previewArticle&&<a className="ed-back-link" href="/magazine" onClick={e=>{e.preventDefault();navigate('city-news');}}><ArrowRight size={18}/> الرجوع إلى المجلة</a>}
  </article>;
}
