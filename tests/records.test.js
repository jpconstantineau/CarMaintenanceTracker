import test from 'node:test';
import assert from 'node:assert/strict';
import * as History from '../docs/history.js';
import { serialize, deserialize } from '../docs/storage.js';
import { summarizeVehicle } from '../docs/calculations.js';
import { mileageEvidence, vehicleHistory } from '../docs/calculations.js';

function vehicle() {
  return History.saveVehicle(History.createCollection(), { name: 'Older Civic', odometerUnit: 'km', year: 2011 });
}

test('a dated session saves independent observations and explicit unknown mileage atomically', () => {
  const { collection, vehicleId } = vehicle();
  const result = History.saveSession(collection, { vehicleId, date: '2024-02', odometer: 120000, odometerUnit: 'km' }, [
    { kind: 'odometer' },
    { kind: 'observation', notes: 'Brakes inspected', odometer: null },
    { kind: 'observation', date: '2023', notes: 'Rattle first noticed' },
  ]);
  const records = History.listRecords(result.collection, vehicleId);
  assert.equal(collection.records.length, 0);
  assert.equal(new Set(records.map(record => record.id)).size, 3);
  assert.equal(records.find(record => record.notes === 'Brakes inspected').odometer, null);
  assert.equal(records.find(record => record.notes === 'Rattle first noticed').date, '2023');
  assert.deepEqual(deserialize(serialize(result.collection)), result.collection);
  assert.throws(() => History.saveSession(collection, { vehicleId, date: '2024-02-30', odometer: 1, odometerUnit: 'km' }, [{ kind: 'odometer' }]));
  assert.equal(collection.records.length, 0);
});

test('corrections affect only one record; removals retain identity through a round trip', () => {
  const { collection, vehicleId } = vehicle();
  const saved = History.saveSession(collection, { vehicleId, date: '2020', odometer: 90000, odometerUnit: 'mi' }, [
    { kind: 'odometer' }, { kind: 'observation', notes: 'Inspected only' },
  ]);
  const [first, sibling] = History.listRecords(saved.collection, vehicleId);
  const edited = History.updateRecord(saved.collection, first.id, { date: '2019-12', odometer: 80000 });
  assert.deepEqual(History.listRecords(edited, vehicleId)[1], sibling);
  assert.equal(edited.records[0].id, first.id);
  assert.equal(edited.records[0].createdAt, first.createdAt);
  assert.equal(edited.records[0].date, '2019-12');
  assert.equal(saved.collection.records[0].date, '2020');
  assert.throws(() => History.updateRecord(edited, first.id, { id: crypto.randomUUID() }));
  const removed = History.removeRecord(edited, first.id);
  assert.deepEqual(History.listRecords(removed, vehicleId), [sibling]);
  assert.equal(deserialize(serialize(removed)).tombstones[0].id, first.id);
  assert.equal(removed.tombstones[0].kind, 'odometer');
  assert.throws(() => History.updateRecord(removed, first.id, { notes: 'No resurrection' }));
});

test('known gaps retain their affected history and bounded span without inventing mileage', () => {
  const { collection, vehicleId } = vehicle();
  const saved = History.saveSession(collection, { vehicleId }, [
    { kind: 'gap', historyType: 'fueling', date: '2019', endDate: '2021-03', notes: 'Receipts missing' },
    { kind: 'gap', historyType: 'odometer', date: '2022-01', endDate: '2022-12', notes: '' },
  ]);
  assert.deepEqual(deserialize(serialize(saved.collection)), saved.collection);
  assert.equal(summarizeVehicle(saved.collection, vehicleId).odometer.value, null);
  const changed = History.updateRecord(saved.collection, saved.recordIds[0], { endDate: '2020' });
  assert.equal(History.getRecord(changed, saved.recordIds[0]).endDate, '2020');
  assert.throws(() => History.updateRecord(changed, saved.recordIds[0], { endDate: '2018' }));
  assert.throws(() => History.updateRecord(changed, saved.recordIds[0], { historyType: 'imaginary' }));
});

test('all observations supply dated mileage; backfills, corrections and removals recompute the summary', () => {
  const { collection, vehicleId } = vehicle();
  let saved = History.saveSession(collection, { vehicleId, odometerUnit: 'km' }, [
    { kind: 'observation', date: '2024-05-02', odometer: 140000, notes: 'Looked at brakes' },
    { kind: 'odometer', date: '2020', odometer: 100000 },
    { kind: 'observation', date: '2025', odometer: null, notes: 'Rattle' },
  ]);
  assert.equal(summarizeVehicle(saved.collection, vehicleId).odometer.value, 140000);
  assert.equal(summarizeVehicle(saved.collection, vehicleId).odometer.date, '2024-05-02');
  assert.equal(mileageEvidence(saved.collection, vehicleId).points.length, 2);
  assert.equal(vehicleHistory(saved.collection, vehicleId).records[0].date, '2025');
  const edited = History.updateRecord(saved.collection, saved.recordIds[0], { date: '2019', odometer: 90000 });
  assert.equal(summarizeVehicle(edited, vehicleId).odometer.value, 100000);
  const removed = History.removeRecord(edited, saved.recordIds[1]);
  assert.equal(summarizeVehicle(removed, vehicleId).odometer.value, 90000);
  assert.match(summarizeVehicle(removed, vehicleId).history.reason, /unknown/);
});

