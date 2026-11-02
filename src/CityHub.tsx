import SportsHub from './SportsHub';
import Outings from './Outings';
import {directoryEntries} from './cityDirectory';
import {safeCover} from './coverImage';
import HomeWidgets from './HomeWidgets';
import {eventStatus,formatCityDate} from './cityContent';
import {useEffect,useState} from 'react';
import {ArrowLeft,MapPin,Search,BusFront,Compass,Newspaper,Store,Heart,ExternalLink,X,Phone,ShieldCheck,Trophy} from 'lucide-react';
import {subscribePublic,firebaseReady} from './firebase';
import {normalize} from './data';

export const cityTabs=[
  {id:'city',label:'الرئيسية',icon:Compass},
  {id:'city-outings',label:'خروجات',icon:Compass},
  {id:'city-news',label:'المجلة',icon:Newspaper},
  {id:'city-services',label:'الدليل',icon:Store},
  {id:'profile',label:'حسابي',icon:Heart}
];

const groups=[
  {id:'city-outings',title:'خروجات إسكندرية',subtitle:'فسحة على قد جيبك، ومع اللي تحبهم',icon:Compass,color:'#247887'},
  {id:'city-sports',title:'رياضة سكندرية',subtitle:'مواعيد أنديتك، وأنشطة تلعبها',icon:Trophy,color:'#438d77'},
  {id:'city-news',title:'الأخبار والفعاليات',subtitle:'حكايات إسكندرية، واللي بيحصل فيها',icon:Newspaper,color:'#bc8523'},
  {id:'city-services',title:'الخدمات والمحلات',subtitle:'دليلك للي تحتاجه حواليك',icon:Store,color:'#79835a'},
  {id:'home',title:'مواصلات إسكندرية',subtitle:'من أي حتة لأي حتة في إسكندرية',icon:BusFront,color:'#146486'},
  {id:'city-places',title:'الأماكن والمعالم',subtitle:'اكتشف حتة جديدة في مدينتك',icon:MapPin,color:'#a38237'}
];

const collectionFor:Record<string,string>={
  'city-places':'city_places',
  'city-news':'city_news',
  'city-events':'city_events',
  'city-services':'city_services',
  'city-businesses':'city_businesses'
};

const categories:Record<string,string>={
  landmark:'معلم',
  beach:'شاطئ',
  restaurant:'مطعم',
  cafe:'كافيه',
  park:'حديقة',
  museum:'متحف'
};

const safeUrl=(url:unknown)=>typeof url==='string'&&url.startsWith('https://')?url:null;

