import {useEffect,useState} from 'react';
import {ArrowLeft,CalendarDays,Check,Clock3,Dumbbell,ExternalLink,Heart,MapPin,Search,ShieldCheck,Trophy,UsersRound} from 'lucide-react';
import {formatCityDate} from './cityContent';
import {normalize} from './data';
import {clubGoogleSearchUrl,clubSavedKey,filterFixtures,filterSportsActivities,fixtureGoogleSearchUrl,fixtureSavedKey,fixtureState,formatKickoff,formatSportsDay,sportNames,sportsContent,sportsSnapshotStale,type Club,type MatchPeriod} from './sportsModel';
import './sports.css';

type Props={navigate:(id:string)=>void;save:(value:string)=>void;saved:string[]};
const stateLabels={listed:'مدرج بالجدول',today:'اليوم حسب الجدول',unconfirmed:'الموعد غير محسوم',postponed:'مؤجلة حسب المصدر',cancelled:'ملغاة حسب المصدر',awaiting_update:'الموعد المسجل مرّ · النتيجة تحتاج تحديثًا'};

function ClubMark({club}:{club:Club}) {
  return <span className="sports-club-mark" style={{color:club.color,background:club.color+'15'}} aria-hidden="true"><ShieldCheck size={23}/></span>;
}
function SourceLinks({ids}:{ids:string[]}) {
  return <ul className="sports-source-links">{ids.map(id=>{
    const source=sportsContent.sources.find(item=>item.id===id);
    return source?<li key={id}><a href={source.url} target="_blank" rel="noreferrer">{source.name}<ExternalLink size={13}/></a></li>:null;
  })}</ul>;
}

