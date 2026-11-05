import React, { useState, useEffect } from 'react';
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
  CalendarDays
} from 'lucide-react';
import { directoryEntries } from './cityDirectory';
import { subscribePublic, firebaseReady } from './firebase';
import { safeCover } from './coverImage';
import { formatCityDate, type CityEntry } from './cityContent';
import { normalize } from './data';
import './newsArticle.css';

interface NewsArticlePageProps {
  articleId: string;
  navigate: (tab: string) => void;
  save?: (text: string) => void;
  saved?: string[];
  magazineCover?: string;
}

export default function NewsArticlePage({
  articleId,
  navigate,
  save,
  saved = [],
  magazineCover = '/brand/magazine.jpeg'
}: NewsArticlePageProps) {
  const [newsList, setNewsList] = useState<CityEntry[]>(() => directoryEntries('city_news'));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [articleId]);

  useEffect(() => {
    if (firebaseReady) {
      const unsub = subscribePublic('city_news', (remote) => {
        const merged = directoryEntries('city_news', remote);
        if (merged && merged.length > 0) {
          setNewsList(merged);
        }
      });
      return () => unsub();
    }
  }, []);

  // Find article by id or normalized name
  const decodedId = decodeURIComponent(articleId || '');
  const article = newsList.find(
    (item) => item.id === decodedId || normalize(item.name) === normalize(decodedId)
  ) || newsList[0];

  const handleShare = () => {
    if (!article) return;
    const url = window.location.href;
    const shareText = `${article.name}\n\n${article.summary}\n\nعبر إسكندريلا ماجازين:\n${url}`;

    if (navigator.share) {
      navigator.share({
        title: article.name,
        text: shareText,
        url: url
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2600);
    }
  };

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
          <h2>الخبر غير موجود أو جاري تحميله</h2>
          <p>تقدر ترجع لقسم الأخبار وتتصفح أحدث أخبار وفعاليات إسكندرية.</p>
          <button className="primary" onClick={() => navigate('city-news')}>
            الرجوع لقسم الأخبار <ArrowLeft size={16} />
          </button>
        </div>
      </div>
    );
  }

  const isSaved = saved.includes(`خبر: ${article.name}`) || saved.includes(article.name);
  const coverUrl = safeCover(article.imageUrl) || safeCover(article.innerImageUrl) || magazineCover;
  const relatedArticles = newsList.filter((item) => item.id !== article.id).slice(0, 3);

  // Split article body into natural paragraphs
  const rawBody: string = article.body || article.summary || '';
  const paragraphs: string[] = rawBody
    .split(/\n\n+/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  return (
    <article className="news-article-page" dir="rtl">
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
                <b>المصدر المعتمد:</b> {article.sourceName || 'تحرير ومراجعة إسكندريلا'}
              </div>
              <div className="source-date">
                {article.reviewedAt && (
                  <span>تم التحقق والمراجعة: {formatCityDate(article.reviewedAt)} · </span>
                )}
                <span>محتوى صحفي موثّق</span>
              </div>
            </div>
          </div>

          <div className="source-quick-actions">
            {article.sourceUrl && (
              <a 
                href={article.sourceUrl} 
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
          alt={article.name} 
          className="news-hero-img" 
        />
        {(article.region || article.sourceName) && (
          <figcaption className="news-hero-caption">
            <span>{article.region || 'عروس البحر الأبيض المتوسط'}</span>
            {article.sourceName && <span>تصوير / تغطية: {article.sourceName}</span>}
          </figcaption>
        )}
      </figure>

      {/* Lead Summary Callout */}
      {article.summary && (
        <div className="news-article-lead">
          <p>{article.summary}</p>
        </div>
      )}

      {/* Article Body Content */}
      <section className="news-article-content">
        {paragraphs.map((p: string, idx: number) => (
          <p key={idx} className="news-paragraph">
            {p}
          </p>
        ))}

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
      <section className="news-article-action-bar">
        {save && (
          <button 
            type="button" 
            className={`news-action-btn ${isSaved ? 'saved' : ''}`}
            onClick={() => save(`خبر: ${article.name}`)}
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
          <span>{copied ? 'تم نسخ الرابط والملخص!' : 'مشاركة الخبر'}</span>
        </button>

        {article.sourceUrl && (
          <a 
            href={article.sourceUrl} 
            target="_blank" 
            rel="noreferrer"
            className="news-action-btn primary-action"
          >
            <span>زيارة موقع المصدر الرسمي</span>
            <ExternalLink size={16} />
          </a>
        )}
      </section>

      {/* Related News Section */}
      {relatedArticles.length > 0 && (
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
                  className="news-related-card"
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
