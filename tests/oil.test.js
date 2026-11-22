import test from 'node:test';
import assert from 'node:assert/strict';
import * as History from '../docs/history.js';
import * as Calculations from '../docs/calculations.js';
import { serialize, deserialize } from '../docs/storage.js';

function car(entries = []) {
  const saved = History.saveVehicle(History.createCollection(), { name: 'Oil car', odometerUnit: 'km' });
  return { ...History.saveSession(saved.collection, { vehicleId: saved.vehicleId, odometerUnit: 'km' }, entries), vehicleId: saved.vehicleId };
}

test('oil facts remain distinct, optional and lossless through edits and JSON', () => {
  const saved = car([
    { kind: 'oil-change', date: '2024', notes: 'Earlier oil service; no inferred life reading' },
    { kind: 'oil-life', date: '2025-01', odometer: 62000.25, odometerUnit: 'mi', oilLife: 80.5 },
    { kind: 'oil-level', date: '2025-02-01', oilLevel: 'low', notes: 'Below lower mark' },
    { kind: 'oil-top-up', date: '2025-02-02', oilLitres: 0.625 },
    { kind: 'oil-life', date: '2025-03' },
  ]);
  assert.deepEqual(deserialize(serialize(saved.collection)), saved.collection);
  const item = History.saveItem(saved.collection, saved.vehicleId, { name: 'Engine oil', specifications: '0W-20' });
  const changed = History.updateRecord(item.collection, saved.recordIds[0], { itemId: item.itemId, action: 'Change oil', partUsed: '0W-20' });
  assert.equal(changed.records.length, 5);
  assert.equal(History.getRecord(changed, saved.recordIds[0]).notes, 'Earlier oil service; no inferred life reading');
  assert.equal(History.getRecord(changed, saved.recordIds[4]).oilLife, null);
  assert.throws(() => History.updateRecord(changed, saved.recordIds[1], { oilLife: 101 }));
  assert.throws(() => History.updateRecord(changed, saved.recordIds[2], { oilLevel: '80%' }));
  assert.throws(() => History.updateRecord(changed, saved.recordIds[3], { oilLitres: 0 }));
  const removed = History.removeRecord(changed, saved.recordIds[3]);
  assert.equal(removed.tombstones[0].kind, 'oil-top-up');
  assert.deepEqual(deserialize(serialize(removed)), removed);
});

test('a continuous mid-interval 80/40 life segment projects 108000 km without inventing a prior change', () => {
  const saved = car([
    { kind: 'oil-life', date: '2025-01-01', odometer: 100000, oilLife: 80 },
    { kind: 'oil-life', date: '2025-02-10', odometer: 104000, oilLife: 40 },
  ]);
  const result = Calculations.oilSummary(saved.collection, saved.vehicleId);
  assert.equal(result.forecast.source, 'fit');
  assert.equal(result.forecast.slope, -0.01);
  assert.equal(result.forecast.remainingDistance, 4000);
  assert.equal(result.forecast.dueMileage, 108000);
  assert.equal(result.forecast.limited, true);
  assert.deepEqual(result.forecast.support.map(record => record.id), saved.recordIds);
  assert.equal(result.lastChange, null);
  assert.match(result.coverage, /Earlier oil change unknown/);
});

test('unresolved resets, missing records, ambiguous order and conflicting mileage withhold fits', () => {
  const base = [
    { kind: 'oil-life', date: '2025-01-01', odometer: 100000, oilLife: 80 },
    { kind: 'oil-life', date: '2025-02-10', odometer: 104000, oilLife: 40 },
  ];
  for (const extra of [
    { kind: 'oil-life', date: '2025-01-20', odometer: 102000, oilLife: 90 },
    { kind: 'oil-life', date: '2025-01-20', oilLife: 90 },
    { kind: 'gap', date: '2025-01-05', endDate: '2025-01-15', historyType: 'oil' },
    { kind: 'gap', date: '2025-02-11', endDate: '2025-02-15', historyType: 'maintenance' },
    { kind: 'oil-life', date: '2025', oilLife: 60 },
    { kind: 'odometer', date: '2025-03-01', odometer: 90000 },
  ]) {
    const saved = car([...base, extra]);
    const result = Calculations.oilSummary(saved.collection, saved.vehicleId);
    assert.equal(result.forecast, null, JSON.stringify(extra));
    assert.ok(result.reasons.length);
  }
  for (const percentages of [[80, 80], [40, 80]]) {
    const saved = car(base.map((record, index) => ({ ...record, oilLife: percentages[index] })));
    assert.equal(Calculations.oilSummary(saved.collection, saved.vehicleId).forecast, null);
  }
});