test('conflicting evidence stays inspectable; equal readings and mixed units are not false conflicts', () => {
  const { collection, vehicleId } = vehicle();
  const saved = History.saveSession(collection, { vehicleId, odometerUnit: 'km' }, [
    { kind: 'odometer', date: '2024-01-01', odometer: 100 },
    { kind: 'odometer', date: '2024-01-01', odometer: 100 },
    { kind: 'odometer', date: '2024-02', odometer: 100, odometerUnit: 'mi' },
  ]);
  assert.deepEqual(mileageEvidence(saved.collection, vehicleId).issues, []);
  assert.equal(summarizeVehicle(saved.collection, vehicleId).odometer.value, 160.9344);
  const conflict = History.updateRecord(saved.collection, saved.recordIds[2], { odometer: 50, odometerUnit: 'km' });
  assert.equal(mileageEvidence(conflict, vehicleId).issues[0].code, 'decrease');
  assert.equal(summarizeVehicle(conflict, vehicleId).odometer.value, null);
  assert.equal(History.listRecords(conflict, vehicleId).length, 3);
  const sameDay = History.updateRecord(saved.collection, saved.recordIds[1], { odometer: 101 });
  assert.equal(mileageEvidence(sameDay, vehicleId).issues[0].code, 'same-day');
});

test('partial-date bounds can use mileage order but do not invent precise dates or unknown readings', () => {
  const { collection, vehicleId } = vehicle();
  const saved = History.saveSession(collection, { vehicleId, odometerUnit: 'km' }, [
    { kind: 'odometer', date: '2024', odometer: 200 },
    { kind: 'odometer', date: '2024-06', odometer: 100 },
    { kind: 'observation', date: '2024', odometer: null, notes: 'Unknown order' },
  ]);
  assert.equal(summarizeVehicle(saved.collection, vehicleId).odometer.value, 200);
  assert.equal(summarizeVehicle(saved.collection, vehicleId).odometer.date, '2024');
  assert.equal(vehicleHistory(saved.collection, vehicleId).records[0].id, saved.recordIds[0]);
  assert.ok(vehicleHistory(saved.collection, vehicleId).issues.some(issue => issue.code === 'ambiguous'));
  assert.deepEqual(History.dateBounds('2024-02'), { start: 20240201, end: 20240229 });
  assert.throws(() => History.dateBounds('1900-02-29'));
  assert.throws(() => History.dateBounds('0000'));
});

test('invalid partial sessions are atomic and unknown values remain distinct from zero across vehicles', () => {
  const first = vehicle();
  const second = History.saveVehicle(first.collection, { name: 'Truck', odometerUnit: 'mi' });
  const defaults = { vehicleId: first.vehicleId, date: '2000-02-29', odometerUnit: 'km' };
  const before = serialize(second.collection);
  for (const change of [{ date: '2024-13' }, { date: '2023-02-29' }, { odometer: -1 }, { odometer: Infinity }, { odometer: '0' }, { odometerUnit: 'm' }, { token: 'secret' }]) {
    assert.throws(() => History.saveSession(second.collection, defaults, [{ kind: 'observation', odometer: 1 }, { kind: 'observation', ...change }]));
    assert.equal(serialize(second.collection), before);
  }
  const saved = History.saveSession(second.collection, defaults, [
    { kind: 'odometer', odometer: 0 },
    { kind: 'observation', vehicleId: second.vehicleId, odometer: null, notes: '' },
  ]);
  assert.equal(summarizeVehicle(saved.collection, first.vehicleId).odometer.value, 0);
  assert.equal(summarizeVehicle(saved.collection, second.vehicleId).odometer.value, null);
  const changedUnits = History.saveVehicle(saved.collection, { name: 'Older Civic', odometerUnit: 'mi' }, first.vehicleId);
  assert.equal(History.getRecord(changedUnits.collection, saved.recordIds[0]).odometerUnit, 'km');
  assert.deepEqual(deserialize(serialize(saved.collection)), saved.collection);
});

test('correcting a record vehicle preserves its identity and leaves sibling records alone', () => {
  const first = vehicle();
  const second = History.saveVehicle(first.collection, { name: 'Truck', odometerUnit: 'mi' });
  const saved = History.saveSession(second.collection, { vehicleId: first.vehicleId, date: '2020', odometerUnit: 'km' }, [
    { kind: 'observation', notes: 'Wrong vehicle selected' }, { kind: 'odometer', odometer: 123 },
  ]);
  const corrected = History.updateRecord(saved.collection, saved.recordIds[0], { vehicleId: second.vehicleId });
  assert.equal(History.listRecords(corrected, second.vehicleId)[0].id, saved.recordIds[0]);
  assert.deepEqual(History.listRecords(corrected, first.vehicleId), [saved.collection.records[1]]);
  assert.throws(() => History.updateRecord(corrected, saved.recordIds[0], { vehicleId: crypto.randomUUID() }));
});

