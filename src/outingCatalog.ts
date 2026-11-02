import {cityContent, type CityEntry} from './cityContent';
import {normalize} from './data';

export type OutingCategory = 'all' | 'budget' | 'family' | 'students' | 'culture' | 'food' | 'events';
export type TicketType = 'adult' | 'student';
type Profile = {kind: 'culture' | 'food' | 'events'; family?: boolean; students?: boolean; adult?: number; student?: number};
export type Outing = CityEntry & {profile: Profile};

// Entry fees for Egyptians, as recorded in each linked source on its review date.
// An absent fee is unknown, never free. No food, travel or other costs are inferred.
const profiles: Record<string, Profile> = {
  'graeco-roman': {kind:'culture', students:true, adult:40, student:20},
  planetarium: {kind:'culture', family:true, students:true, adult:50, student:20},
  'history-science': {kind:'culture', family:true, students:true},
  'kom-shoqafa': {kind:'culture'},
  'pompeys-pillar': {kind:'culture'},
  qaitbay: {kind:'culture', students:true, adult:60, student:30},
  jewelry: {kind:'culture', students:true, adult:30, student:10},
  dikka: {kind:'culture', students:true, adult:20, student:10},
  national: {kind:'culture', students:true, adult:20, student:5},
  library: {kind:'culture', students:true},
  'ba-antiquities': {kind:'culture', students:true},
  'delices-raml': {kind:'food'},
  'fresca-san-stefano': {kind:'food'},
  trianon: {kind:'food'},
  sanview: {kind:'food'},
  byblos: {kind:'food'},
  'arifa-20261105': {kind:'events', adult:80},
  'baechlin-elkholy-20261106': {kind:'events', adult:80},
  'carnival-animals-20261112': {kind:'events', family:true, adult:120},
  'rageh-daoud': {kind:'events', adult:200},
  samai: {kind:'events', adult:200},
  'our-nights': {kind:'events', adult:50},
  'ai-nov4': {kind:'events', students:true},
};

export function defaultOutingRecords(): any[] {
  return ['city_places', 'city_businesses', 'city_events'].flatMap(collection =>
    (cityContent[collection] || []).filter(item => profiles[item.id]).map(item => {
      const p = profiles[item.id];
      return {
        id: item.id,
        name: item.name,
        kind: p.kind,
        region: item.region,
        summary: item.summary,
        imageUrl: item.imageUrl || '',
        innerImageUrl: item.innerImageUrl || '',
        adultFee: p.adult ?? null,
        studentFee: p.student ?? null,
        family: !!p.family,
        students: !!p.students,
        openingHours: item.openingHours || '',
        priceNote: item.priceNote || '',
        venue: item.venue || '',
        address: item.address || '',
        startsAt: item.startsAt || '',
        endsAt: item.endsAt || '',
        sourceName: item.sourceName || 'إسكندريلا',
        sourceUrl: item.sourceUrl || '',
        reviewedAt: item.reviewedAt || '2026-11-02',
      };
    })
  );
}

function toOuting(raw: any): Outing {
  const profile: Profile = raw.profile || {
    kind: (['culture', 'food', 'events'].includes(raw.kind) ? raw.kind : 'culture') as Profile['kind'],
    family: Boolean(raw.family),
    students: Boolean(raw.students),
    ...(raw.adultFee != null && raw.adultFee !== '' ? { adult: Number(raw.adultFee) } : {}),
    ...(raw.studentFee != null && raw.studentFee !== '' ? { student: Number(raw.studentFee) } : {}),
  };
  return {
    ...raw,
    reviewedAt: raw.reviewedAt || '2026-11-02',
    sourceName: raw.sourceName || 'إسكندريلا',
    sourceUrl: raw.sourceUrl || '',
    profile,
  };
}

export function outingCatalog(remote: any[] = [], now = Date.now()): Outing[] {
  const remoteIds = new Set(remote.map(item => item.id));
  const defaults = defaultOutingRecords().filter(item => !remoteIds.has(item.id));
  const merged = [
    ...remote.filter(item => item.published !== false && item.archived !== true),
    ...defaults,
  ];
  return merged
    .filter(item => !item.startsAt || Date.parse(item.endsAt || item.startsAt) >= now)
    .map(toOuting);
}

export function admissionFee(item: Outing, ticket: TicketType): number | null {
  return (ticket === 'student' ? item.profile.student ?? item.profile.adult : item.profile.adult) ?? null;
}

export function filterOutings(items: Outing[], options: {category: OutingCategory; region: string; query: string; maxFee: number | null; ticket: TicketType}): Outing[] {
  const query = normalize(options.query);
  return items.filter(item => {
    const fee = admissionFee(item, options.ticket);
    const categoryMatches = options.category === 'all' ||
      (options.category === 'budget' ? fee !== null :
        options.category === 'family' ? item.profile.family :
          options.category === 'students' ? item.profile.students : item.profile.kind === options.category);
    return categoryMatches && (options.region === 'all' || item.region === options.region) &&
      normalize([item.name,item.summary,item.region].join(' ')).includes(query) &&
      (options.maxFee === null || (fee !== null && fee <= options.maxFee));
  }).sort((a,b) => options.category === 'budget' || options.maxFee !== null
    ? (admissionFee(a,options.ticket) ?? Infinity) - (admissionFee(b,options.ticket) ?? Infinity) : 0);
}