export default function CityHub({
  tab,
  navigate,
  save,
  slogan,
  saved=[],
  settings={}
}:{
  tab:string;
  navigate:(t:string)=>void;
  save:(s:string)=>void;
  slogan?:string;
  saved?:string[];
  settings?:Record<string,any>;
}){
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [q,setQ]=useState('');
  const [region,setRegion]=useState('all');
  const [selected,setSelected]=useState<any>(null);

  useEffect(()=>{
    setQ('');
    setRegion('all');
    setItems([]);
    setSelected(null);
    setError('');
    const collection=collectionFor[tab];
    if(!collection)return;
    setItems(directoryEntries(collection));
    if(firebaseReady){
      setLoading(true);
      const unsub = subscribePublic(collection, r => {
        setItems(directoryEntries(collection, r));
        setLoading(false);
      });
      return () => unsub();
    }else{
      setLoading(false);
    }
  },[tab]);

  const filtered=items.filter(i=>
    (region==='all'||i.region===region)&&
    normalize([i.name,i.summary,i.region,i.category].join(' ')).includes(normalize(q))
  );

  if(tab==='city-sports')return <SportsHub navigate={navigate} save={save} saved={saved}/>;
  if(tab==='city-outings')return <Outings navigate={navigate} save={save}/>;

  const visibleGroups=groups.filter(g=>{
    if(g.id==='city-outings'&&settings.showOutings===false)return false;
    if(g.id==='city-sports'&&settings.showSports===false)return false;
    return true;
  });

  const heroArt=safeCover(settings.heroImageUrl)||'/brand/eskendrella.png';
  const magazineCover=safeCover(settings.magazineImageUrl)||'/brand/magazine.jpeg';

  if(tab==='city')return (
    <div className="city-home">
      <section className="city-hero">
        <div className="city-hero-copy">
          <span className="city-kicker">{settings.heroKicker||'أهلًا بيك في مدينتك'}</span>
          {settings.heroTitle?(
            <h1>{settings.heroTitle}</h1>
          ):(
            <h1>إسكندرية،<br/><em>بكل تفاصيلها.</em></h1>
          )}
          <p>{settings.heroDescription||'مكان تخرج فيه، حكاية تعرفها، خدمة تحتاجها، وطريق يوصّلك. كل ده في إسكندريلا.'}</p>
          <div className="city-hero-actions">
            {settings.showOutings!==false&&(
              <button className="primary" onClick={()=>navigate('city-outings')}>اختار خروجة <ArrowLeft size={18}/></button>
            )}
            <button className="secondary" onClick={()=>navigate('home')}><BusFront size={18}/> خطط مشوارك</button>
          </div>
          <span className="city-signature">{settings.slogan||slogan||'من قلب إسكندرية، لكل أهلها'}</span>
        </div>
        <div className="city-brand-art">
          <img src={heroArt} alt="Eskendrella Alexandria — شعار إسكندريلا"/>
          <span className="city-art-caption">{settings.heroCaption||'البحر، الترام، وحكاية مدينة.'}</span>
        </div>
      </section>

      {settings.showWidgets!==false&&<HomeWidgets/>}

      <section className="city-sections">
        <div className="section-heading">
          <div>
            <span className="eyebrow">مدينتك على مزاجك</span>
            <h2>هتبدأ منين النهارده؟</h2>
          </div>
          <span className="city-mini-wave">〰〰</span>
        </div>
        <div className="city-category-grid city-home-sections">
          {visibleGroups.map(g=>(
            <button key={g.id} className="city-category" onClick={()=>navigate(g.id)}>
              <span className="city-category-icon" style={{color:g.color,background:g.color+'15'}}><g.icon size={27}/></span>
              <h3>{g.title}</h3>
              <p>{g.subtitle}</p>
              <span className="city-category-cta">افتح القسم <ArrowLeft size={17}/></span>
            </button>
          ))}
        </div>
      </section>

      <section className="city-feature-row">
        <button className="city-transport-feature" onClick={()=>navigate('home')}>
          <span className="city-kicker">مشوارك يبدأ من هنا</span>
          <h2>مواصلات إسكندرية</h2>
          <p>الوجهات والأسعار وأوصاف الركوب والنزول،<br/>مع مصدر المعلومة وحالة مراجعتها.</p>
          <span>وريني الطريق <ArrowLeft size={18}/></span>
          <BusFront className="feature-bus" size={110}/>
        </button>
        <button className="city-magazine-feature" onClick={()=>navigate('city-news')}>
          <img src={magazineCover} alt="Eskendrella Magazine — إسكندريلا ماجازين"/>
          <div>
            <span className="eyebrow">من قلب المدينة</span>
            <h3>{settings.magazineTitle||'إسكندريلا ماجازين'}</h3>
            <p>{settings.magazineSubtitle||'الأخبار والحكايات والفعاليات'}</p>
            <ArrowLeft size={19}/>
          </div>
        </button>
      </section>

      <div className="city-editorial-note">
        <ShieldCheck size={22}/>
        <div>
          <b>دليل بيكبر بالمعلومة الصح</b>
          <p>محتوى تحريري مجمّع من مصادر رسمية وصحفية. افتح أي بطاقة عشان تشوف مصدرها وتاريخ مراجعتها؛ الأخبار والفعاليات مش موجز لحظي.</p>
        </div>
      </div>
    </div>
  );

  const title=
    tab==='city-places'?'الأماكن والمعالم':
    tab==='city-events'?'فعاليات إسكندرية':
    tab==='city-businesses'?'المحلات والأعمال':
    groups.find(g=>g.id===tab)?.title||'دليل إسكندرية';

  const selectedOuterCover=selected?(safeCover(selected.imageUrl)||(tab==='city-news'?magazineCover:null)):null;
  const selectedInnerCover=selected?(safeCover(selected.innerImageUrl)||selectedOuterCover):null;

  return (
    <section className="city-directory">
      <button className="text-button" onClick={()=>navigate('city')}>إسكندريلا <ArrowLeft size={16}/></button>
      <div className="page-intro">
        <div>
          <span className="eyebrow">كل حتة ليها حكاية</span>
          <h1>{title}</h1>
          <p>معلومة واضحة، ومصدر تقدر ترجع له.</p>
        </div>
        {tab==='city-news'&&<img className="magazine-wordmark" src={magazineCover} alt="Eskendrella Magazine"/>}
      </div>

      {['city-news','city-events'].includes(tab)&&(
        <div className="filter-row">
          <button className={tab==='city-news'?'active':''} onClick={()=>navigate('city-news')}>الأخبار والحكايات</button>
          <button className={tab==='city-events'?'active':''} onClick={()=>navigate('city-events')}>الفعاليات</button>
        </div>
      )}

      {['city-services','city-businesses'].includes(tab)&&(
        <div className="filter-row">
          <button className={tab==='city-services'?'active':''} onClick={()=>navigate('city-services')}>الخدمات</button>
          <button className={tab==='city-businesses'?'active':''} onClick={()=>navigate('city-businesses')}>المحلات والأعمال</button>
        </div>
      )}

      <p className="content-note">بيانات مجمّعة من الإنترنت بمصادرها وتواريخ مراجعتها. الأخبار مرتبة من الأحدث والفعاليات القادمة أولًا. المواعيد والأسعار قد تتغير؛ تأكد من الجهة قبل الزيارة أو الحجز.</p>
      <p className="catalog-count" role="status">{filtered.length.toLocaleString('ar-EG')} نتيجة{loading?' · جاري تحديث المحتوى المنشور…':''}</p>

      <div className="city-search-row">
        <label className="catalog-search">
          <Search size={19}/>
          <input aria-label="ابحث في دليل إسكندريلا" placeholder="دور بالاسم أو المنطقة…" value={q} onChange={e=>setQ(e.target.value)}/>
        </label>
        <select aria-label="فلتر المنطقة" value={region} onChange={e=>setRegion(e.target.value)}>
          <option value="all">كل المناطق</option>
          {[...new Set(items.map(i=>i.region))].filter(Boolean).map(r=><option key={r}>{r}</option>)}
        </select>
      </div>

      {error&&<div className="warning" role="alert">{error}</div>}

      {loading&&items.length===0?(
        <div className="city-content-grid">
          {[1,2,3].map(i=><div key={i} className="skeleton city-loading"/>)}
        </div>
      ):filtered.length?(
        <div className="city-content-grid">
          {filtered.map(i=>{
            const cardCover=safeCover(i.imageUrl)||safeCover(i.innerImageUrl)||(tab==='city-news'?magazineCover:null);
            return (
              <button key={i.id} className="card city-content-card" onClick={()=>setSelected(i)}>
                {cardCover&&<img className="city-card-cover" src={cardCover} alt={i.name} loading="lazy"/>}
                <div>
                  <small>{categories[i.category]||i.category||i.region}</small>
                  <h3>{i.name}</h3>
                  {i.startsAt&&<small className="event-label">{eventStatus(i)} · {formatCityDate(i.startsAt)}</small>}
                  {i.publishedDate&&<small>{formatCityDate(i.publishedDate)}</small>}
                  <p>{i.summary}</p>
                  <span><MapPin size={15}/>{i.region}</span>
                </div>
              </button>
            );
          })}
        </div>
      ):(
        <div className="card city-empty">
          <Compass size={42}/>
          <h2>{items.length?'مفيش نتيجة بالبحث ده':'بنجهز دليل يستاهل إسكندرية'}</h2>
          <p>{items.length?'جرّب اسم أو منطقة تانية.':'مفيش محتوى منشور في القسم ده لسه. المحتوى بيظهر بعد إضافته ومراجعته من لوحة التحكم.'}</p>
          <button className="secondary" onClick={()=>navigate('home')}>اكتشف قسم المواصلات <ArrowLeft size={17}/></button>
        </div>
      )}

      {selected&&(
        <div className="modal-overlay" onClick={()=>setSelected(null)}>
          <article className="modal card city-item-modal" role="dialog" aria-modal="true" aria-label="تفاصيل دليل إسكندريلا" onClick={e=>e.stopPropagation()}>
            <button className="close icon-button" aria-label="إغلاق التفاصيل" onClick={()=>setSelected(null)}><X/></button>
            {selectedInnerCover&&(
              <img className="city-modal-cover" src={selectedInnerCover} alt={selected.name}/>
            )}
            <span className="eyebrow">{selected.category||selected.region}</span>
            <h2>{selected.name}</h2>
            <p>{selected.summary}</p>
            {selectedOuterCover&&selectedInnerCover&&selectedOuterCover!==selectedInnerCover&&(
              <div className="city-inner-cover-gallery">
                <img src={selectedOuterCover} alt={`${selected.name} — غلاف الخبر`}/>
              </div>
            )}
            <div className="source-stamp">
              {selected.sourceName&&<b>{selected.sourceName}</b>}
              {selected.reviewedAt&&<span>مراجعة المصدر: {formatCityDate(selected.reviewedAt)} · محتوى تحريري محفوظ</span>}
              {selected.startsAt&&<span>حالة الموعد: {eventStatus(selected)} — بتوقيت إسكندرية</span>}
              {selected.publishedDate&&<span>نشر المصدر: {formatCityDate(selected.publishedDate)}</span>}
            </div>
            {['body','address','venue','openingHours','priceNote','startsAt','endsAt'].filter(k=>selected[k]).map(k=>(
              <div className="city-detail-block" key={k}>
                <b>{({body:'التفاصيل والمقال الكامل',address:'العنوان',venue:'مكان الفعالية',openingHours:'مواعيد العمل',priceNote:'الأسعار',startsAt:'البداية',endsAt:'النهاية'} as any)[k]}</b>
                <p>{['startsAt','endsAt'].includes(k)?formatCityDate(selected[k]):selected[k]}</p>
              </div>
            ))}
            {selected.phone&&<p><Phone size={16}/> <bdi>{selected.phone}</bdi></p>}
            <div className="city-detail-links">
              {['sourceUrl','website','bookingUrl'].filter(k=>safeUrl(selected[k])).map(k=>(
                <a className="secondary" key={k} href={selected[k]} target="_blank" rel="noreferrer">
                  {k==='sourceUrl'?'المصدر':k==='website'?'الموقع':'تفاصيل الحجز'}
                  <ExternalLink size={15}/>
                </a>
              ))}
              <button className="secondary" onClick={()=>save(`إسكندريلا: ${selected.name}`)}><Heart size={16}/> حفظ</button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
