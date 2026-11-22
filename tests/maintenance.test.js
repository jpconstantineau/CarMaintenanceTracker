import test from 'node:test';
import assert from 'node:assert/strict';
import * as History from '../docs/history.js';
import * as Calculations from '../docs/calculations.js';
import { serialize, deserialize } from '../docs/storage.js';

function vehicle() {
  return History.saveVehicle(History.createCollection(), { name: 'Civic', odometerUnit: 'km' });
}

test('vehicle-specific items retain editable replacement information without requiring a schedule', () => {
  const first = vehicle();
  const second = History.saveVehicle(first.collection, { name: 'Truck', odometerUnit: 'mi' });
  const saved = History.saveItem(second.collection, first.vehicleId, {
    name: 'Cabin air filter', specifications: 'Carbon', compatibleParts: 'ABC-123\nDEF-456',
    preferredBrand: 'Example', notes: '<b>Keep literal</b>', links: ['https://example.com/filter'],
  });
  assert.equal(History.listItems(saved.collection, second.vehicleId).length, 0);
  const item = History.listItems(saved.collection, first.vehicleId)[0];
  assert.deepEqual(item.tracking, { distance: null, months: null, condition: null });
  const { id, vehicleId, createdAt, updatedAt, ...details } = item;
  const changed = History.saveItem(saved.collection, first.vehicleId, { ...details, name: 'Cabin filter' }, item.id);
  assert.equal(History.listItems(changed.collection, first.vehicleId)[0].id, item.id);
  assert.equal(History.listItems(saved.collection, first.vehicleId)[0].name, 'Cabin air filter');
  assert.deepEqual(deserialize(serialize(changed.collection)), changed.collection);
  assert.throws(() => History.saveItem(saved.collection, second.vehicleId, { name: 'Wrong car' }, item.id));
  assert.throws(() => History.saveItem(saved.collection, first.vehicleId, { name: 'Unsafe', links: ['javascript:alert(1)'] }));
});

test('a full-length item name can be retained in the concrete service action', () => {
  const car = vehicle();
  const item = History.saveItem(car.collection, car.vehicleId, { name: 'A'.repeat(100) });
  const saved = History.saveSession(item.collection, { vehicleId: car.vehicleId, odometerUnit: 'km' }, [
    { kind: 'maintenance', itemId: item.itemId, action: 'Replace ' + 'A'.repeat(100), date: '2024' },
  ]);
  assert.equal(History.getRecord(saved.collection, saved.recordIds[0]).action, 'Replace ' + 'A'.repeat(100));
});

test('removing an item and its linked history retains deletion identities and other items', () => {
  const car = vehicle();
  const first = History.saveItem(car.collection, car.vehicleId, { name: 'Filter' });
  const second = History.saveItem(first.collection, car.vehicleId, { name: 'Brakes' });
  const saved = History.saveSession(second.collection, { vehicleId: car.vehicleId, odometerUnit: 'km', date: '2024' }, [
    { kind: 'maintenance', itemId: first.itemId, action: 'Replace' },
    { kind: 'observation', itemId: second.itemId, action: 'Inspect' },
    { kind: 'maintenance', notes: 'Unassigned work' },
  ]);
  const removed = History.removeItem(saved.collection, first.itemId);
  assert.deepEqual(History.listItems(removed, car.vehicleId).map(item => item.id), [second.itemId]);
  assert.deepEqual(History.listRecords(removed, car.vehicleId).map(record => record.id), saved.recordIds.slice(1));
  assert.deepEqual(removed.tombstones.map(marker => marker.id).sort(), [first.itemId, saved.recordIds[0]].sort());
  assert.deepEqual(deserialize(serialize(removed)), removed);
  assert.equal(saved.collection.items.length, 2);
});