test('completed intervals exclude missing changes and unknown baselines; median fallback needs the last change mileage', () => {
  const saved = car([
    { kind: 'oil-change', date: '2020-01-01', odometer: 80000 },
    { kind: 'oil-change', date: '2020-06-01', odometer: 90000 },
    { kind: 'oil-change', date: '2021-01-01', odometer: 102000 },
    { kind: 'gap', date: '2021-02', endDate: '2022', historyType: 'oil' },
    { kind: 'oil-change', date: '2023-01-01', odometer: 130000 },
  ]);
  let result = Calculations.oilSummary(saved.collection, saved.vehicleId);
  assert.deepEqual(result.intervals.map(interval => interval.distance), [10000, 12000]);
  assert.equal(result.count, 2);
  assert.equal(result.median, 11000);
  assert.equal(result.forecast.source, 'historical');
  assert.equal(result.forecast.dueMileage, 141000);
  const unknown = History.updateRecord(saved.collection, saved.recordIds[4], { odometer: null });
  result = Calculations.oilSummary(unknown, saved.vehicleId);
  assert.equal(result.median, 11000);
  assert.equal(result.forecast, null);
  const extra = History.saveSession(saved.collection, { vehicleId: saved.vehicleId, odometerUnit: 'km' }, [
    { kind: 'oil-change', date: '2024-01-01' },
    { kind: 'oil-change', date: '2025-01-01', odometer: 160000 },
  ]);
  assert.equal(Calculations.oilSummary(extra.collection, saved.vehicleId).count, 2);
});

test('observed zero is due without a fit; checks and top-ups never reset oil life or service', () => {
  const saved = car([
    { kind: 'oil-change', date: '2024-01-01', odometer: 80000 },
    { kind: 'oil-change', date: '2025-01-01', odometer: 90000 },
    { kind: 'oil-life', date: '2025-02-01', oilLife: 0 },
    { kind: 'oil-level', date: '2025-02-02', oilLevel: 'normal' },
    { kind: 'oil-top-up', date: '2025-02-03', oilLitres: 1 },
  ]);
  const result = Calculations.oilSummary(saved.collection, saved.vehicleId);
  assert.equal(result.forecast.source, 'observed');
  assert.equal(result.forecast.dueMileage, null);
  assert.equal(result.forecast.remainingDistance, 0);
  assert.equal(result.lastChange.id, saved.recordIds[1]);
  assert.equal(result.count, 1);
  const changed = History.saveSession(saved.collection, { vehicleId: saved.vehicleId, odometerUnit: 'km' }, [
    { kind: 'oil-change', date: '2025-03-01', odometer: 92000 },
  ]);
  assert.equal(Calculations.oilSummary(changed.collection, saved.vehicleId).forecast.source, 'historical');
});

test('calendar forecast uses the latest two recorded dated odometers and never assumes present mileage', () => {
  const saved = car([
    { kind: 'oil-life', date: '2025-01-01', odometer: 100000, oilLife: 80 },
    { kind: 'oil-life', date: '2025-02-10', odometer: 104000, oilLife: 40 },
    { kind: 'odometer', date: '2025-02-20', odometer: 105000 },
  ]);
  const result = Calculations.oilSummary(saved.collection, saved.vehicleId);
  assert.equal(result.calendar.date, '2025-03-22');
  assert.equal(result.calendar.rate, 100);
  assert.equal(result.calendar.remainingDistance, 3000);
  assert.deepEqual(result.calendar.support.map(point => point.date), ['2025-02-10', '2025-02-20']);
  assert.equal(result.forecast.remainingDistance, 4000);
  for (const changes of [{ odometer: 104000 }, { date: '2025-02' }]) {
    const changed = History.updateRecord(saved.collection, saved.recordIds[2], changes);
    assert.equal(Calculations.oilSummary(changed, saved.vehicleId).calendar, null);
  }
});

