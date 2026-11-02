import {useState,lazy,Suspense} from 'react';
const AreaMap=lazy(()=>import('./Map')); 
import {MapPin,Navigation,BusFront,Bookmark,Search,ChevronDown,FileText,Route,ExternalLink} from 'lucide-react';
import {rideGuides,guideSegment,guideFare,sourceImage,type RideGuide} from './rideGuide';
import {normalize,modes,places} from './data';

type ExtendedGuide = RideGuide & { customFare?: number | null; isVerifiedAdmin?: boolean };

function mergeGuides(liveLines?: any[]): ExtendedGuide[] {
 const mergedMap = new Map<string, ExtendedGuide>();
 for (const g of rideGuides) {
  mergedMap.set(g.id, { ...g });
 }
 if (Array.isArray(liveLines)) {
  for (const l of liveLines) {
   const existing = mergedMap.get(l.id);
   const stops = Array.isArray(l.stops) && l.stops.length > 0
    ? l.stops
    : existing?.stops || [l.origin, l.destination].filter(Boolean);
   mergedMap.set(l.id, {
    id: l.id,
    name: l.name || existing?.name || '',
    mode: l.mode || existing?.mode || 'micro',
    stops,
    board: l.boarding || existing?.board || '',
    exit: l.exit || existing?.exit || '',
    fareLabel: existing?.fareLabel,
    customFare: typeof l.fare === 'number' ? l.fare : null,
    status: (l.status as any) || existing?.status || 'active',
    provenance: 'user_supplied',
    routingEligible: false,
    isVerifiedAdmin: true,
   });
  }
 }
 return Array.from(mergedMap.values());
}

