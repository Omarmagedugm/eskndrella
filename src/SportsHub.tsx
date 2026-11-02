import {useEffect,useState} from 'react';
import {ArrowLeft,CalendarDays,Check,Clock3,Dumbbell,ExternalLink,Heart,MapPin,Search,ShieldCheck,Trophy,UsersRound} from 'lucide-react';
import {formatCityDate} from './cityContent';
import {safeCover} from './coverImage';
import {normalize} from './data';
import {subscribePublic,firebaseReady} from './firebase';
import {clubGoogleSearchUrl,clubSavedKey,filterFixtures,filterSportsActivities,fixtureGoogleSearchUrl,fixtureSavedKey,fixtureState,formatKickoff,formatSportsDay,sportNames,sportsContent,sportsSnapshotStale,type Club,type MatchPeriod} from './sportsModel';
import { ClubLogo, registerCustomClubLogos } from './clubLogos';
import './sports.css';

type Props={navigate:(id:string)=>void;save:(value:string)=>void;saved:string[]};
const stateLabels={listed:'مدرج بالجدول',today:'اليوم حسب الجدول',unconfirmed:'الموعد غير محسوم',postponed:'مؤجلة حسب المصدر',cancelled:'ملغاة حسب المصدر',awaiting_update:'الموعد المسجل مرّ · النتيجة تحتاج تحديثًا',finished:'انتهت (النتيجة مسجلة)',live:'مباشر الآن'};

function ClubMark({club}:{club:Club & {imageUrl?:string}}) {
  return <ClubLogo name={club.name} id={club.id} customUrl={club.imageUrl} size={44} />;
}
function SourceLinks({ids}:{ids:string[]}) {
  return <ul className="sports-source-links">{(ids||[]).map(id=>{
    const source=sportsContent.sources.find(item=>item.id===id);
    return source?<li key={id}><a href={source.url} target="_blank" rel="noreferrer">{source.name}<ExternalLink size={13}/></a></li>:null;
  })}</ul>;
}

function mergeRemote<T extends {id:string}>(defaults:T[], remote:any[]):T[] {
  const remoteIds = new Set(remote.map(r=>r.id));
  return [
    ...remote.filter(r=>r.published!==false && r.archived!==true),
    ...defaults.filter(d=>!remoteIds.has(d.id)),
  ];
}