test('equivalent mixed-unit readings and contradictory evidence cannot order overlapping services', () => {
  const car = vehicle();
  const item = History.saveItem(car.collection, car.vehicleId, { name: 'Filter', tracking: { distance: null, months: 6, condition: null } });
  const equivalent = History.saveSession(item.collection, { vehicleId: car.vehicleId, itemId: item.itemId, action: 'Replace' }, [
    { kind: 'maintenance', date: '2024', odometer: 9, odometerUnit: 'mi' },
    { kind: 'maintenance', date: '2024-06', odometer: 14.484096, odometerUnit: 'km' },
  ]);
  const equalResult = Calculations.maintenanceSummary(equivalent.collection, car.vehicleId, '2025-01-01')[0];
  assert.equal(equalResult.serviceId, null);
  assert.equal(equalResult.dueDate, null);
  const conflicting = History.saveSession(item.collection, { vehicleId: car.vehicleId, odometerUnit: 'km' }, [
    { kind: 'maintenance', itemId: item.itemId, action: 'Replace', date: '2024', odometer: 10000 },
    { kind: 'maintenance', itemId: item.itemId, action: 'Replace', date: '2024-06', odometer: 20000 },
    { kind: 'odometer', date: '2024-07-01', odometer: 5000 },
  ]);
  const conflictResult = Calculations.maintenanceSummary(conflicting.collection, car.vehicleId, '2025-01-01')[0];
  assert.equal(conflictResult.serviceId, null);
  assert.equal(conflictResult.dueDate, null);
  const orderedByDates = History.updateRecord(conflicting.collection, conflicting.recordIds[0], { date: '2023' });
  assert.equal(Calculations.maintenanceSummary(orderedByDates, car.vehicleId, '2025-01-01')[0].status, 'due');
});

test('evaluation dates do not consume future mileage or declare the future service due', () => {
  const car = vehicle();
  const item = History.saveItem(car.collection, car.vehicleId, { name: 'Filter', tracking: { distance: { value: 10000, unit: 'km' }, months: null, condition: null } });
  const saved = History.saveSession(item.collection, { vehicleId: car.vehicleId, odometerUnit: 'km' }, [
    { kind: 'maintenance', itemId: item.itemId, action: 'Replace', date: '2024-01-01', odometer: 100000 },
    { kind: 'odometer', date: '2026-01-01', odometer: 120000 },
  ]);
  const result = Calculations.maintenanceSummary(saved.collection, car.vehicleId, '2025-01-01')[0];
  assert.equal(result.status, 'unavailable');
  assert.match(result.reasons.join(), /evaluation date/);
});

test('approximate service dates produce calendar ranges; missing mileage stays unknown and either limit can be due', () => {
  const car = vehicle();
  const item = History.saveItem(car.collection, car.vehicleId, { name: 'Filter',
    tracking: { distance: { value: 1000, unit: 'mi' }, months: 1, condition: null } });
  const saved = History.saveSession(item.collection, { vehicleId: car.vehicleId, odometerUnit: 'km' }, [
    { kind: 'maintenance', itemId: item.itemId, action: 'Replace', date: '2024-01', odometer: null },
  ]);
  let result = Calculations.maintenanceSummary(saved.collection, car.vehicleId, '2024-02-15')[0];
  assert.deepEqual(result.dueDate, { earliest: '2024-02-01', latest: '2024-02-29' });
  assert.equal(result.dueMileage, null);
  assert.equal(result.status, 'uncertain');
  assert.equal(Calculations.maintenanceSummary(saved.collection, car.vehicleId, '2024-03-01')[0].status, 'due');
  const known = History.updateRecord(saved.collection, saved.recordIds[0], { odometer: 10000 });
  const reading = History.saveSession(known, { vehicleId: car.vehicleId, odometerUnit: 'km' }, [{ kind: 'odometer', date: '2024-02-01', odometer: 12000 }]);
  result = Calculations.maintenanceSummary(reading.collection, car.vehicleId, '2024-02-01')[0];
  assert.ok(Math.abs(result.dueMileage - 11609.344) < 1e-8);
  assert.equal(result.status, 'due');
});

test('ambiguous services, gaps, contradictory mileage and condition-only settings never invent a due baseline', () => {
  const car = vehicle();
  const item = History.saveItem(car.collection, car.vehicleId, { name: 'Custom',
    tracking: { distance: { value: 1000, unit: 'km' }, months: 12, condition: null } });
  assert.equal(Calculations.maintenanceSummary(item.collection, car.vehicleId, '2025-01-01')[0].serviceId, null);
  const saved = History.saveSession(item.collection, { vehicleId: car.vehicleId, odometerUnit: 'km' }, [
    { kind: 'maintenance', itemId: item.itemId, action: 'Replace', date: '2024', odometer: null },
    { kind: 'maintenance', itemId: item.itemId, action: 'Replace', date: '2024-06', odometer: null },
  ]);
  assert.match(Calculations.maintenanceSummary(saved.collection, car.vehicleId, '2025-01-01')[0].reasons.join(), /ambiguous/);
  let known = History.updateRecord(saved.collection, saved.recordIds[0], { date: '2023-01-01', odometer: 10000 });
  known = History.updateRecord(known, saved.recordIds[1], { date: '2024-06-01', odometer: 5000 });
  assert.equal(Calculations.maintenanceSummary(known, car.vehicleId, '2025-01-01')[0].dueMileage, null);
  const gap = History.saveSession(item.collection, { vehicleId: car.vehicleId }, [
    { kind: 'maintenance', itemId: item.itemId, action: 'Replace', date: '2020', odometerUnit: 'km' },
    { kind: 'gap', date: '2021', endDate: '2022', historyType: 'maintenance' },
  ]);
  assert.equal(Calculations.maintenanceSummary(gap.collection, car.vehicleId, '2025-01-01')[0].dueDate, null);
  const condition = History.saveItem(item.collection, car.vehicleId, { name: 'Oil life', tracking: {
    distance: null, months: null, condition: { metric: 'oil-life', unit: '%', operator: 'at-or-below', threshold: 0 },
  } });
  assert.deepEqual(deserialize(serialize(condition.collection)), condition.collection);
  assert.equal(Calculations.maintenanceSummary(condition.collection, car.vehicleId, '2025-01-01')[1].status, 'unavailable');
});

