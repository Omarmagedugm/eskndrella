import {useEffect, useState} from 'react';
import {ArrowLeft, BookOpen, CalendarDays, Coffee, ExternalLink, Heart, Landmark, MapPin, Search, UsersRound, Wallet} from 'lucide-react';
import BeachUmbrella from './BeachUmbrellaIcon';
import {formatCityDate} from './cityContent';
import {safeCover} from './coverImage';
import {subscribePublic, firebaseReady} from './firebase';
import {admissionFee, filterOutings, outingCatalog, type OutingCategory, type TicketType} from './outingCatalog';
import './outings.css';

const themes = [
  {id:'budget', title:'على قد جيبك', description:'قارن رسوم الدخول المعلنة', icon:Wallet},
  {id:'family', title:'مع العيلة', description:'علوم وعروض للأطفال', icon:UsersRound},
  {id:'students', title:'للطلاب', description:'مكتبات وثقافة وتذاكر طلبة', icon:BookOpen},
  {id:'culture', title:'ثقافة وحكايات', description:'متاحف ومعالم من قلب المدينة', icon:Landmark},
] as const;
const kinds = {culture:'ثقافة ومعالم', food:'أكل وقعدة', events:'فعالية'};
const money = (value:number) => value.toLocaleString('ar-EG');