export default function SportsHub({navigate,save,saved}:Props) {
  const [view,setView]=useState<'matches'|'activities'|'clubs'>('clubs');
  const [club,setClub]=useState('all');
  const [expandedClubId,setExpandedClubId]=useState<string|null>('ittihad');
  const [period,setPeriod]=useState<MatchPeriod>('upcoming');
  const [query,setQuery]=useState('');
  const [sport,setSport]=useState('all');
  const [onlyFollowed,setOnlyFollowed]=useState(false);
  const [now,setNow]=useState(Date.now);
  const [remoteClubs,setRemoteClubs]=useState<any[]>([]);
  const [remoteFixtures,setRemoteFixtures]=useState<any[]>([]);
  const [remoteActivities,setRemoteActivities]=useState<any[]>([]);
  useEffect(()=>{
    const timer=window.setInterval(()=>setNow(Date.now()),60000);
    let unsubClubs = () => {};
    let unsubFixtures = () => {};
    let unsubActivities = () => {};
    if(firebaseReady){
      unsubClubs = subscribePublic('sports_clubs', (data: any[]) => {
        setRemoteClubs(data);
        if (Array.isArray(data)) registerCustomClubLogos(data);
      });
      unsubFixtures = subscribePublic('sports_fixtures', setRemoteFixtures);
      unsubActivities = subscribePublic('sports_activities', setRemoteActivities);
    }
    return()=>{
      window.clearInterval(timer);
      unsubClubs();
      unsubFixtures();
      unsubActivities();
    };
  },[]);
  const allClubs=mergeRemote(sportsContent.clubs,remoteClubs.map(c=>({...c,sports:Array.isArray(c.sports)?c.sports:['football']})));
  const allFixtures=mergeRemote(sportsContent.fixtures,remoteFixtures.map(f=>({...f,name:f.name||`${f.home} × ${f.away}`,clubIds:Array.isArray(f.clubIds)?f.clubIds:[],sourceIds:Array.isArray(f.sourceIds)?f.sourceIds:[]})));
  const allActivities=mergeRemote(sportsContent.activities,remoteActivities.map(a=>({...a,title:a.title||a.name,sourceIds:Array.isArray(a.sourceIds)?a.sourceIds:[]})));
  const followed=allClubs.filter(item=>saved.includes(clubSavedKey(item)));
  const fixtures=filterFixtures(allFixtures,{club,period,query,followedClubIds:onlyFollowed?followed.map(item=>item.id):undefined},now);
  const activities=filterSportsActivities(allActivities,{club,sport,query},now);
  const clubs=allClubs.filter(item=>(club==='all'||item.id===club)&&normalize([item.name,item.summary].join(' ')).includes(normalize(query)));
  const next=filterFixtures(allFixtures,{club,period:'upcoming',query:'',followedClubIds:view==='matches'&&onlyFollowed?followed.map(item=>item.id):undefined},now).find(item=>item.date&&item.scheduleStatus==='listed');
  const selectedClub=allClubs.find(item=>item.id===club);
  const activeClubDetail=clubs.find(item=>item.id===expandedClubId)||clubs[0]||null;

  function changeView(nextView:typeof view){setView(nextView);setQuery('')}

  return <section className="sports-page" aria-labelledby="sports-title">
    <div className="sports-hero">
      <div className="sports-hero-copy"><span className="city-kicker"><Trophy size={16}/> شجّع فريقك، والعب لعبتك</span><h1 id="sports-title">رياضة <span>سكندرية.</span></h1><p>مواعيد أندية مدينتك، وأنشطة تخليك تتحرك.<br/>من المدرج للملعب، كلنا إسكندرانية.</p><div className="sports-summary"><span>{allClubs.length.toLocaleString('ar-EG')} أندية</span><span>{allFixtures.length.toLocaleString('ar-EG')} مواجهات محفوظة</span><span>{allActivities.length.toLocaleString('ar-EG')} أنشطة وفعاليات</span></div></div>
      <aside className="sports-next card" aria-label="أقرب موعد مدرج"><span className="eyebrow"><CalendarDays size={15}/> أقرب موعد مدرج {selectedClub?`لـ${selectedClub.shortName}`:''}</span>{next?<><h2>{next.home}<span>×</span>{next.away}</h2><p>{next.competition}</p><b>{formatSportsDay(next.date!)}</b><span className="sports-next-time"><Clock3 size={16}/>{formatKickoff(next.startsAt)}</span><small>المواعيد قابلة للتعديل · راجع المصدر</small></>:<><h2>نستنى موعد موثوق</h2><p>مفيش موعد قادم محسوم في البيانات المحفوظة لهذا الاختيار.</p></>}</aside>
    </div>
    <div className="sports-snapshot"><ShieldCheck size={18}/><p>مراجعة المصادر: <b>{formatCityDate(sportsContent.reviewedAt)}</b> · المواعيد الواضحة بتوقيت إسكندرية.<br/><span>{sportsSnapshotStale(now)?'النسخة المحفوظة تحتاج مراجعة أحدث. افتح المصدر لتأكيد أي موعد.':'دي نسخة مجمّعة من المصادر، مش متابعة مباشرة. الوقت أو الملعب غير الموضح يفضل بانتظار التأكيد.'}</span></p></div>
    <div className="sports-tabs" aria-label="أقسام رياضة سكندرية">{[{id:'clubs',label:'أندية إسكندرية',icon:UsersRound},{id:'matches',label:'المباريات',icon:CalendarDays},{id:'activities',label:'الأنشطة',icon:Dumbbell}].map(item=><button key={item.id} className={view===item.id?'active':''} aria-pressed={view===item.id} onClick={()=>changeView(item.id as typeof view)}><item.icon size={18}/>{item.label}</button>)}</div>
    <div className="sports-filters card">
      <label className="catalog-search"><Search size={18}/><input aria-label="ابحث في رياضة سكندرية" placeholder={view==='matches'?'نادي، منافس، أو بطولة…':view==='activities'?'نشاط أو لعبة…':'اسم النادي…'} value={query} onChange={event=>setQuery(event.target.value)}/></label>
      <div className="sports-filter-fields">
        <div><label htmlFor="sports-club">النادي</label><select id="sports-club" value={club} onChange={event=>setClub(event.target.value)}><option value="all">كل الأندية</option>{allClubs.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        {view==='matches'&&<div><label htmlFor="sports-period">المواعيد</label><select id="sports-period" value={period} onChange={event=>setPeriod(event.target.value as MatchPeriod)}><option value="upcoming">القادمة وبانتظار التأكيد</option><option value="finished">النتائج السابقة</option><option value="today">اليوم</option><option value="week">السبعة أيام الجاية</option><option value="all">كل المواعيد والنتائج</option></select></div>}
        {view==='activities'&&<div><label htmlFor="sports-activity-kind">اللعبة</label><select id="sports-activity-kind" value={sport} onChange={event=>setSport(event.target.value)}><option value="all">كل الألعاب</option>{[...new Set(allActivities.map(item=>item.sport))].map(id=><option key={id} value={id}>{sportNames[id]||id}</option>)}</select></div>}
      </div>
      {view==='matches'&&<label className="sports-followed-filter"><input type="checkbox" checked={onlyFollowed} onChange={event=>setOnlyFollowed(event.target.checked)}/> أنديتي المحفوظة فقط <span>({followed.length.toLocaleString('ar-EG')})</span></label>}
    </div>
    {view==='matches'&&<>
      <div className="section-heading sports-results-heading"><div><span className="eyebrow">أندية سكندرية، في بطولات مختلفة</span><h2>جدول المباريات</h2></div><span role="status">{fixtures.length.toLocaleString('ar-EG')} مواجهات</span></div><p className="content-note">التغطية الحالية لمواعيد كرة القدم. مواعيد باقي الألعاب تظهر لما يتوفر مصدر واضح، ومش بنستنتج نتيجة المباراة من مرور وقتها.</p>
      <div className="sports-match-grid">{fixtures.map(item=>{
        const state=fixtureState(item,now),key=fixtureSavedKey(item),isSaved=saved.includes(key);
        return <article className="card sports-match-card" key={item.id}>
          <div className="sports-match-top"><span>{item.competition}</span><span className={'sports-state '+state}>{stateLabels[state]}</span></div>
          <div className="sports-match-teams" style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:8}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,minWidth:0}}>
              <ClubLogo name={item.home} customUrl={item.homeLogo} size={24}/>
              <strong style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.home}</strong>
            </span>
            {typeof item.homeScore === 'number' && typeof item.awayScore === 'number' ? (
              <span style={{fontSize:16,fontWeight:900,color:'#1b7a42',padding:'2px 8px',background:'rgba(27,122,66,0.1)',borderRadius:8,whiteSpace:'nowrap'}}>
                {item.homeScore} - {item.awayScore}
              </span>
            ) : (
              <span style={{color:'var(--muted)',fontWeight:800}}>×</span>
            )}
            <span style={{display:'inline-flex',alignItems:'center',justifyContent:'flex-end',gap:6,minWidth:0}}>
              <strong style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.away}</strong>
              <ClubLogo name={item.away} customUrl={item.awayLogo} size={24}/>
            </span>
          </div>
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
      <div className="sports-activity-grid">{activities.map((item:any)=>{
        const key=`نشاط رياضي: ${item.title}`,isSaved=saved.includes(key);
        const img=safeCover(item.imageUrl);
        return <article className="card sports-activity-card" key={item.id}>{img&&<img className="city-card-cover" src={img} alt={item.title} loading="lazy" style={{borderRadius:12,marginBottom:12}}/>}<div className="sports-activity-label"><Dumbbell size={21}/><span>{sportNames[item.sport as keyof typeof sportNames]||item.sport}</span><small>{item.kind==='event'?'فعالية بتاريخ':'دليل نشاط'}</small></div><h3>{item.title}</h3><p>{item.summary}</p><span className="sports-activity-place"><MapPin size={15}/>{item.venue}</span>{item.date?<b className="sports-activity-date"><CalendarDays size={16}/>{formatSportsDay(item.date)} · الساعة عند المنظم</b>:<span className="sports-activity-date">المواعيد تُراجع مع النادي</span>}<p className="sports-access-note">{item.access}</p><details className="sports-details"><summary>المصدر وتاريخ المراجعة</summary><SourceLinks ids={item.sourceIds}/><small>مراجعة المصدر: {formatCityDate(sportsContent.reviewedAt)}</small></details><div className="sports-activity-actions">{item.actionUrl&&<a className="secondary" href={item.actionUrl} target="_blank" rel="noreferrer">بوابة الحجز <ExternalLink size={14}/></a>}<button className="secondary" aria-pressed={isSaved} onClick={()=>save(key)}>{isSaved?<Check size={16}/>:<Heart size={16}/>} {isSaved?'النشاط محفوظ':'حفظ النشاط'}</button></div></article>;
      })}</div>{!activities.length&&<div className="card city-empty"><Dumbbell size={38}/><h2>مفيش نشاط مطابق في الدليل الحالي</h2><p>جرّب لعبة أو نادي تاني. تفاصيل الاشتراك والمواعيد من إدارة كل نشاط.</p><button className="secondary" onClick={()=>{setClub('all');setSport('all');setQuery('')}}>كل الأنشطة</button></div>}
    </>}
    {view==='clubs'&&<>
      <div className="section-heading sports-results-heading"><div><span className="eyebrow">فريقك، ولعبتك، وناسك · اضغط على مربع النادي للتفاصيل</span><h2>أندية إسكندرية</h2></div><span role="status">{clubs.length.toLocaleString('ar-EG')} أندية</span></div>
      <div className="sports-clubs-widget-grid" role="list">
        {clubs.map((item:any)=>{
          const isFollowed=saved.includes(clubSavedKey(item));
          const isSelected=activeClubDetail?.id===item.id;
          const clubSports=(item.sports||[]).map((id:string)=>sportNames[id as keyof typeof sportNames]||id);
          return (
            <div
              key={item.id}
              role="listitem"
              className={`sports-club-tile ${isSelected?'selected':''}`}
              style={{'--club-accent':item.color||'#155570'} as any}
              onClick={()=>setExpandedClubId(item.id)}
            >
              <div className="sports-club-tile-top">
                <ClubMark club={item}/>
                <button
                  type="button"
                  className={`sports-tile-fav ${isFollowed?'active':''}`}
                  aria-label={isFollowed?`إلغاء حفظ ${item.name}`:`حفظ ${item.name}`}
                  aria-pressed={isFollowed}
                  onClick={e=>{e.stopPropagation();save(clubSavedKey(item));}}
                >
                  {isFollowed?<Check size={15}/>:<Heart size={15}/>}
                </button>
              </div>
              <div className="sports-club-tile-body">
                <strong>{item.name}</strong>
                <small><MapPin size={12}/> {item.region}</small>
              </div>
              <div className="sports-club-tile-tags">
                {clubSports.slice(0,2).map((label:string)=><span key={label}>{label}</span>)}
                {clubSports.length>2&&<span>+{clubSports.length-2}</span>}
              </div>
              <div className="sports-club-tile-foot">
                <button
                  type="button"
                  className="sports-tile-action"
                  onClick={e=>{
                    e.stopPropagation();
                    setClub(item.id);
                    setPeriod('upcoming');
                    setQuery('');
                    setOnlyFollowed(false);
                    setView('matches');
                  }}
                >
                  مواعيده <ArrowLeft size={13}/>
                </button>
                <span className="sports-tile-more">{isSelected?'معروض بالأسفل ↓':'التفاصيل'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {activeClubDetail&&(
        <article className="card sports-club-detail-card" aria-live="polite">
          <div className="sports-club-heading">
            <ClubMark club={activeClubDetail}/>
            <div>
              <h3>{activeClubDetail.name}</h3>
              <small>{activeClubDetail.region}</small>
            </div>
          </div>
          <p>{activeClubDetail.summary}</p>
          <div className="sports-club-games">
            {(activeClubDetail.sports||[]).map((id:string)=><span key={id}>{sportNames[id as keyof typeof sportNames]||id}</span>)}
          </div>
          <SourceLinks ids={[activeClubDetail.sourceId,...(activeClubDetail.fixturesSourceId&&activeClubDetail.fixturesSourceId!==activeClubDetail.sourceId?[activeClubDetail.fixturesSourceId]:[])]}/>
          <div className="sports-club-actions">
            <button
              className="primary"
              onClick={()=>{
                setClub(activeClubDetail.id);
                setPeriod('upcoming');
                setQuery('');
                setOnlyFollowed(false);
                setView('matches');
              }}
            >
              جدول مواعيد {activeClubDetail.shortName||activeClubDetail.name} <ArrowLeft size={15}/>
            </button>
            <button
              className="secondary"
              aria-pressed={saved.includes(clubSavedKey(activeClubDetail))}
              onClick={()=>save(clubSavedKey(activeClubDetail))}
            >
              {saved.includes(clubSavedKey(activeClubDetail))?<Check size={16}/>:<Heart size={16}/>}
              {saved.includes(clubSavedKey(activeClubDetail))?'النادي محفوظ':'حفظ النادي'}
            </button>
            <a className="secondary sports-google-club" href={clubGoogleSearchUrl(activeClubDetail)} target="_blank" rel="noreferrer">
              مواعيده في جوجل <ExternalLink size={14}/>
            </a>
          </div>
        </article>
      )}

      {!clubs.length&&<div className="card city-empty"><UsersRound size={38}/><h2>جرّب اسم نادي تاني</h2><button className="secondary" onClick={()=>{setClub('all');setQuery('')}}>كل الأندية</button></div>}
    </>}
    <div className="sports-footer-link"><span>قبل وبعد الماتش، إسكندريلا معاك.</span><button className="text-button" onClick={()=>navigate('home')}>خطط مواصلاتك <ArrowLeft size={16}/></button><button className="text-button" onClick={()=>navigate('city-outings')}>كمّلها بخروجة <ArrowLeft size={16}/></button></div>
  </section>;
}