test('only the latest qualifying service resets a combined schedule, across years and corrections', () => {
  const car = vehicle();
  const item = History.saveItem(car.collection, car.vehicleId, { name: 'Cabin filter',
    tracking: { distance: { value: 10000, unit: 'km' }, months: 12, condition: null } });
  let saved = History.saveSession(item.collection, { vehicleId: car.vehicleId, odometerUnit: 'km', itemId: item.itemId, action: 'Replace filter' }, [
    { kind: 'maintenance', date: '2022-01-31', odometer: 100000 },
    { kind: 'observation', date: '2023-01-31', odometer: 105000, action: 'Inspect filter' },
  ]);
  let summary = Calculations.maintenanceSummary(saved.collection, car.vehicleId, '2023-02-01')[0];
  assert.equal(summary.status, 'due');
  assert.equal(summary.dueMileage, 110000);
  assert.deepEqual(summary.dueDate, { earliest: '2023-01-31', latest: '2023-01-31' });
  assert.equal(summary.serviceId, saved.recordIds[0]);
  saved.collection = History.updateRecord(saved.collection, saved.recordIds[0], { date: '2022-06-30' });
  summary = Calculations.maintenanceSummary(saved.collection, car.vehicleId, '2023-02-01')[0];
  assert.equal(summary.status, 'not-due');
  const backfill = History.saveSession(saved.collection, { vehicleId: car.vehicleId, odometerUnit: 'km' }, [
    { kind: 'maintenance', itemId: item.itemId, action: 'Replace', date: '2020', odometer: 50000 },
  ]);
  assert.equal(Calculations.maintenanceSummary(backfill.collection, car.vehicleId, '2023-02-01')[0].dueMileage, 110000);
  const removed = History.removeRecord(backfill.collection, saved.recordIds[0]);
  assert.equal(Calculations.maintenanceSummary(removed, car.vehicleId, '2023-02-01')[0].dueMileage, 60000);
});

test('linked services and inspections retain parts and cost, with valid vehicle references and legacy facts', () => {
  const car = vehicle();
  const item = History.saveItem(car.collection, car.vehicleId, { name: 'Brakes' });
  const saved = History.saveSession(item.collection, { vehicleId: car.vehicleId, odometerUnit: 'km', date: '2023' }, [
    { kind: 'maintenance', itemId: item.itemId, action: 'Service brakes', partUsed: 'P-42', cost: { amount: 123.45, currency: 'CAD' } },
    { kind: 'observation', itemId: item.itemId, action: 'Inspect brakes' },
    { kind: 'maintenance', notes: 'Earlier unassigned work' },
  ]);
  assert.deepEqual(deserialize(serialize(saved.collection)), saved.collection);
  assert.equal(History.getRecord(saved.collection, saved.recordIds[2]).itemId, null);
  const other = History.saveVehicle(saved.collection, { name: 'Other', odometerUnit: 'mi' });
  assert.throws(() => History.updateRecord(other.collection, saved.recordIds[0], { vehicleId: other.vehicleId }));
  assert.throws(() => History.updateRecord(saved.collection, saved.recordIds[0], { cost: { amount: -1, currency: 'CAD' } }));
  const removed = History.removeVehicle(saved.collection, car.vehicleId);
  assert.equal(removed.items.length, 0);
  assert.ok(removed.tombstones.some(marker => marker.id === item.itemId));
  const legacy = { ...car.collection, schemaVersion: 3 };
  delete legacy.items;
  assert.deepEqual(deserialize(JSON.stringify(legacy)), car.collection);
});
