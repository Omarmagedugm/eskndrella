import {useEffect,useState} from 'react';
import {firebaseReady,subscribePublic} from './firebase';
import {magazineArticles,type Article} from './editorialModel';
export function useMagazine(){
  const [articles,setArticles]=useState<Article[]>(()=>magazineArticles());
  const [loading,setLoading]=useState(firebaseReady);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!firebaseReady)return;
    return subscribePublic('city_news',items=>{setArticles(magazineArticles(items));setLoading(false);setError('');},()=>{setLoading(false);setError('تعذّر تحديث المحتوى. يمكنك قراءة النسخة التحريرية المحفوظة.');});
  },[]);
  return {articles,loading,error};
}
