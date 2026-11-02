import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cairoDay} from '../src/liveData.ts';
import {clubGoogleSearchUrl,filterFixtures,filterSportsActivities,fixtureGoogleSearchUrl,fixtureState,formatKickoff,sportsContent,sportsSnapshotStale} from '../src/sportsModel.ts';

const now=Date.parse('2026-11-02T12:00:00+02:00');
const options={club:'all',period:'upcoming' as const,query:''};

test('sports records have unique identities, valid club references and traceable HTTPS sources',()=>{
  const {clubs,sources,fixtures,activities}=sportsContent;
  assert.equal(clubs.length,7);assert.equal(fixtures.length,12);assert.equal(activities.length,9);
  for(const records of [clubs,sources,fixtures,activities])assert.equal(new Set(records.map(item=>item.id)).size,records.length);
  const sourceIds=new Set(sources.map(item=>item.id)),clubIds=new Set(clubs.map(item=>item.id));
  for(const source of sources)assert.equal(new URL(source.url).protocol,'https:');
  for(const club of clubs){assert.ok(sourceIds.has(club.sourceId));if(club.fixturesSourceId)assert.ok(sourceIds.has(club.fixturesSourceId))}
  for(const item of fixtures){assert.ok(item.sourceIds.length);assert.ok(item.sourceIds.every(id=>sourceIds.has(id)));assert.ok(item.clubIds.every(id=>clubIds.has(id)));assert.ok(!('score' in item));if(item.startsAt){assert.ok(/(Z|[+-]\d{2}:\d{2})$/.test(item.startsAt));assert.equal(cairoDay(new Date(item.startsAt)),item.date)}}
  for(const item of activities){assert.ok(item.sourceIds.every(id=>sourceIds.has(id)));if(item.clubId)assert.ok(clubIds.has(item.clubId))}
});

test('conflicting and date-only schedules never become invented kickoff times',()=>{
  const uncertain=sportsContent.fixtures.find(item=>item.id==='haras-dakhlia-unconfirmed')!;
  assert.equal(uncertain.date,null);assert.equal(uncertain.startsAt,null);assert.equal(fixtureState(uncertain,now),'unconfirmed');
  assert.equal(sportsContent.fixtures.find(item=>item.id==='smouha-bank-20261124')?.startsAt,null);
  assert.equal(formatKickoff(null),'الساعة بانتظار التأكيد');
  assert.ok(!filterFixtures(sportsContent.fixtures,{...options,period:'week'},now).includes(uncertain));
  assert.ok(filterFixtures(sportsContent.fixtures,options,now).includes(uncertain));
});

test('club and followed-club filters include each derby once',()=>{
  const filtered=filterFixtures(sportsContent.fixtures,{...options,club:'pharco'},now);
  assert.equal(filtered.filter(item=>item.id==='haras-pharco-20261127').length,1);
  assert.ok(filterFixtures(sportsContent.fixtures,{...options,followedClubIds:['haras','pharco']},now).every(item=>item.clubIds.includes('haras')||item.clubIds.includes('pharco')));
  assert.equal(filterFixtures(sportsContent.fixtures,{...options,followedClubIds:[]},now).length,0);
});

test('today and week use Alexandria dates, and elapsed time never implies a live or finished result',()=>{
  const cairoMidnight=Date.parse('2026-11-03T22:30:00Z');
  const today=filterFixtures(sportsContent.fixtures,{...options,period:'today'},cairoMidnight);
  assert.deepEqual(today.map(item=>item.id),['ghazl-ittihad-20261104']);
  assert.deepEqual(filterFixtures(sportsContent.fixtures,{...options,period:'week'},now).map(item=>item.id),['smouha-pyramids-20261103','ghazl-ittihad-20261104']);
  const match=today[0];assert.equal(fixtureState(match,Date.parse('2026-11-04T18:00:00+02:00')),'awaiting_update');
  assert.ok(!filterFixtures(sportsContent.fixtures,options,Date.parse('2026-11-05T12:00:00+02:00')).includes(match));
  assert.ok(filterFixtures(sportsContent.fixtures,{...options,period:'all'},Date.parse('2026-11-05T12:00:00+02:00')).includes(match));
});

test('sports activity filters expire dated events and keep explicitly undated club guides',()=>{
  const after=Date.parse('2026-11-07T12:00:00+02:00');
  const all={club:'all',sport:'all',query:''};
  assert.ok(filterSportsActivities(sportsContent.activities,all,now).some(item=>item.id==='alex-marathon-20261106'));
  assert.ok(!filterSportsActivities(sportsContent.activities,all,after).some(item=>item.id==='alex-marathon-20261106'));
  assert.deepEqual(filterSportsActivities(sportsContent.activities,{club:'sporting',sport:'swimming',query:'السباحه'},after).map(item=>item.id),['sporting-swimming']);
  assert.equal(sportsSnapshotStale(now),false);assert.equal(sportsSnapshotStale(Date.parse('2026-11-07T12:00:00+02:00')),true);
});

test('Google review links preserve match identity without assigning dates to uncertain fixtures',()=>{
  const known=sportsContent.fixtures.find(item=>item.id==='smouha-pyramids-20261103')!;
  const uncertain=sportsContent.fixtures.find(item=>item.id==='haras-dakhlia-unconfirmed')!;
  const link=new URL(fixtureGoogleSearchUrl(known));
  assert.equal(link.origin,'https://www.google.com');
  assert.ok(link.searchParams.get('q')?.includes('2026-11-03'));
  assert.ok(link.searchParams.get('q')?.includes('سموحة بيراميدز'));
  assert.ok(link.searchParams.get('q')?.includes('بتوقيت القاهرة'));
  const uncertainQuery=new URL(fixtureGoogleSearchUrl(uncertain)).searchParams.get('q')!;
  assert.ok(!/2026-11-06|2026-11-13|null|undefined/.test(uncertainQuery));
  assert.ok(new URL(clubGoogleSearchUrl(sportsContent.clubs[0])).searchParams.get('q')?.includes('الاتحاد السكندري'));
  const publisher=sportsContent.sources.find(item=>item.id==='smouha-pyramids-youm7')!;
  assert.equal(new URL(publisher.url).hostname,'www.youm7.com');
  assert.equal(publisher.discoveredVia,'google_search');
  assert.ok(known.sourceIds.includes(publisher.id));
  assert.equal(known.venue,'استاد برج العرب بالإسكندرية');
});
