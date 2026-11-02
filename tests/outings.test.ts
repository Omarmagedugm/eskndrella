import {test} from 'node:test';
import assert from 'node:assert/strict';
import {admissionFee,filterOutings,outingCatalog} from '../src/outingCatalog.ts';

const items = outingCatalog(Date.parse('2026-11-02T12:00:00+02:00'));
const defaults = {category:'all' as const,region:'all',query:'',maxFee:null,ticket:'adult' as const};

test('outings retain sources and exclude past events and a temporarily closed restaurant',()=>{
  assert.ok(items.length>15);
  assert.ok(items.every(item=>item.sourceUrl&&item.reviewedAt));
  assert.ok(items.some(item=>item.id==='carnival-animals-20261112'));
  assert.ok(!items.some(item=>['stefanos-san-stefano','dalida-oct31','incident-oct30'].includes(item.id)));
});

test('a budget limit excludes unknown prices and respects recorded student admissions',()=>{
  const adult = filterOutings(items,{...defaults,category:'budget',maxFee:50});
  const students = filterOutings(items,{...defaults,category:'budget',maxFee:50,ticket:'student'});
  assert.ok(adult.every(item=>admissionFee(item,'adult')!==null&&admissionFee(item,'adult')!<=50));
  assert.ok(!adult.some(item=>item.id==='qaitbay'));
  assert.ok(students.some(item=>item.id==='qaitbay'));
  assert.equal(admissionFee(items.find(item=>item.id==='delices-raml')!,'adult'),null);
  assert.equal(admissionFee(items.find(item=>item.id==='arifa-20261105')!,'student'),80);
});

test('outing category, region and normalized Arabic search combine',()=>{
  const family = filterOutings(items,{...defaults,category:'family',region:'الشاطبي',query:'عروض علميه'});
  assert.deepEqual(family.map(item=>item.id),['planetarium']);
  assert.equal(filterOutings(items,{...defaults,category:'food',region:'كرموز'}).length,0);
});
