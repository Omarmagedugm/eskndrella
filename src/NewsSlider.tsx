import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Newspaper, 
  Clock, 
  MapPin, 
  Pause, 
  Play, 
  ArrowLeft,
  Building
} from 'lucide-react';
import { subscribePublic, firebaseReady } from './firebase';
import { directoryEntries } from './cityDirectory';
import { safeCover } from './coverImage';
import { formatCityDate, type CityEntry } from './cityContent';
import './newsSlider.css';

interface NewsSliderProps {
  navigate: (tab: string) => void;
  save?: (text: string) => void;
}

// Fallback high-impact Alexandria news when remote is initializing or empty
const FALLBACK_NEWS: CityEntry[] = [
  {
    id: 'metro-progress-alex',
    name: 'تقدم أعمال المرحلة الأولى لمترو الإسكندرية (أبو قير - محطة مصر)',
    summary: 'تواصل وزارة النقل تنفيذ مشروع مترو الإسكندرية بطول ٢٢ كم و١٦ محطة علوية وسطحية، مع ربطه بشبكة الحافلات وترام الرمل لتسهيل تنقل أهالي شرق ووسط المدينة.',
    body: `تتواصل أعمال تنفيذ المرحلة الأولى لمشروع مترو الإسكندرية (خط أبو قير - محطة مصر)، بطول ٢٢ كيلومترًا، ليكون شريان النقل السريع الأساسي في المدينة الساحلية.

يتضمن المشروع تحويل قطار أبو قير القديم إلى شبكة مترو حضرية كهربائية بالكامل تشمل ١٦ محطة عصرية مزودة بمصاعد وسلالم كهربائية وبوابات ذكية، بالإضافة إلى محطات تبادلية كبرى في محطة مصر وسيدي جابر ومحطة فيكتوريا.

من المتوقع أن يختصر المترو زمن الرحلة من أبو قير إلى قلب المدينة إلى أقل من ٢٥ دقيقة، مع تقاطر كل ٣ إلى ٥ دقائق في أوقات الذروة.`,
    category: 'مواصلات ومشاريع',
    region: 'شرق ووسط الإسكندرية',
    publishedDate: '2026-11-02',
    sourceName: 'وزارة النقل — الهيئة القومية للأنفاق',
    sourceUrl: 'https://alexapta.gov.eg/',
    imageUrl: '/brand/magazine.jpeg',
    reviewedAt: '2026-11-02'
  },
  {
    id: 'corniche-expansion-2026',
    name: 'مشروع توسعة كورنيش الإسكندرية وممشى أهل إسكندرية السياحي',
    summary: 'الأعمال التنفيذية لتوسعة الكورنيش بطول ٤.٤ كم من سيدي بشر إلى المحروسة وزيادة حارات السير وإنشاء ممشى سياحي عالمي بطول الشاطئ.',
    body: `تشهد عروس البحر الأبيض المتوسط طفرة مرورية وسياحية مع استمرار أعمال مشروع توسعة كورنيش الإسكندرية بطول ٤.٤ كيلومتر، في القطاع الممتد من منطقة سيدي بشر مرورًا بالعصافرة وحتى المحروسة.

المشروع يرفع عدد حارات المرور في كل اتجاه للقضاء على التكدسات الصيفية، كما يشمل إنشاء ممشى أهل إسكندرية السياحي المجهز بمقاعد وممرات للدراجات وبرجولات تطل مباشرة على مياه البحر.`,
    category: 'مشروعات المحافظة',
    region: 'سيدي بشر والعصافرة',
    publishedDate: '2026-11-01',
    sourceName: 'محافظة الإسكندرية',
    sourceUrl: 'https://www.alexandria.gov.eg/',
    imageUrl: '/brand/eskendrella.png',
    reviewedAt: '2026-11-01'
  },
  {
    id: 'ba-innovation-borg-news',
    name: 'دار للابتكار والمعرفة بمكتبة الإسكندرية بمدينة برج العرب',
    summary: 'تخصيص ٢٥ فدانًا ببرج العرب الجديدة لإنشاء دار مكتبة الإسكندرية للابتكار والمعرفة ومركز للأبحاث وحفظ المخطوطات والذكاء الاصطناعي.',
    body: `وقّعت مكتبة الإسكندرية وجهاز مدينة برج العرب الجديدة عقد تخصيص قطعة أرض بمساحة ٢٥ فدانًا لإنشاء «دار مكتبة الإسكندرية للابتكار والمعرفة»، كمركز إقليمي متطور يجمع بين الأبحاث التكنولوجية وحفظ التراث العلمي.

يستهدف المشروع إنشاء معامل حديثة للذكاء الاصطناعي، ومراكز لدعم الشركات الناشئة، وقاعات للمؤتمرات الدولية والتعليم التفاعلي للشباب.`,
    category: 'ثقافة وابتكار',
    region: 'برج العرب الجديدة',
    publishedDate: '2026-11-01',
    sourceName: 'مكتبة الإسكندرية',
    sourceUrl: 'https://www.bibalex.org/ar/news/index',
    imageUrl: '/brand/magazine.jpeg',
    reviewedAt: '2026-11-01'
  },
  {
    id: 'sea-status-winter-update',
    name: 'حالة البحر المتوسط ورايات الشواطئ وحركة الموانئ بالإسكندرية',
    summary: 'تقرير يومي من الإدارة المركزية للسياحة والمصايف حول حالة أمواج البحر، ومتابعة حركة الملاحة وتفريغ السفن بمينائي الإسكندرية والدخيلة.',
    body: `أصدرت الإدارة المركزية للسياحة والمصايف بالإسكندرية تقريرها الدوري حول حالة البحر، مشيرة إلى استقرار حركة الأمواج والنشاط المعتاد على الكورنيش والشواطئ العامة والمجانية.

كما أعلنت هيئة ميناء الإسكندرية انتظام حركة الملاحة وتداول الحاويات وشحن وتفريغ البضائع الاستراتيجية بمينائي الإسكندرية والدخيلة، مع اتخاذ كافة التدابير الوقائية لمواجهة أي تغيرات جوية مرتقبة.`,
    category: 'طقس وبحر',
    region: 'شواطئ وموانئ الإسكندرية',
    publishedDate: '2026-10-31',
    sourceName: 'إدارة السياحة والمصايف',
    sourceUrl: 'https://www.alexandria.gov.eg/',
    imageUrl: '/brand/eskendrella.png',
    reviewedAt: '2026-10-31'
  },
  {
    id: 'raml-tram-revamp',
    name: 'تحديث أسطول ترام الرمل التاريخي وزيادة رحلات الخدمة',
    summary: 'هيئة نقل الركاب تعلن خطة تطوير مسارات ترام الرمل العريق وعرباته الزرقاء، لتقليل زمن التقاطر وتوفير رحلات مكيفة ومريحة.',
    body: `يواصل ترام الرمل، أحد أقدم خطوط الترام في العالم وأيقونة عروس البحر الأبيض المتوسط، تقديم خدماته مع تنفيذ أعمال تطوير مستمرة للمسارات والشبكة الكهربائية.

أكدت هيئة نقل الركاب الدفع بعدد إضافي من العربات المكيفة والحديثة خلال ساعات الذروة، للحفاظ على الطابع التراثي للترام مع توفير رحلة عصرية بأسعار في متناول جميع الفئات.`,
    category: 'مواصلات وتراث',
    region: 'محطة الرمل — فيكتوريا',
    publishedDate: '2026-10-30',
    sourceName: 'الهيئة العامة لنقل الركاب',
    sourceUrl: 'https://alexapta.gov.eg/',
    imageUrl: '/brand/magazine.jpeg',
    reviewedAt: '2026-10-30'
  }
];