export default function SportsHub({navigate,save,saved}:Props) {
  const [view,setView]=useState<'matches'|'activities'|'clubs'>('matches');
  const [club,setClub]=useState('all');
  const [period,setPeriod]=useState<MatchPeriod>('upcoming');
  const [query,setQuery]=useState('');
  const [sport,setSport]=useState('all');
  const [onlyFollowed,setOnlyFollowed]=useState(false);
  const [now,setNow]=useState(Date.now);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),60000);return()=>window.clearInterval(timer)},[]);
  const followed=sportsContent.clubs.filter(item=>saved.includes(clubSavedKey(item)));
  const fixtures=filterFixtures(sportsContent.fixtures,{club,period,query,followedClubIds:onlyFollowed?followed.map(item=>item.id):undefined},now);
  const activities=filterSportsActivities(sportsContent.activities,{club,sport,query},now);
  const clubs=sportsContent.clubs.filter(item=>(club==='all'||item.id===club)&&normalize([item.name,item.summary].join(' ')).includes(normalize(query)));
  const next=filterFixtures(sportsContent.fixtures,{club,period:'upcoming',query:'',followedClubIds:view==='matches'&&onlyFollowed?followed.map(item=>item.id):undefined},now).find(item=>item.date&&item.scheduleStatus==='listed');
  const selectedClub=sportsContent.clubs.find(item=>item.id===club);

  function changeView(nextView:typeof view){setView(nextView);setQuery('')}

  return <section className="sports-page" aria-labelledby="sports-title">
    <div className="sports-hero">
      <div className="sports-hero-copy"><span className="city-kicker"><Trophy size={16}/> شجّع فريقك، والعب لعبتك</span><h1 id="sports-title">رياضة <span>سكندرية.</span></h1><p>مواعيد أندية مدينتك، وأنشطة تخليك تتحرك.<br/>من المدرج للملعب، كلنا إسكندرانية.</p><div className="sports-summary"><span>{sportsContent.clubs.length.toLocaleString('ar-EG')} أندية</span><span>{sportsContent.fixtures.length.toLocaleString('ar-EG')} مواجهات محفوظة</span><span>{sportsContent.activities.length.toLocaleString('ar-EG')} أنشطة وفعاليات</span></div></div>
      <aside className="sports-next card" aria-label="أقرب موعد مدرج"><span className="eyebrow"><CalendarDays size={15}/> أقرب موعد مدرج {selectedClub?`لـ${selectedClub.shortName}`:''}</span>{next?<><h2>{next.home}<span>×</span>{next.away}</h2><p>{next.competition}</p><b>{formatSportsDay(next.date!)}</b><span className="sports-next-time"><Clock3 size={16}/>{formatKickoff(next.startsAt)}</span><small>المواعيد قابلة للتعديل · راجع المصدر</small></>:<><h2>نستنى موعد موثوق</h2><p>مفيش موعد قادم محسوم في البيانات المحفوظة لهذا الاختيار.</p></>}</aside>
    </div>
    <div className="sports-snapshot"><ShieldCheck size={18}/><p>مراجعة المصادر: <b>{formatCityDate(sportsContent.reviewedAt)}</b> · المواعيد الواضحة بتوقيت إسكندرية.<br/><span>{sportsSnapshotStale(now)?'النسخة المحفوظة تحتاج مراجعة أحدث. افتح المصدر لتأكيد أي موعد.':'دي نسخة مجمّعة من المصادر، مش متابعة مباشرة. الوقت أو الملعب غير الموضح يفضل بانتظار التأكيد.'}</span></p></div>
    <div className="sports-tabs" aria-label="أقسام رياضة سكندرية">{[{id:'matches',label:'المباريات',icon:CalendarDays},{id:'activities',label:'الأنشطة',icon:Dumbbell},{id:'clubs',label:'الأندية',icon:UsersRound}].map(item=><button key={item.id} className={view===item.id?'active':''} aria-pressed={view===item.id} onClick={()=>changeView(item.id as typeof view)}><item.icon size={18}/>{item.label}</button>)}</div>
    <div className="sports-filters card">
      <label className="catalog-search"><Search size={18}/><input aria-label="ابحث في رياضة سكندرية" placeholder={view==='matches'?'نادي، منافس، أو بطولة…':view==='activities'?'نشاط أو لعبة…':'اسم النادي…'} value={query} onChange={event=>setQuery(event.target.value)}/></label>
      <div className="sports-filter-fields">
        <div><label htmlFor="sports-club">النادي</label><select id="sports-club" value={club} onChange={event=>setClub(event.target.value)}><option value="all">كل الأندية</option>{sportsContent.clubs.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        {view==='matches'&&<div><label htmlFor="sports-period">المواعيد</label><select id="sports-period" value={period} onChange={event=>setPeriod(event.target.value as MatchPeriod)}><option value="upcoming">القادمة وبانتظار التأكيد</option><option value="today">اليوم</option><option value="week">السبعة أيام الجاية</option><option value="all">كل المواعيد المحفوظة</option></select></div>}
        {view==='activities'&&<div><label htmlFor="sports-activity-kind">اللعبة</label><select id="sports-activity-kind" value={sport} onChange={event=>setSport(event.target.value)}><option value="all">كل الألعاب</option>{[...new Set(sportsContent.activities.map(item=>item.sport))].map(id=><option key={id} value={id}>{sportNames[id]}</option>)}</select></div>}
      </div>
      {view==='matches'&&<label className="sports-followed-filter"><input type="checkbox" checked={onlyFollowed} onChange={event=>setOnlyFollowed(event.target.checked)}/> أنديتي المحفوظة فقط <span>({followed.length.toLocaleString('ar-EG')})</span></label>}
    </div>
    {view==='matches'&&<>
      <div className="section-heading sports-results-heading"><div><span className="eyebrow">أندية سكندرية، في بطولات مختلفة</span><h2>جدول المباريات</h2></div><span role="status">{fixtures.length.toLocaleString('ar-EG')} مواجهات</span></div><p className="content-note">التغطية الحالية لمواعيد كرة القدم. مواعيد باقي الألعاب تظهر لما يتوفر مصدر واضح، ومش بنستنتج نتيجة المباراة من مرور وقتها.</p>
      <div className="sports-match-grid">{fixtures.map(item=>{
        const state=fixtureState(item,now),key=fixtureSavedKey(item),isSaved=saved.includes(key);
        return <article className="card sports-match-card" key={item.id}>
          <div className="sports-match-top"><span>{item.competition}</span><span className={'sports-state '+state}>{stateLabels[state]}</span></div>
          <div className="sports-match-teams"><strong>{item.home}</strong><span>×</span><strong>{item.away}</strong></div>
          <div className="sports-match-date"><CalendarDays size={17}/><b>{item.date?formatSportsDay(item.date):'اليوم بانتظار التأكيد'}</b></div>
          <div className="sports-match-time"><Clock3 size={16}/><span>{formatKickoff(item.startsAt)}{item.startsAt?' · إسكندرية':''}</span></div>
          <div className="sports-match-venue"><MapPin size={15}/>{item.venue||'الملعب غير محدد في السجل'}</div>
          <details className="sports-details"><summary>مصادر الموعد وملاحظاته</summary><p>{item.note}</p><SourceLinks ids={item.sourceIds}/><small>مراجعة المصدر: {formatCityDate(sportsContent.reviewedAt)}. لا توجد أسعار تذاكر أو حجوزات مؤكدة هنا.</small></details>
          <div className="sports-match-actions"><button className="secondary sports-save" aria-pressed={isSaved} onClick={()=>save(key)}>{isSaved?<Check size={16}/>:<Heart size={16}/>} {isSaved?'المباراة محفوظة':'حفظ المباراة'}</button><a className="secondary sports-google" href={fixtureGoogleSearchUrl(item)} target="_blank" rel="noreferrer">راجع في جوجل <ExternalLink size={14}/></a></div>
        </article>;
      })}</div>
      {!fixtures.length&&<div className="card city-empty"><CalendarDays size={38}/><h2>مفيش موعد مطابق في النسخة المحفوظة</h2><p>ده مش معناه إن الفريق معندوش مباريات. غيّر الفترة أو راجع مصادر النادي للمستجدات.</p><button className="secondary" onClick={()=>{setQuery('');setOnlyFollowed(false);setView('clubs')}}>دليل الأندية ومصادرها <ArrowLeft size={16}/></button></div>}
    </>}
    {view==='activities'&&<>
      <div className="section-heading sports-results-heading"><div><span className="eyebrow">شارك، اتحرك، وجرّب لعبة</span><h2>أنشطة وفعاليات رياضية</h2></div><span role="status">{activities.length.toLocaleString('ar-EG')} أنشطة</span></div><p className="content-note">الفعالية المؤرخة مختلفة عن دليل النشاط. وجود لعبة بالنادي مش إعلان فتح اشتراك؛ راجع الجهة للرسوم والسن والمواعيد.</p>
      <div className="sports-activity-grid">{activities.map(item=>{
        const key=`نشاط رياضي: ${item.title}`,isSaved=saved.includes(key);
        return <article className="card sports-activity-card" key={item.id}><div className="sports-activity-label"><Dumbbell size={21}/><span>{sportNames[item.sport]}</span><small>{item.kind==='event'?'فعالية بتاريخ':'دليل نشاط'}</small></div><h3>{item.title}</h3><p>{item.summary}</p><span className="sports-activity-place"><MapPin size={15}/>{item.venue}</span>{item.date?<b className="sports-activity-date"><CalendarDays size={16}/>{formatSportsDay(item.date)} · الساعة عند المنظم</b>:<span className="sports-activity-date">المواعيد تُراجع مع النادي</span>}<p className="sports-access-note">{item.access}</p><details className="sports-details"><summary>المصدر وتاريخ المراجعة</summary><SourceLinks ids={item.sourceIds}/><small>مراجعة المصدر: {formatCityDate(sportsContent.reviewedAt)}</small></details><div className="sports-activity-actions">{item.actionUrl&&<a className="secondary" href={item.actionUrl} target="_blank" rel="noreferrer">بوابة الحجز <ExternalLink size={14}/></a>}<button className="secondary" aria-pressed={isSaved} onClick={()=>save(key)}>{isSaved?<Check size={16}/>:<Heart size={16}/>} {isSaved?'النشاط محفوظ':'حفظ النشاط'}</button></div></article>;
      })}</div>{!activities.length&&<div className="card city-empty"><Dumbbell size={38}/><h2>مفيش نشاط مطابق في الدليل الحالي</h2><p>جرّب لعبة أو نادي تاني. تفاصيل الاشتراك والمواعيد من إدارة كل نشاط.</p><button className="secondary" onClick={()=>{setClub('all');setSport('all');setQuery('')}}>كل الأنشطة</button></div>}
    </>}
    {view==='clubs'&&<>
      <div className="section-heading sports-results-heading"><div><span className="eyebrow">فريقك، ولعبتك، وناسك</span><h2>أندية إسكندرية</h2></div><span role="status">{clubs.length.toLocaleString('ar-EG')} أندية</span></div>
      <div className="sports-clubs-grid">{clubs.map(item=>{
        const isFollowed=saved.includes(clubSavedKey(item));
        return <article className="card sports-club-card" key={item.id}><div className="sports-club-heading"><ClubMark club={item}/><div><h3>{item.name}</h3><small>{item.region}</small></div></div><p>{item.summary}</p><div className="sports-club-games">{item.sports.map(id=><span key={id}>{sportNames[id]}</span>)}</div><SourceLinks ids={[item.sourceId,...(item.fixturesSourceId&&item.fixturesSourceId!==item.sourceId?[item.fixturesSourceId]:[])]}/><a className="sports-google-club" href={clubGoogleSearchUrl(item)} target="_blank" rel="noreferrer">مواعيده في جوجل <ExternalLink size={13}/></a><div className="sports-club-actions"><button className="secondary" aria-pressed={isFollowed} onClick={()=>save(clubSavedKey(item))}>{isFollowed?<Check size={16}/>:<Heart size={16}/>} {isFollowed?'النادي محفوظ':'حفظ النادي'}</button><button className="text-button" onClick={()=>{setClub(item.id);setPeriod('upcoming');setQuery('');setOnlyFollowed(false);setView('matches')}}>مواعيده <ArrowLeft size={15}/></button></div></article>;
      })}</div>{!clubs.length&&<div className="card city-empty"><UsersRound size={38}/><h2>جرّب اسم نادي تاني</h2><button className="secondary" onClick={()=>{setClub('all');setQuery('')}}>كل الأندية</button></div>}
    </>}
    <div className="sports-footer-link"><span>قبل وبعد الماتش، إسكندريلا معاك.</span><button className="text-button" onClick={()=>navigate('home')}>خطط مواصلاتك <ArrowLeft size={16}/></button><button className="text-button" onClick={()=>navigate('city-outings')}>كمّلها بخروجة <ArrowLeft size={16}/></button></div>
  </section>;
}