export function RideDetail({guide,from,to,save}:{guide:ExtendedGuide;from?:string;to?:string;save:(s:string)=>void}){
 const [stop,setStop]=useState(''),[showMap,setShowMap]=useState(false);const segment=guideSegment(guide,from,to);if(!segment)return null;const fare=guideFare(guide);
 const displayedFare = guide.customFare != null ? guide.customFare : (fare && segment.full ? fare.fareEGP : null);
 return <article className="ride-detail"><div className="ride-heading"><span className="ride-mode"><BusFront size={22}/></span><div><small>{modes.find(m=>m.id===guide.mode)?.name} • {guide.isVerifiedAdmin?'محدث من لوحة التحكم':'وصف مرسل للمراجعة'}</small><h3>{guide.name}</h3></div></div>
 {!guide.isVerifiedAdmin&&<div className="ride-warning">المصدر: وصف الركوب المرسل لصاحب الدليل. مكان الوقوف وخط السير وحالة التشغيل لسه مش متحقق منهم ميدانيًا.</div>}
 <div className="ride-metrics"><div><small>الأجرة للمشوار ده</small><b>{displayedFare!=null?`${displayedFare} جنيه`:'الأجرة غير مؤكدة'}</b><small>{guide.customFare!=null?'سعر محدث من إدارة إسكندريلا':fare&&segment.full?'حسب جدول مارس ٢٠٢٦':'مش بنحسبها بنسبة من طول الخط'}</small></div><div><small>الوقت والمشي</small><b>{guide.isVerifiedAdmin?'خط نشط ومعتمد':'محتاجين بيانات مؤكدة'}</b><small>{guide.isVerifiedAdmin?`${guide.stops.length} محطات على المسار`:'مفيش توقيت مباشر أو مسار مشاة معتمد'}</small></div></div>
 {!segment.forward&&<p className="ride-warning">إنت اخترت الاتجاه العكسي. ترتيب المناطق معكوس للعرض، لكن مسار العودة ونقط التحميل مش متأكدين.</p>}
 <div className="ride-point board"><MapPin size={23}/><div><h4>هتركب منين في {segment.stops[0]}؟</h4><p>{segment.board||guide.board||'نقطة ركوب الخط في الاتجاه ده لسه محتاجة تأكيد. اسم المنطقة لوحده مش موقف.'}</p><small>الاتجاه المطلوب: {segment.stops.at(-1)}</small></div></div>
 <div className="ride-path"><h4><Route size={18}/> خط السير والمحطات</h4><ol>{segment.stops.map((s,i)=><li key={i}><span className="stop-dot"/><button onClick={()=>setStop(stop===s?'':s)}>{s}<small>{i===0?'بداية الجزء المختار':i===segment.stops.length-1?'نهاية الجزء المختار':'محطة مرور'}</small></button></li>)}</ol></div>
 {stop&&<div className="stop-context"><h4>تفاصيل {stop}</h4><p>{stop===segment.stops[0]?segment.board||guide.board||'مكان التحميل محتاج تأكيد':stop===segment.stops.at(-1)?segment.exit||guide.exit||'مكان النزول محتاج تأكيد':'يمر الخط بهذه المنطقة/المحطة ضمن مساره.'}</p><a className="text-button" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop+'، الإسكندرية، مصر')}`}>افتح بحث المنطقة على الخريطة <ExternalLink size={15}/></a><small>بحث خارجي عن المنطقة على خرائط جوجل.</small></div>}
 <div className="ride-point exit"><Navigation size={23}/><div><h4>هتنزل فين في {segment.stops.at(-1)}؟</h4><p>{segment.exit||guide.exit||'نقطة النزول للجزء ده لسه محتاجة تأكيد، وكمان طريق المشي لوجهتك النهائية.'}</p></div></div>
 {fare&&<a className="ride-source" href={sourceImage(fare.sourceId)} target="_blank" rel="noreferrer"><FileText size={18}/><span>صورة تعريفة {fare.label}<small>{fare.fareEGP} جنيه للوجهتين المكتوبتين • مارس ٢٠٢٦{!segment.full?' • لا تثبت أجرة الجزء المختار':''}</small></span><ExternalLink size={16}/></a>}
 <button className="secondary" onClick={()=>setShowMap(!showMap)}><MapPin size={16}/>{showMap?"إخفاء خريطة المناطق":"شوف مناطق الرحلة على الخريطة"}</button>{showMap&&<div className="ride-map"><Suspense fallback={<p>بنجهز الخريطة…</p>}><AreaMap overview={segment.stops.join("|")} onStop={id=>setStop(places.find(p=>p.id===id)?.name||"")}/></Suspense></div>}<button className="secondary" onClick={()=>save(`دليل قيد المراجعة: ${segment.stops[0]} ← ${segment.stops.at(-1)} (${guide.name})`)}><Bookmark size={16}/> حفظ وصف الرحلة</button></article>
}

export function JourneyGuides({from,to,save,liveLines}:{from:string;to:string;save:(s:string)=>void;liveLines?:any[]}){
 const allGuides = mergeGuides(liveLines);
 const matches = (!from.trim()||!to.trim()||normalize(from)===normalize(to))
  ? []
  : allGuides.filter(g=>(g.status==='unknown'||(g.status as string)==='active')&&g.stops.some(s=>normalize(s)===normalize(from))&&g.stops.some(s=>normalize(s)===normalize(to)));
 const [selected,setSelected]=useState('');if(!matches.length)return null;const current=matches.find(g=>g.id===selected)||matches[0];
 return <section className="journey-guides"><div className="section-heading"><div><span className="eyebrow">تفاصيل الركوب وخط السير</span><h2>أوصاف متاحة للمشوار ده</h2></div><span className="outline-tag">{current.isVerifiedAdmin?'محدث من الإدارة':'قيد المراجعة'}</span></div><p>تفاصيل أماكن الركوب والنزول والأجرة والمحطات المتاحة للمشوار المختار.</p><div className="guide-options">{matches.map(g=><button key={g.id} className={current.id===g.id?'active':''} onClick={()=>setSelected(g.id)}><BusFront size={18}/>{g.name}</button>)}</div><RideDetail key={current.id+from+to} guide={current} from={from} to={to} save={save}/></section>
}

export default function GuideDirectory({save,liveLines}:{save:(s:string)=>void;liveLines?:any[]}){
 const allGuides = mergeGuides(liveLines);
 const [q,setQ]=useState(''),[mode,setMode]=useState('all'),[selected,setSelected]=useState('');
 const list=allGuides.filter(g=>(mode==='all'||g.mode===mode)&&normalize([g.name,g.board,g.exit,...g.stops].join(' ')).includes(normalize(q)));
 return <section className="guide-directory"><div className="section-heading"><div><span className="eyebrow">الركوب والنزول، مش السعر بس</span><h2>دليل الخطوط بالتفصيل</h2></div><span className="outline-tag">{allGuides.length} خط ووصف</span></div><p>افتح الخط وشوف أماكن الركوب والنزول وترتيب المحطات وسعر الأجرة.</p><div className="catalog-search"><Search size={18}/><input aria-label="ابحث في تفاصيل الخطوط" placeholder="اسم خط، منطقة، أو محطة…" value={q} onChange={e=>setQ(e.target.value)}/></div><div className="filter-row"><button className={mode==='all'?'active':''} onClick={()=>setMode('all')}>كل الوسائل</button>{modes.map(m=><button key={m.id} className={mode===m.id?'active':''} onClick={()=>setMode(m.id)}>{m.name}</button>)}</div><div className="guide-list">{list.map(g=><div className="card guide-item" key={g.id}><button className="guide-toggle" aria-expanded={selected===g.id} onClick={()=>setSelected(selected===g.id?'':g.id)}><BusFront size={23}/><span><b>{g.name}</b><small>{g.stops.length} محطات • {g.customFare!=null?`${g.customFare} جنيه • `:''}{(g.status as string)==='active'?'شغال':g.status==='construction'?'تحت الإنشاء':g.status==='development'?'تحت التطوير':'حالة التشغيل محتاجة تأكيد'}</small></span><ChevronDown size={20}/></button>{selected===g.id&&<RideDetail guide={g} save={save}/>}</div>)}</div>{!list.length&&<div className="empty">مفيش وصف بالبحث ده. تقدر تراجع جداول الأسعار تحت.</div>}</section>
}
