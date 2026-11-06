import {useEffect} from 'react';
import {routeHref} from './navigation';
import {articleImage,type Article} from './editorialModel';
export function useArticleMetadata(article:Article|undefined,preview=false){
 useEffect(()=>{
  if(!article||preview)return;
  const changed:HTMLMetaElement[]=[];const oldValues=new Map<HTMLMetaElement,string>();
  const meta=(key:string,value:string,property=false)=>{let el=document.querySelector<HTMLMetaElement>(`meta[${property?'property':'name'}="${key}"]`);if(!el){el=document.createElement('meta');el.setAttribute(property?'property':'name',key);document.head.appendChild(el);changed.push(el);}else oldValues.set(el,el.content);el.content=value;};
  const url=new URL(routeHref('news:'+article.id),location.origin).href;const title=document.title;
  document.title=article.name+' | إسكندريلا';meta('description',article.summary);meta('og:title',article.name,true);meta('og:description',article.summary,true);meta('og:type','article',true);meta('og:url',url,true);meta('og:image',new URL(articleImage(article)||'/brand/magazine.jpeg',location.origin).href,true);
  const canonical=document.createElement('link');canonical.rel='canonical';canonical.href=url;document.head.appendChild(canonical);
  const data=document.createElement('script');data.type='application/ld+json';data.textContent=JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:article.name,description:article.summary,datePublished:article.publishedDate||undefined,dateModified:article.updatedDate||undefined,author:article.authorName?{'@type':'Person',name:article.authorName}:undefined,publisher:{'@type':'Organization',name:'إسكندريلا'},mainEntityOfPage:url});document.head.appendChild(data);
  return()=>{document.title=title;changed.forEach(el=>el.remove());oldValues.forEach((value,el)=>{el.content=value;});canonical.remove();data.remove();};
 },[article,preview]);
}