export default function Outings({navigate,save}:{navigate:(id:string)=>void;save:(value:string)=>void}) {
  const [category,setCategory] = useState<OutingCategory>('all');
  const [query,setQuery] = useState('');
  const [region,setRegion] = useState('all');
  const [maxFee,setMaxFee] = useState('all');
  const [ticket,setTicket] = useState<TicketType>('adult');
  const [people,setPeople] = useState('1');
  const [remoteOutings,setRemoteOutings] = useState<any[]>([]);
  useEffect(()=>{
    if(!firebaseReady)return;
    return subscribePublic('city_outings', setRemoteOutings);
  },[]);
  const items = outingCatalog(remoteOutings);
  const filtered = filterOutings(items,{category,query,region,ticket,maxFee:maxFee==='all'?null:Number(maxFee)});
  const groupSize = Math.min(12,Math.max(1,Math.floor(Number(people)||1)));

  function chooseCategory(next:OutingCategory) {
    setCategory(next);
    setMaxFee(next==='budget'?'100':'all');
    setTicket(next==='students'?'student':'adult');
  }

  return <section className="outings-page" aria-labelledby="outings-title">
    <div className="outings-hero">
      <div><span className="city-kicker">غيّر جو، واكتشف حتة جديدة</span><h1 id="outings-title">يلا نخرج<span>؟</span></h1>
        <p>خروجة على قد جيبك، يوم مع العيلة، أو قعدة على مزاجك.<br/>اختار اللي يناسبك وسيب الباقي للدليل.</p>
        <button className="text-button" onClick={()=>navigate('city-places')}>كل الأماكن والمعالم <ArrowLeft size={16}/></button>
      </div><div className="outings-hero-mark" aria-hidden="true"><BeachUmbrella size={84}/><span>إسكندرية تستاهل لفة</span><b>〰〰</b></div>
    </div>
    <div className="outing-themes" aria-label="نوع الخروجة">
      {themes.map(theme=><button key={theme.id} aria-pressed={category===theme.id} className={'outing-theme '+(category===theme.id?'selected':'')} onClick={()=>chooseCategory(theme.id)}>
        <theme.icon size={25}/><strong>{theme.title}</strong><small>{theme.description}</small>
      </button>)}
    </div>
    <div className="filter-row outing-kind-tabs" aria-label="تصفية الخروجات">
      <button aria-pressed={category==='all'} className={category==='all'?'active':''} onClick={()=>chooseCategory('all')}>كل الخروجات</button>
      <button aria-pressed={category==='food'} className={category==='food'?'active':''} onClick={()=>chooseCategory('food')}><Coffee size={16}/> أكل وقعدة</button>
      <button aria-pressed={category==='events'} className={category==='events'?'active':''} onClick={()=>chooseCategory('events')}><CalendarDays size={16}/> فعاليات وخروجات</button>
    </div>
    <div className="outing-filters card">
      <label className="catalog-search"><Search size={18}/><input aria-label="ابحث عن خروجة" placeholder="مكان، خروجة، أو منطقة…" value={query} onChange={event=>setQuery(event.target.value)}/></label>
      <div className="outing-filter-fields">
        <label>المنطقة<select value={region} onChange={event=>setRegion(event.target.value)}><option value="all">كل المناطق</option>{[...new Set(items.map(item=>item.region))].map(name=><option key={name}>{name}</option>)}</select></label>
        <label>رسوم الدخول للفرد<select value={maxFee} onChange={event=>setMaxFee(event.target.value)}><option value="all">كل الأسعار، ومنها غير المحدد</option><option value="50">حتى ٥٠ جنيه</option><option value="100">حتى ١٠٠ جنيه</option><option value="200">حتى ٢٠٠ جنيه</option></select></label>
        <label>نوع التذكرة<select value={ticket} onChange={event=>setTicket(event.target.value as TicketType)}><option value="adult">كبار — مصريون</option><option value="student">طلبة — مصريون</option></select></label>
        <label>عدد الأفراد<input type="number" min="1" max="12" step="1" value={people} onChange={event=>setPeople(event.target.value)} onBlur={()=>setPeople(String(groupSize))}/></label>
      </div>
      <p>مقارنة رسوم الدخول المذكورة في المصادر فقط؛ الأكل والمواصلات والمصاريف الإضافية تتحسب لوحدها. السعر غير المحدد مش معناه دخول مجاني.</p>
    </div>
    <div className="section-heading outing-results-heading"><div><span className="eyebrow">فسحتك تبدأ باختيار</span><h2>اختيارات لخروجتك</h2></div><span role="status">{money(filtered.length)} اختيار</span></div>
    <div className="outing-results">
      {filtered.map(item=>{
        const fee = admissionFee(item,ticket);
        const studentPrice = ticket==='student' && item.profile.student!==undefined;
        const outerImg = safeCover(item.imageUrl) || safeCover(item.innerImageUrl);
        const innerImg = safeCover(item.innerImageUrl) || safeCover(item.imageUrl);
        return <article className="card outing-card" key={item.id}>
          {outerImg && <img className="city-card-cover" src={outerImg} alt={item.name} loading="lazy" style={{borderRadius:12,marginBottom:12}}/>}
          <div className={'outing-card-type '+item.profile.kind}>{item.profile.kind==='food'?<Coffee size={21}/>:item.profile.kind==='events'?<CalendarDays size={21}/>:<Landmark size={21}/>}<span>{kinds[item.profile.kind]}</span></div>
          <h3>{item.name}</h3><p className="outing-summary">{item.summary}</p>
          <span className="outing-region"><MapPin size={15}/>{item.region}</span>
          {item.startsAt&&<p className="outing-date"><CalendarDays size={15}/>{formatCityDate(item.startsAt)}</p>}
          <div className="outing-price"><strong>{fee===null?'السعر غير محدد':`${money(fee)} جنيه`}</strong><small>{fee===null?'راجع المكان للسعر الحالي':studentPrice?'تذكرة طالب حسب المصدر':item.profile.kind==='events'?'تذكرة الفعالية حسب المصدر':'تذكرة كبار مصريين حسب المصدر'}</small>
            {fee!==null&&groupSize>1&&<span>{money(fee*groupSize)} جنيه رسوم دخول لـ{money(groupSize)} أفراد من نفس فئة التذكرة</span>}
            {ticket==='student'&&fee!==null&&!studentPrice&&<small>السعر المعروض للكبار؛ خصم الطلبة غير محدد في الدليل.</small>}
          </div>
          <details className="outing-details"><summary>التفاصيل والمصدر</summary>
            {innerImg && <img className="city-modal-cover" src={innerImg} alt={item.name} loading="lazy" style={{marginTop:10}}/>}
            {item.openingHours&&<p><b>المواعيد:</b> {item.openingHours}</p>}{item.priceNote&&<p>{item.priceNote}</p>}{item.venue&&<p>{item.venue}</p>}{item.address&&<p>{item.address}</p>}
            <p>{item.sourceName}<br/>مراجعة المصدر: {formatCityDate(item.reviewedAt)}. تأكد من المواعيد والسعر وشروط الدخول قبل الزيارة.</p>
            {item.sourceUrl&&<a href={item.sourceUrl} target="_blank" rel="noreferrer">افتح المصدر <ExternalLink size={14}/></a>}
          </details>
          <button className="secondary outing-save" onClick={()=>save(`خروجة: ${item.name}`)}><Heart size={16}/> حفظ الخروجة</button>
        </article>;
      })}
    </div>
    {!filtered.length&&<div className="card city-empty"><BeachUmbrella size={38}/><h2>نوسّع الاختيارات شوية؟</h2><p>مفيش خروجة بالمواصفات دي في الدليل الحالي. جرّب منطقة تانية أو اعرض كل الأسعار.</p><button className="secondary" onClick={()=>{chooseCategory('all');setRegion('all');setQuery('')}}>اعرض كل الخروجات</button></div>}
  </section>;
}