test('fits use OLS across all supported points, retain units, and recalculate after corrections and a known change', () => {
  const saved = car([
    { kind: 'oil-life', date: '2024-01-01', odometer: 100000, oilLife: 80 },
    { kind: 'oil-life', date: '2024-02-01', odometer: 102000, oilLife: 50 },
    { kind: 'oil-life', date: '2024-03-01', odometer: 104000, oilLife: 40 },
  ]);
  let result = Calculations.oilSummary(saved.collection, saved.vehicleId);
  assert.equal(result.forecast.dueMileage, 108000);
  assert.equal(result.forecast.limited, false);
  const changed = History.updateRecord(saved.collection, saved.recordIds[2], { oilLife: 20 });
  assert.ok(Math.abs(Calculations.oilSummary(changed, saved.vehicleId).forecast.dueMileage - 105333.33333333333) < 1e-7);
  const later = History.saveSession(changed, { vehicleId: saved.vehicleId, odometerUnit: 'mi' }, [
    { kind: 'oil-change', date: '2024-04-01', odometer: 66000 },
    { kind: 'oil-life', date: '2024-05-01', odometer: 67000, oilLife: 80 },
    { kind: 'oil-life', date: '2024-06-01', odometer: 69000, oilLife: 40 },
  ]);
  result = Calculations.oilSummary(later.collection, saved.vehicleId);
  assert.ok(Math.abs(result.forecast.dueMileage - 114263.424) < 1e-7);
  assert.deepEqual(result.forecast.support.map(record => record.odometerUnit), ['mi', 'mi']);
  const onlyOne = History.removeRecord(later.collection, later.recordIds[2]);
  assert.equal(Calculations.oilSummary(onlyOne, saved.vehicleId).forecast, null);
});

test('validated schema 4 upgrades retain oil-change identity and notes and existing items without inference', () => {
  const saved = car([{ kind: 'oil-change', date: '2020-03', odometer: 80000, notes: '80% mentioned in old notes' }]);
  const item = History.saveItem(saved.collection, saved.vehicleId, { name: 'Existing filter' });
  const previous = structuredClone(item.collection);
  previous.schemaVersion = 4;
  for (const key of ['itemId', 'action', 'partUsed', 'cost']) delete previous.records[0][key];
  const upgraded = deserialize(JSON.stringify(previous));
  assert.equal(upgraded.schemaVersion, History.SCHEMA_VERSION);
  assert.deepEqual(upgraded.items, previous.items);
  assert.deepEqual(upgraded.records[0], item.collection.records[0]);
  assert.equal(Calculations.oilSummary(upgraded, saved.vehicleId).forecast, null);
  assert.throws(() => deserialize(JSON.stringify({ ...previous, records: [...previous.records, { ...previous.records[0], kind: 'oil-life' }] })));
});

test('attaching an oil-change record to an item supplies its existing service baseline once', () => {
  const saved = car([{ kind: 'oil-change', date: '2025-01-01', odometer: 90000 }]);
  const item = History.saveItem(saved.collection, saved.vehicleId, { name: 'Engine oil', tracking: { distance: null, months: 12, condition: null } });
  const changed = History.updateRecord(item.collection, saved.recordIds[0], { itemId: item.itemId, action: 'Change oil' });
  const summary = Calculations.maintenanceSummary(changed, saved.vehicleId, '2026-01-01')[0];
  assert.equal(summary.serviceId, saved.recordIds[0]);
  assert.equal(summary.status, 'due');
  assert.equal(Calculations.oilSummary(changed, saved.vehicleId).records.length, 1);
});