export default function NewsSlider({ navigate, save }: NewsSliderProps) {
  const [news, setNews] = useState<CityEntry[]>(FALLBACK_NEWS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Load news from directory & Firestore
  useEffect(() => {
    const localNews = directoryEntries('city_news');
    if (localNews && localNews.length > 0) {
      setNews(localNews);
    }

    if (firebaseReady) {
      const unsub = subscribePublic('city_news', (remote) => {
        const merged = directoryEntries('city_news', remote);
        if (merged && merged.length > 0) {
          setNews(merged);
        }
      });
      return () => unsub();
    }
  }, []);

  const totalSlides = news.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (totalSlides || 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + (totalSlides || 1)) % (totalSlides || 1));
  }, [totalSlides]);

  // Autoplay timer: advances every 5 seconds when not paused
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide, totalSlides]);

  // Handle touch swiping (RTL: swipe left moves to next, swipe right moves to previous)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    // In RTL: dragging left (positive distance) goes forward/next, dragging right goes previous
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentItem = news[currentIndex] || FALLBACK_NEWS[0];
  const coverUrl = safeCover(currentItem.imageUrl) || safeCover(currentItem.innerImageUrl) || '/brand/magazine.jpeg';



  return (
    <section 
      className="esk-news-slider-section" 
      aria-label="أخبار إسكندرية"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header bar */}
      <div className="esk-news-header">
        <div className="esk-news-header-titles">
          <span className="esk-news-live-badge">
            <span className="esk-news-pulse-dot" />
            نبض إسكندرية • أحدث الأخبار
          </span>
          <h2 className="esk-news-title">أخبار إسكندرية</h2>
          <p className="esk-news-subtitle">المستجدات اليومية، مشروعات المدينة، وحكايات عروس البحر الأبيض</p>
        </div>

        <div className="esk-news-controls">
          <button 
            type="button" 
            className="esk-news-all-btn"
            onClick={() => navigate('city-news')}
            title="تصفح جميع أخبار وحكايات إسكندريلا"
          >
            المجلة والأخبار <ArrowLeft size={16} />
          </button>

          <button 
            type="button" 
            className="esk-news-btn"
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? "تشغيل التبديل التلقائي" : "إيقاف التبديل التلقائي مؤقتًا"}
            title={isPaused ? "تشغيل التبديل التلقائي" : "إيقاف التبديل مؤقتًا"}
          >
            {isPaused ? <Play size={15} /> : <Pause size={15} />}
          </button>

          {/* RTL: Next is left arrow, Previous is right arrow */}
          <button 
            type="button" 
            className="esk-news-btn"
            onClick={prevSlide}
            aria-label="الخبر السابق"
            title="الخبر السابق"
          >
            <ChevronRight size={20} />
          </button>

          <button 
            type="button" 
            className="esk-news-btn"
            onClick={nextSlide}
            aria-label="الخبر التالي"
            title="الخبر التالي"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      </div>

      {/* Main Slide Card */}
      <div 
        className="esk-news-slider-wrapper"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="esk-news-slide"
          onClick={() => navigate('news:' + (currentItem.id || currentItem.name))}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              navigate('news:' + (currentItem.id || currentItem.name));
            }
          }}
          aria-label={`اقرأ الخبر: ${currentItem.name}`}
        >
          {/* Content side */}
          <div className="esk-news-slide-content">
            <div>
              <h3 className="esk-news-slide-headline">{currentItem.name}</h3>
              <p className="esk-news-slide-summary">{currentItem.summary}</p>
            </div>

            <div className="esk-news-badge-row">
              <span className="esk-news-category-badge">
                <Newspaper size={13} />
                {currentItem.category || 'أخبار إسكندرية'}
              </span>

              {currentItem.region && (
                <span className="esk-news-region-badge">
                  <MapPin size={12} />
                  {currentItem.region}
                </span>
              )}

              {currentItem.publishedDate && (
                <span className="esk-news-region-badge">
                  <Clock size={12} />
                  {formatCityDate(currentItem.publishedDate)}
                </span>
              )}
            </div>

            <div className="esk-news-slide-footer">
              <span className="esk-news-source-tag">
                <Building size={14} />
                المصدر: {currentItem.sourceName || 'محررو إسكندريلا'}
              </span>

              <span className="esk-news-read-cta">
                اقرأ الخبر <ArrowLeft size={15} />
              </span>
            </div>
          </div>

          {/* Visual side */}
          <div className="esk-news-slide-visual">
            <img 
              src={coverUrl} 
              alt={currentItem.name} 
              className="esk-news-slide-img" 
              loading="lazy" 
            />
            <div className="esk-news-visual-overlay">
              <span className="esk-news-visual-caption">
                {currentItem.region || 'عروس البحر الأبيض'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar with slide dots and counter */}
        <div className="esk-news-bottom-bar">
          <div className="esk-news-dots">
            {news.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                className={`esk-news-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`انتقل إلى الخبر رقم ${idx + 1}`}
              />
            ))}
          </div>

          <span>
            {((currentIndex + 1)).toLocaleString('ar-EG')} من {(totalSlides).toLocaleString('ar-EG')}
          </span>
        </div>
      </div>

      {/* News Cards Strip Under Slider (with Images) */}
      <div className="esk-news-chips-strip" role="tablist" aria-label="أحدث الأخبار">
        {news.map((item, idx) => {
          const chipCover = safeCover(item.imageUrl) || safeCover(item.innerImageUrl) || '/brand/magazine.jpeg';
          return (
            <button
              key={item.id || idx}
              type="button"
              className={`esk-news-chip ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => {
                if (idx === currentIndex) {
                  navigate('news:' + (item.id || item.name));
                } else {
                  setCurrentIndex(idx);
                }
              }}
              role="tab"
              aria-selected={idx === currentIndex}
              title={item.name}
            >
              <div className="esk-news-chip-thumb">
                <img src={chipCover} alt={item.name} loading="lazy" />
                <span className="esk-news-chip-badge">{item.category || 'خبر'}</span>
              </div>
              <div className="esk-news-chip-info">
                <span className="esk-news-chip-title">{item.name}</span>
                {item.publishedDate && (
                  <span className="esk-news-chip-date">
                    <Clock size={11} /> {formatCityDate(item.publishedDate)}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