test('equal mileage is nonconflicting but overlapping approximate dates still have unknown order', () => {
  const { collection, vehicleId } = vehicle();
  const saved = History.saveSession(collection, { vehicleId, odometerUnit: 'km', odometer: 100 }, [
    { kind: 'observation', date: '2024' }, { kind: 'observation', date: '2024-06' },
  ]);
  assert.equal(mileageEvidence(saved.collection, vehicleId).issues[0].code, 'ambiguous');
  assert.equal(vehicleHistory(saved.collection, vehicleId).issues[0].code, 'ambiguous');
  const summary = summarizeVehicle(saved.collection, vehicleId);
  assert.equal(summary.odometer.value, 100);
  assert.equal(summary.odometer.date, null);
  assert.match(summary.odometer.reason, /Latest date uncertain/);
  assert.match(summary.odometer.reason, /2024-06/);
  const later = History.saveSession(saved.collection, { vehicleId, odometerUnit: 'km', odometer: 100 }, [{ kind: 'odometer', date: '2025-01-01' }]);
  assert.equal(summarizeVehicle(later.collection, vehicleId).odometer.date, '2025-01-01');
});

test('car activities retain their actual kind and fueling facts through edits and reopening', () => {
  const { collection, vehicleId } = vehicle();
  const saved = History.saveSession(collection, { vehicleId, date: '2024-06-01', odometer: 120000, odometerUnit: 'km' }, [
    { kind: 'fueling', fuelAmount: 42.5, fuelUnit: 'L', tankStatus: 'full' },
    { kind: 'oil-change', notes: '5W-30 and new filter' },
    { kind: 'tire-change', notes: 'Summer tires installed' },
    { kind: 'maintenance', notes: 'Replaced cabin air filter' },
    { kind: 'observation', notes: 'Checked coolant level' },
  ]);
  const reopened = deserialize(serialize(saved.collection));
  assert.deepEqual(reopened.records.map(record => record.kind), ['fueling', 'oil-change', 'tire-change', 'maintenance', 'observation']);
  assert.equal(reopened.records[0].fuelAmount, 42.5);
  assert.equal(reopened.records[0].tankStatus, 'full');
  assert.equal(mileageEvidence(reopened, vehicleId).points.length, 5);
  assert.throws(() => History.updateRecord(reopened, saved.recordIds[0], { fuelAmount: 0 }));
  const partial = History.updateRecord(reopened, saved.recordIds[0], { fuelAmount: null, odometer: null, tankStatus: 'unknown' });
  assert.equal(deserialize(serialize(partial)).records[0].fuelAmount, null);
});

test('deleting a vehicle deletes only its history and retains all deletion identities', () => {
  const first = vehicle();
  const second = History.saveVehicle(first.collection, { name: 'Keep me', odometerUnit: 'mi' });
  const saved = History.saveSession(second.collection, { date: '2024-01-01', odometerUnit: 'km' }, [
    { kind: 'oil-change', vehicleId: first.vehicleId },
    { kind: 'observation', vehicleId: second.vehicleId, notes: 'Keep this history' },
  ]);
  const removed = History.removeVehicle(saved.collection, first.vehicleId);
  assert.equal(removed.vehicles.length, 1);
  assert.equal(removed.vehicles[0].id, second.vehicleId);
  assert.deepEqual(removed.records, [saved.collection.records[1]]);
  assert.deepEqual(new Set(removed.tombstones.map(marker => marker.id)), new Set([first.vehicleId, saved.recordIds[0]]));
  assert.deepEqual(deserialize(serialize(removed)), removed);
});

test('fuel units distinguish litres, US gallons, and Imperial gallons without reinterpreting older entries', () => {
  const first = History.saveVehicle(History.createCollection(), { name: 'Car', odometerUnit: 'mi', fuelUnit: 'US gal' });
  const saved = History.saveSession(first.collection, { vehicleId: first.vehicleId, date: '2024-01-01', odometerUnit: 'mi' }, [
    { kind: 'fueling', fuelAmount: 10, fuelUnit: 'US gal', tankStatus: 'full' },
  ]);
  const changed = History.saveVehicle(saved.collection, { name: 'Car', odometerUnit: 'mi', fuelUnit: 'Imp gal' }, first.vehicleId);
  assert.equal(History.getVehicle(changed.collection, first.vehicleId).fuelUnit, 'Imp gal');
  assert.equal(History.getRecord(changed.collection, saved.recordIds[0]).fuelUnit, 'US gal');
  assert.equal(History.getRecord(changed.collection, saved.recordIds[0]).fuelAmount, 10);
  assert.deepEqual(deserialize(serialize(changed.collection)), changed.collection);
  assert.throws(() => History.updateRecord(changed.collection, saved.recordIds[0], { fuelUnit: 'gal' }));
});
