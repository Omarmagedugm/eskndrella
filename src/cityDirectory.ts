import {cityContent, type CityEntry} from './cityContent';
import {normalize} from './data';

// Published backend records take precedence over editorial copies of the same item.
// Editorial data is available immediately, including when Firebase is empty/offline.
export function directoryEntries(collection: string, remote: CityEntry[] = [], now = Date.now()): CityEntry[] {
  const ids = new Set(remote.map(item => item.id));
  const names = new Set(remote.map(item => normalize(item.name)));
  const entries = [
    ...remote.filter(item => item.published !== false && item.archived !== true),
    ...(cityContent[collection] || []).filter(item => !ids.has(item.id) && !names.has(normalize(item.name))),
  ];
  if (collection === 'city_news') {
    entries.sort((a, b) => String(b.publishedDate || '').localeCompare(String(a.publishedDate || '')));
  }
  if (collection === 'city_events') {
    const past = (item: CityEntry) => Date.parse(item.endsAt || item.startsAt) < now;
    entries.sort((a, b) => Number(past(a)) - Number(past(b)) ||
      (past(a) ? Date.parse(b.startsAt) - Date.parse(a.startsAt) : Date.parse(a.startsAt) - Date.parse(b.startsAt)));
  }
  return entries;
}
