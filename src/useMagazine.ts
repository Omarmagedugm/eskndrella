import {useEffect,useState} from 'react';
import {firebaseReady,subscribePublic} from './firebase';
import {magazineArticles,type Article} from './editorialModel';
export function useMagazine(){
  const [articles,setArticles]=useState<Article[]>(()=>magazineArticles());
  const [loading,setLoading]=useState(firebaseReady);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!firebaseReady)return;
    const timer=setTimeout(()=>{setLoading(false);setError('تحديث المحتوى يستغرق وقتًا أطول. نعرض النسخة المحفوظة.');},12000);
    const unsubscribe=subscribePublic('city_news',items=>{clearTimeout(timer);setArticles(magazineArticles(items));setLoading(false);setError('');},()=>{clearTimeout(timer);setLoading(false);setError('تعذّر تحديث المحتوى. يمكنك قراءة النسخة التحريرية المحفوظة.');});
    return()=>{clearTimeout(timer);unsubscribe();};
  },[]);
  return {articles,loading,error};
}
