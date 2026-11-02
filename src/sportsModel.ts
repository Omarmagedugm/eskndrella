import data from './sportsContent.json';
import {CAIRO,cairoDay} from './liveData';
import {normalize} from './data';

export type Sport = 'football'|'basketball'|'volleyball'|'swimming'|'racket'|'fitness'|'running'|'multi';
export type SportsSource = {id:string;name:string;url:string;discoveredVia?:'google_search';publishedDate?:string};
export type Club = {id:string;name:string;shortName:string;color:string;region:string;sports:Sport[];summary:string;sourceId:string;fixturesSourceId:string|null};
export type Fixture = {id:string;clubIds:string[];home:string;away:string;sport:Sport;competition:string;date:string|null;startsAt:string|null;scheduleStatus:'listed'|'unconfirmed'|'postponed'|'cancelled';venue:string|null;sourceIds:string[];note:string};
export type Activity = {id:string;title:string;summary:string;clubId:string|null;sport:Sport;kind:'event'|'directory';date:string|null;venue:string;access:string;sourceIds:string[];actionUrl:string|null};
export type MatchPeriod = 'upcoming'|'today'|'week'|'all';
type SportsContent = {reviewedAt:string;timeZone:string;sources:SportsSource[];clubs:Club[];fixtures:Fixture[];activities:Activity[]};
export const sportsContent = data as SportsContent;
export const sportNames:Record<Sport,string> = {football:'كرة القدم',basketball:'كرة السلة',volleyball:'الكرة الطائرة',swimming:'السباحة',racket:'رياضات المضرب',fitness:'لياقة بدنية',running:'الجري',multi:'ألعاب متعددة'};

export function fixtureState(item:Fixture,now=Date.now()) {
  if(item.scheduleStatus==='cancelled')return 'cancelled';
  if(item.scheduleStatus==='postponed')return 'postponed';
  if(item.scheduleStatus==='unconfirmed'||!item.date)return 'unconfirmed';
  const today=cairoDay(new Date(now));
  if(item.date<today||(item.startsAt&&Date.parse(item.startsAt)<now))return 'awaiting_update';
  return item.date===today?'today':'listed';
}

export function filterFixtures(items:Fixture[],options:{club:string;period:MatchPeriod;query:string;followedClubIds?:string[]},now=Date.now()):Fixture[] {
  const today=cairoDay(new Date(now));
  const weekEnd=new Date(Date.parse(today+'T12:00:00Z')+6*86400000).toISOString().slice(0,10);
  const query=normalize(options.query);
  return items.filter(item=>{
    if(options.club!=='all'&&!item.clubIds.includes(options.club))return false;
    if(options.followedClubIds&&!item.clubIds.some(id=>options.followedClubIds!.includes(id)))return false;
    if(!normalize([item.home,item.away,item.competition].join(' ')).includes(query))return false;
    if(options.period==='all')return true;
    if(item.scheduleStatus==='cancelled')return false;
    if(options.period==='upcoming')return fixtureState(item,now)!=='awaiting_update';
    if(!item.date||item.scheduleStatus!=='listed')return false;
    return options.period==='today'?item.date===today:item.date>=today&&item.date<=weekEnd;
  }).sort((a,b)=>Number(a.scheduleStatus==='unconfirmed')-Number(b.scheduleStatus==='unconfirmed')||
    (a.date||'9999').localeCompare(b.date||'9999')||
    (a.startsAt?Date.parse(a.startsAt):Infinity)-(b.startsAt?Date.parse(b.startsAt):Infinity));
}

export function filterSportsActivities(items:Activity[],options:{club:string;sport:string;query:string},now=Date.now()):Activity[] {
  const today=cairoDay(new Date(now)),query=normalize(options.query);
  return items.filter(item=>(options.club==='all'||item.clubId===options.club)&&
    (options.sport==='all'||item.sport===options.sport)&&
    (!item.date||item.date>=today)&&normalize([item.title,item.summary,item.venue].join(' ')).includes(query));
}

export function formatSportsDay(date:string):string {
  return new Intl.DateTimeFormat('ar-EG',{timeZone:CAIRO,weekday:'short',day:'numeric',month:'long',year:'numeric'}).format(new Date(date+'T12:00:00Z'));
}
export function formatKickoff(value:string|null):string {
  return value?new Intl.DateTimeFormat('ar-EG',{timeZone:CAIRO,timeStyle:'short'}).format(new Date(value)):'الساعة بانتظار التأكيد';
}
export function sportsSnapshotStale(now=Date.now()):boolean {
  return now-Date.parse(sportsContent.reviewedAt+'T23:59:59+02:00')>3*86400000;
}
export const clubSavedKey=(club:Club)=>`نادي: ${club.name}`;
export const fixtureSavedKey=(fixture:Fixture)=>`مباراة: ${fixture.home} × ${fixture.away} — ${fixture.date||'الموعد بانتظار التأكيد'}`;

function googleSearchUrl(query:string):string {
  return 'https://www.google.com/search?'+new URLSearchParams({q:query,hl:'ar'}).toString();
}
export function fixtureGoogleSearchUrl(item:Fixture):string {
  return googleSearchUrl([item.home,item.away,item.competition,item.date,'موعد المباراة بتوقيت القاهرة'].filter(Boolean).join(' '));
}
export function clubGoogleSearchUrl(item:Club):string {
  return googleSearchUrl(`${item.name} مواعيد المباريات القادمة بتوقيت القاهرة`);
}
