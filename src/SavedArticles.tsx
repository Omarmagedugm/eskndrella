import {Bookmark,ArrowLeft,X} from 'lucide-react';
import {useMagazine} from './useMagazine';
import {routeHref} from './navigation';
export default function SavedArticles({saved,save,navigate}:{saved:string[];save:(key:string)=>void;navigate:(route:string)=>void}){
 const {articles,loading}=useMagazine();const keys=saved.filter(key=>key.startsWith('article:'));
 if(!keys.length)return null;
 return <section className="card saved-articles"><h2>مقالات للقراءة لاحقًا</h2>{keys.map(key=>{const article=articles.find(item=>item.id===key.slice(8));return <div className="saved-row" key={key}><Bookmark/><div><b>{article?.name||(loading?'جاري تحميل المقال…':'مقال محفوظ غير متاح حاليًا')}</b><a className="text-button" href={routeHref('news:'+key.slice(8))} onClick={e=>{e.preventDefault();navigate('news:'+key.slice(8));}}>افتح المقال <ArrowLeft size={15}/></a><small>محفوظ على هذا الجهاز</small></div><button className="icon-button" aria-label="إلغاء حفظ المقال" onClick={()=>save(key)}><X size={18}/></button></div>;})}</section>;
}
