import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cityContent, eventStatus} from '../src/cityContent.ts';
import {directoryEntries} from '../src/cityDirectory.ts';

const researched = JSON.parse(readFileSync(new URL('../src/researchedContent.json', import.meta.url), 'utf8'));
const now = Date.parse('2026-11-02T12:00:00+02:00');

test('internet additions are traceable and preserve earlier editorial data', () => {
  const records = Object.values(researched.collections).flat() as any[];
  assert.equal(records.length, 23);
  assert.equal(researched.transportLines.length, 10);
  for (const [collection, items] of Object.entries(cityContent)) {
    assert.equal(new Set(items.map(item => item.id)).size, items.length, collection);
    for (const item of items) {
      assert.ok(item.name && item.summary && item.region && item.sourceName);
      assert.equal(new URL(item.sourceUrl).protocol, 'https:');
      assert.ok(Number.isFinite(Date.parse(item.reviewedAt)));
    }
  }
  assert.ok(cityContent.city_places.some(item => item.id === 'qaitbay'));
  assert.ok(cityContent.city_places.some(item => item.id === 'graeco-roman'));
});

test('Firebase empty results do not hide researched content', () => {
  for (const collection of Object.keys(researched.collections)) {
    assert.equal(directoryEntries(collection, [], now).length, cityContent[collection].length);
  }
});

test('published edits override editorial copies without hiding other additions', () => {
  const local = cityContent.city_places.find(item => item.id === 'graeco-roman')!;
  const edited = {...local, id: 'server-id', summary: 'تحديث من لوحة الإدارة'};
  const result = directoryEntries('city_places', [edited], now);
  assert.equal(result.filter(item => item.name === local.name).length, 1);
  assert.equal(result.find(item => item.id === 'server-id')?.summary, edited.summary);
  assert.ok(result.some(item => item.id === 'kom-shoqafa'));
  assert.equal(directoryEntries('city_places', [{...local, archived: true}], now).some(item => item.id === local.id), false);
});

test('news sort newest first and upcoming events precede the archive', () => {
  const news = directoryEntries('city_news', [], now);
  assert.equal(news[0].publishedDate, '2026-11-01');
  const events = directoryEntries('city_events', [], now);
  const firstPast = events.findIndex(item => Date.parse(item.endsAt || item.startsAt) < now);
  assert.ok(firstPast > 0);
  assert.ok(events.slice(firstPast).every(item => Date.parse(item.endsAt || item.startsAt) < now));
  assert.equal(eventStatus(events.find(item => item.id === 'arifa-20261105')!, now), 'جاية');
  assert.equal(events.find(item => item.id === 'carnival-animals-20261112')?.startsAt, '2026-11-12T10:00:00+02:00');
});

test('official directory lines stay separate from live routing and unknown fares', () => {
  assert.equal(new Set(researched.transportLines.map((line: any) => line.number)).size, 10);
  assert.equal(new URL(researched.transportSource.url).hostname, 'alexapta.gov.eg');
  for (const line of researched.transportLines) {
    assert.ok(line.origin && line.destination && line.via.length);
    assert.equal('fare' in line, false);
    assert.equal('minutes' in line, false);
    assert.equal('verified' in line, false);
  }
});
