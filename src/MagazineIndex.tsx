import {useEffect,useState} from 'react';
import {Search,ArrowLeft,SlidersHorizontal,X} from 'lucide-react';
import {useMagazine} from './useMagazine';
import {filterArticles,articleSaved} from './editorialModel';
import {ArticleCard} from './ArticleCard';
export default function MagazineIndex({route,navigate,save,saved}:{route:string;navigate:(s:string)=>void;save:(s:string)=>void;saved:string[]}){
  const {articles,loading,error}=useMagazine();
  const [query,setQuery]=useState('');const [category,setCategory]=useState('');const [region,setRegion]=useState('');const [sort,setSort]=useState('newest');
  useEffect(()=>{setQuery(route.startsWith('search:')?route.slice(7):'');setCategory(route.startsWith('category:')?route.slice(9):'');setRegion('');},[route]);
  const tag=route.startsWith('tag:')?route.slice(4):'';const author=route.startsWith('author:')?route.slice(7):'';const savedOnly=route==='magazine-saved';
  const all=savedOnly?articles.filter(item=>articleSaved(item,saved)):articles;
  const filtered=filterArticles(all,{query,category,region,tag,author,sort});
  const categories=[...new Set(articles.map(item=>item.category).filter(Boolean))] as string[];
  return <section className="ed-archive"><div className="ed-breadcrumb"><a href="/" onClick={e=>{e.preventDefault();navigate('city');}}>إسكندريلا</a><span>/</span><span>{savedOnly?'مكتبتي':'المجلة'}</span></div><div className="ed-archive-heading"><div><p className="ed-kicker">حكايات تستحق وقتك</p><h1>{savedOnly?'مكتبة قراءاتك':tag?'موضوع: '+tag:author?author:category||'دفتر إسكندرية'}</h1><p>{author?(articles.find(item=>item.authorName===author)?.authorBio||'المواد المنشورة لهذا الكاتب في إسكندريلا.'):savedOnly?'المقالات التي احتفظت بها على هذا الجهاز.':'أخبار وثقافة وحكايات من المدينة، بمصادرها وتواريخها.'}</p></div><span className="ed-archive-symbol" aria-hidden="true">إ.</span></div>
    <div className="ed-search-tools"><label className="ed-search-field"><Search size={20}/><input type="search" aria-label="ابحث في عنوان المقال أو نصه" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث في العناوين والنصوص والمناطق…"/>{query&&<button className="icon-button" onClick={()=>setQuery('')} aria-label="مسح البحث"><X size={17}/></button>}</label><label className="ed-sort"><span>الترتيب</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">الأحدث أولًا</option><option value="oldest">الأقدم أولًا</option></select></label></div>
    <div className="ed-filter-chips" aria-label="تصفية حسب القسم"><button className={!category?'active':''} aria-pressed={!category} onClick={()=>setCategory('')}>كل الأقسام</button>{categories.map(c=><button key={c} className={category===c?'active':''} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div>
    <div className="ed-results-line"><p role="status">{filtered.length.toLocaleString('ar-EG')} مادة{loading?' · جاري التحديث…':''}</p><details className="ed-region-filter"><summary><SlidersHorizontal size={16}/> المنطقة{region?' · '+region:''}</summary><label>اختر المنطقة<select aria-label="تصفية المقالات بالمنطقة" value={region} onChange={e=>setRegion(e.target.value)}><option value="">كل المناطق</option>{[...new Set(articles.map(item=>item.region))].map(r=><option key={r}>{r}</option>)}</select></label></details></div>
    {error&&<p className="ed-status" role="status">{error}</p>}
    {filtered.length?<div className="ed-archive-grid">{filtered.map((article,index)=><ArticleCard key={article.id} article={article} index={index} navigate={navigate} save={save} saved={saved}/>)}</div>:<div className="ed-empty"><Search size={32}/><h2>{savedOnly?'أول حكاية تنتظر مكانها هنا':'لم نجد مواد بهذا الاختيار'}</h2><p>{savedOnly?'اضغط علامة الحفظ بجوار أي مقال لتعود إليه لاحقًا.':'جرّب كلمة أقصر أو وسّع نطاق البحث.'}</p><button className="ed-button" onClick={()=>{setQuery('');setCategory('');setRegion('');if(tag||author||savedOnly)navigate('city-news');}}>تصفّح الموضوعات <ArrowLeft size={18}/></button></div>}
  </section>;
}
