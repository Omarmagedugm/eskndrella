import {ArrowUpLeft,Bookmark} from 'lucide-react';
import {formatCityDate} from './cityContent';
import {articleImage,articleSaved,readingMinutes,type Article} from './editorialModel';
import {routeHref} from './navigation';
export function ArticleCard({article,index=0,navigate,save,saved=[],compact=false}:{article:Article;index?:number;navigate:(route:string)=>void;save?:(key:string)=>void;saved?:string[];compact?:boolean}){
  const image=articleImage(article);
  return <article className={`ed-card ${compact?'ed-card-compact':''}`}>
    <a className={`ed-card-art ed-art-${index%4}`} href={routeHref('news:'+article.id)} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();navigate('news:'+article.id);}}} tabIndex={-1} aria-hidden="true">
      {image?<img src={image} alt="" loading="lazy" width="800" height="560"/>:<><span className="ed-art-category">{article.category||'من المدينة'}</span><span className="ed-art-title">{article.name}</span><span className="ed-art-mark" lang="en">Eskendrella / Journal</span></>}
    </a>
    <div className="ed-card-content"><div className="ed-meta"><span>{article.category||'أخبار المدينة'}</span><span>{readingMinutes(article.body||article.summary).toLocaleString('ar-EG')} د قراءة</span></div>
      <h3><a href={routeHref('news:'+article.id)} onClick={e=>{if(!e.ctrlKey&&!e.metaKey){e.preventDefault();navigate('news:'+article.id);}}}>{article.name}</a></h3>
      {!compact&&<p>{article.summary}</p>}
      <div className="ed-card-bottom"><span>{article.publishedDate?formatCityDate(article.publishedDate):article.region}</span>{save?<button className="icon-button" aria-label={`${articleSaved(article,saved)?'إلغاء حفظ':'حفظ'}: ${article.name}`} aria-pressed={articleSaved(article,saved)} onClick={()=>save(`article:${article.id}`)}><Bookmark size={18} fill={articleSaved(article,saved)?'currentColor':'none'}/></button>:<ArrowUpLeft size={18}/>}</div>
    </div>
  </article>;
}
