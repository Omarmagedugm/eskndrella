import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Clock,
  Building,
  ExternalLink,
  Heart,
  Share2,
  MapPin,
  CheckCircle2,
  Newspaper,
  ShieldCheck,
  Bookmark,
  CalendarDays, Copy, Type
} from 'lucide-react';
import { directoryEntries } from './cityDirectory';
import { subscribePublic, firebaseReady } from './firebase';
import { safeCover } from './coverImage';
import { formatCityDate, type CityEntry } from './cityContent';
import { normalize } from './data';
import './newsArticle.css';
import {useMagazine} from './useMagazine';
import {useArticleMetadata} from './useArticleMetadata';
import {ArticleBody} from './ArticleContent';
import {articleBlocks,articleSaved,articleTags,readingMinutes,relatedArticles as relatedFor,safeLink,type Article} from './editorialModel';
import {routeHref} from './navigation';

interface NewsArticlePageProps {
  articleId: string;
  navigate: (tab: string) => void;
  save?: (text: string) => void;
  saved?: string[];
  magazineCover?: string;
  previewArticle?: Article;
}

export default function NewsArticlePage({
  articleId,
  navigate,
  save,
  saved = [],
  previewArticle,
  magazineCover = '/brand/magazine.jpeg'
}: NewsArticlePageProps) {
  const {articles:newsList,loading,error}=useMagazine();
  const [copied,setCopied]=useState(false);
  const [shareError,setShareError]=useState('');
  const [largeText,setLargeText]=useState(false);
  const [progress,setProgress]=useState(0);
  const bodyRef=useRef<HTMLElement>(null);
  const article=previewArticle||newsList.find(item=>item.id===articleId||normalize(item.name)===normalize(articleId));
  useArticleMetadata(article,!!previewArticle);
  useEffect(()=>{if(!previewArticle)window.scrollTo({top:0,behavior:'instant'});setCopied(false);setShareError('');},[articleId,previewArticle]);
  useEffect(()=>{if(!copied)return;const timer=setTimeout(()=>setCopied(false),2600);return()=>clearTimeout(timer);},[copied]);
  useEffect(()=>{let frame=0;const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const element=bodyRef.current;if(!element)return;const rect=element.getBoundingClientRect();setProgress(Math.round(Math.max(0,Math.min(100,(-rect.top+100)/Math.max(1,rect.height-innerHeight/2)*100))));});};update();window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update);return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};},[article?.id]);
  const copyLink=async()=>{try{await navigator.clipboard.writeText(new URL(routeHref('news:'+article!.id),location.origin).href);setCopied(true);setShareError('');}catch{setShareError('تعذّر النسخ. يمكنك نسخ الرابط من شريط العنوان.');}};
  const handleShare=async()=>{if(!article)return;try{if(navigator.share)await navigator.share({title:article.name,text:article.summary,url:new URL(routeHref('news:'+article.id),location.origin).href});else await copyLink();}catch(e){if(!(e instanceof Error&&e.name==='AbortError'))setShareError('تعذّرت المشاركة. جرّب نسخ الرابط.');}};

  if (!article) {
    return (
      <div className="news-article-page">
        <div className="news-article-breadcrumbs">
          <button className="text-button" onClick={() => navigate('city')}>
            الرئيسية
          </button>
          <ChevronSeparator />
          <button className="text-button" onClick={() => navigate('city-news')}>
            الأخبار والمجلة
          </button>
        </div>
        <div className="card empty">
          <Newspaper size={40} />
          <h2>{loading?'جاري تحميل المقال…':'المقال غير موجود'}</h2>
          <p>تقدر ترجع لقسم الأخبار وتتصفح أحدث أخبار وفعاليات إسكندرية.</p>
          <button className="primary" onClick={() => navigate('city-news')}>
            الرجوع لقسم الأخبار <ArrowLeft size={16} />
          </button>
        </div>
      </div>
    );
  }

  const isSaved=articleSaved(article,saved);
  const savedKey=saved.includes(`خبر: ${article.name}`)?`خبر: ${article.name}`:saved.includes(article.name)?article.name:`article:${article.id}`;
  const headings=articleBlocks(article.body||'').filter(block=>block.type==='heading');
  const coverUrl = safeCover(article.imageUrl) || safeCover(article.innerImageUrl) || magazineCover;
  const relatedArticles=relatedFor(article,newsList);

  // Split article body into natural paragraphs
  const rawBody: string = article.body || article.summary || '';
  const paragraphs: string[] = rawBody
    .split(/\n\n+/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  return (
    <article className={`news-article-page ${largeText?'news-large-text':''}`} dir="rtl">
      {!previewArticle&&<div className="news-reading-progress" aria-hidden="true"><span style={{width:progress+'%'}}/></div>}
      {previewArticle&&<p className="content-note">معاينة مسودة · لم تُنشر</p>}
      {error&&<p className="content-note" role="status">{error}</p>}
      {/* Top Breadcrumbs & Back Bar */}
      <nav className="news-article-top-nav" aria-label="مسار الخبر">
        <div className="news-article-breadcrumbs">
          <button className="text-button" onClick={() => navigate('city')}>
            الرئيسية
          </button>
          <ChevronSeparator />
          <button className="text-button" onClick={() => navigate('city-news')}>
            المجلة والأخبار
          </button>
          <ChevronSeparator />
          <span className="current-crumb">{article.category || 'خبر'}</span>
        </div>

        <button
          type="button"
          className="news-article-back-btn"
          onClick={() => navigate('city-news')}
        >
          <ArrowRight size={17} />
          <span>كل الأخبار</span>
        </button>
      </nav>

      {/* Main Editorial Header */}
      <header className="news-article-header">
        <h1 className="news-article-headline">{article.name}</h1>

        <div className="news-article-meta-badges">
          <span className="news-badge">{readingMinutes(article.body||article.summary).toLocaleString('ar-EG')} د قراءة</span>
          {article.authorName&&<a className="news-badge" href={routeHref('author:'+article.authorName)} onClick={e=>{e.preventDefault();navigate('author:'+article.authorName);}}>بقلم {article.authorName}</a>}
          {article.updatedDate&&<span className="news-badge">تحديث: {formatCityDate(article.updatedDate)}</span>}
          <span className="news-badge category">
            <Newspaper size={13} />
            {article.category || 'أخبار إسكندرية'}
          </span>

          {article.region && (
            <span className="news-badge region">
              <MapPin size={13} />
              {article.region}
            </span>
          )}

          {article.publishedDate && (
            <span className="news-badge date">
              <Clock size={13} />
              {formatCityDate(article.publishedDate)}
            </span>
          )}
        </div>

        {/* Verification and Source Stamp */}
        <div className="news-article-source-stamp">
          <div className="source-info">
            <div className="source-icon">
              <ShieldCheck size={20} color="#155570" />
            </div>
            <div>
              <div className="source-title">
                <b>المصدر:</b> {article.sourceName || 'غير محدد'}
              </div>
              <div className="source-date">
                {article.reviewedAt && (
                  <span>آخر مراجعة للمصدر: {formatCityDate(article.reviewedAt)} · </span>
                )}
                <span>{article.sourceUrl?'المادة متاحة بمصدرها':'لم يتم تحديد مصدر بعد'}</span>
              </div>
            </div>
          </div>

          <div className="source-quick-actions">
            {safeLink(article.sourceUrl) && (
              <a
                href={safeLink(article.sourceUrl)!}
                target="_blank"
                rel="noreferrer"
                className="source-ext-link"
                title="افتح المصدر الأصلي للخبر"
              >
                <span>رابط المصدر</span>
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Media Cover */}
      <figure className="news-article-hero">
        <img
          src={coverUrl}
          alt={article.imageAlt||article.name}
          width={1200} height={675} fetchPriority="high"
          className="news-hero-img"
        />
        {(article.imageCaption || article.imageCredit) && (
          <figcaption className="news-hero-caption">
            <span>{article.imageCaption||''}</span>
            {article.imageCredit&&<span>{article.imageCredit}</span>}
          </figcaption>
        )}
      </figure>

      {/* Lead Summary Callout */}
      {article.summary && (
        <div className="news-article-lead">
          <p>{article.summary}</p>
        </div>
      )}

      {headings.length>=2&&<nav className="news-article-toc" aria-label="فهرس المقال"><strong>في هذه المادة</strong>{headings.map(heading=><a key={heading.id} href={'#'+heading.id}>{heading.text}</a>)}</nav>}
      <div className="news-reading-tools"><button className="secondary" aria-pressed={largeText} onClick={()=>setLargeText(!largeText)}><Type size={17}/> حجم النص</button>{!previewArticle&&<button className="secondary" onClick={copyLink}><Copy size={16}/>{copied?'تم نسخ الرابط':'نسخ الرابط'}</button>}</div>
      {shareError&&<p role="status" className="content-note">{shareError}</p>}
      <section className="news-article-content" ref={bodyRef}>
        {rawBody.trim()!==article.summary.trim()&&<ArticleBody body={rawBody}/>}
        {article.innerImageUrl && article.imageUrl && article.innerImageUrl !== article.imageUrl && (
          <div className="news-inline-gallery">
            <img
              src={safeCover(article.innerImageUrl) || ''}
              alt={`${article.name} — لقطة إضافية`}
              loading="lazy"
            />
          </div>
        )}
      </section>

      {/* Action Bar (Share, Save, Source) */}
      {!previewArticle&&<section className="news-article-action-bar">
        {save && (
          <button
            type="button"
            className={`news-action-btn ${isSaved ? 'saved' : ''}`}
            onClick={() => save(savedKey)}
          >
            <Heart size={18} fill={isSaved ? '#ef4444' : 'none'} color={isSaved ? '#ef4444' : 'currentColor'} />
            <span>{isSaved ? 'محفوظ في مفضلتي' : 'احفظ الخبر'}</span>
          </button>
        )}

        <button
          type="button"
          className="news-action-btn share-btn"
          onClick={handleShare}
        >
          {copied ? <CheckCircle2 size={18} color="#16a34a" /> : <Share2 size={18} />}
          <span>{copied ? 'تم نسخ رابط المقال' : 'مشاركة الخبر'}</span>
        </button>

        {safeLink(article.sourceUrl) && (
          <a
            href={safeLink(article.sourceUrl)!}
            target="_blank"
            rel="noreferrer"
            className="news-action-btn primary-action"
          >
            <span>زيارة المصدر الأصلي</span>
            <ExternalLink size={16} />
          </a>
        )}
      </section>}

      {articleTags(article).length>0&&<nav className="news-article-tags" aria-label="وسوم المقال">{articleTags(article).map(tag=><a key={tag} href={routeHref('tag:'+tag)} onClick={e=>{e.preventDefault();navigate('tag:'+tag);}}>#{tag}</a>)}</nav>}
      {/* Related News Section */}
      {!previewArticle&&relatedArticles.length > 0 && (
        <section className="news-related-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">من إسكندريلا ماجازين</span>
              <h2>أخبار تهمك في إسكندرية</h2>
            </div>
            <button className="text-button" onClick={() => navigate('city-news')}>
              كل الأخبار <ArrowLeft size={15} />
            </button>
          </div>

          <div className="news-related-grid">
            {relatedArticles.map((item) => {
              const itemCover = safeCover(item.imageUrl) || safeCover(item.innerImageUrl) || magazineCover;
              return (
                <article
                  key={item.id}
                  className="news-related-card" role="link" tabIndex={0}
                  onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();navigate('news:'+item.id);}}}
                  onClick={() => navigate('news:' + item.id)}
                >
                  <div className="related-img-wrap">
                    <img src={itemCover} alt={item.name} loading="lazy" />
                    {item.category && <span className="related-cat-badge">{item.category}</span>}
                  </div>
                  <div className="related-card-body">
                    {item.publishedDate && (
                      <span className="related-date">
                        <Clock size={11} /> {formatCityDate(item.publishedDate)}
                      </span>
                    )}
                    <h3 className="related-title">{item.name}</h3>
                    <p className="related-summary">{item.summary}</p>
                    <span className="related-cta">
                      اقرأ الخبر كامل <ArrowLeft size={13} />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}

function ChevronSeparator() {
  return (
    <span className="breadcrumb-separator" aria-hidden="true">
      ‹
    </span>
  );
}
