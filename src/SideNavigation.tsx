import {useEffect,useRef} from 'react';
import {ArrowLeft, Bookmark, BusFront, CalendarDays, Coffee, Home, Map, MapPin, Newspaper, Store, Trophy, UserRound, X} from 'lucide-react';
import BeachUmbrella from './BeachUmbrellaIcon';
import './sideNavigation.css';

const groups = [
  {title:'اكتشف إسكندرية',links:[
    {id:'city',label:'الرئيسية',icon:Home},
    {id:'city-outings',label:'خروجات',icon:BeachUmbrella},
    {id:'city-sports',label:'رياضة سكندرية',icon:Trophy},
    {id:'city-places',label:'الأماكن والمعالم',icon:MapPin},
    {id:'city-news',label:'المجلة والأخبار',icon:Newspaper},
    {id:'city-events',label:'الفعاليات',icon:CalendarDays},
  ]},
  {title:'دليلك اليومي',links:[
    {id:'home',label:'خطط مواصلاتك',icon:BusFront},
    {id:'directory',label:'خطوط المواصلات والأسعار',icon:BusFront},
    {id:'map',label:'خريطة المواصلات',icon:Map},
    {id:'city-services',label:'الخدمات',icon:Store},
    {id:'city-businesses',label:'المحلات والمطاعم',icon:Coffee},
  ]},
  {title:'مساحتك',links:[
    {id:'saved',label:'المحفوظات',icon:Bookmark},
    {id:'profile',label:'حسابي',icon:UserRound},
  ]},
];

export default function SideNavigation({active,navigate,onClose}:{active:string;navigate:(id:string)=>void;onClose:()=>void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const element = dialog.current!;
    const overflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.showModal();
    document.body.style.overflow='hidden';
    return ()=>{element.close();document.body.style.overflow=overflow;if(previousFocus?.isConnected)previousFocus.focus()};
  },[]);

  return <dialog ref={dialog} id="app-side-navigation" className="side-navigation" aria-labelledby="side-navigation-title" dir="rtl"
    onCancel={event=>{event.preventDefault();onClose()}}
    onClick={event=>{const rect=event.currentTarget.getBoundingClientRect();if(event.target===event.currentTarget&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))onClose()}}>
    <div className="side-navigation-inner">
      <div className="side-navigation-header"><div><img src="/brand/eskendrella.png" alt=""/><span><strong id="side-navigation-title">إسكندريلا</strong><small>إسكندرية، على مزاجك</small></span></div><button className="icon-button" onClick={onClose} aria-label="إغلاق القائمة"><X size={22}/></button></div>
      <nav aria-label="أقسام التطبيق">{groups.map(group=><div className="side-navigation-group" key={group.title}><h2>{group.title}</h2>{group.links.map(link=><button key={link.id} aria-current={active===link.id?'page':undefined} className={active===link.id?'active':''} onClick={()=>{navigate(link.id);onClose()}}><link.icon size={20}/><span>{link.label}</span><ArrowLeft size={15}/></button>)}</div>)}</nav>
      <p className="side-navigation-footer">من قلب إسكندرية، لكل أهلها 〰</p>
    </div>
  </dialog>;
}
