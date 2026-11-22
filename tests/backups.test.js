import test from 'node:test';
import assert from 'node:assert/strict';
import * as History from '../docs/history.js';
import * as Storage from '../docs/storage.js';

function vehicle(name = 'Backup car') {
  return History.saveVehicle(History.createCollection(), { name, odometerUnit: 'km' });
}

test('preview and apply combine independent records by ID and repeated imports are idempotent', () => {
  const { collection, vehicleId } = vehicle();
  const local = History.saveSession(collection, { vehicleId, date: '2024', odometerUnit: 'mi' }, [{ kind: 'observation', notes: 'Local check' }]).collection;
  const incoming = History.saveSession(collection, { vehicleId, date: '2024-02', odometerUnit: 'km' }, [{ kind: 'oil-change' }]).collection;
  const before = structuredClone(local);
  const preview = Storage.previewMerge(local, Storage.deserialize(Storage.serialize(incoming)));
  assert.equal(preview.additions.length, 1);
  assert.equal(preview.conflicts.length, 0);
  assert.deepEqual(local, before);
  const merged = Storage.applyMerge(local, incoming);
  assert.equal(merged.records.length, 2);
  assert.equal(merged.records[0].date, '2024');
  assert.equal(merged.records[0].odometer, null);
  assert.deepEqual(Storage.applyMerge(merged, incoming), merged);
});

test('a divergent same-ID vehicle requires a whole-branch choice or explicit permission to merge its histories', () => {
  const { collection, vehicleId } = vehicle();
  const local = History.saveSession(collection, { vehicleId, date: '2024', odometerUnit: 'km' }, [{ kind: 'observation', notes: 'Local car' }]).collection;
  let incoming = History.saveVehicle(collection, { name: 'Independent timestamp collision', odometerUnit: 'mi' }, vehicleId).collection;
  incoming = History.saveSession(incoming, { vehicleId, date: '2023', odometerUnit: 'mi' }, [{ kind: 'oil-change' }]).collection;
  assert.equal(Storage.previewMerge(local, incoming).conflicts[0].group, true);
  assert.throws(() => Storage.applyMerge(local, incoming), /Choose/);
  const retained = Storage.applyMerge(local, incoming, { [vehicleId]: 'local' });
  assert.deepEqual(retained.records, local.records);
  const imported = Storage.applyMerge(local, incoming, { [vehicleId]: 'incoming' });
  assert.deepEqual(imported.vehicles, incoming.vehicles);
  assert.deepEqual(imported.records, incoming.records);
  const combined = Storage.applyMerge(local, incoming, { [vehicleId]: 'merge-incoming' });
  assert.equal(combined.vehicles[0].name, 'Independent timestamp collision');
  assert.equal(combined.records.length, 2);
  assert.equal(combined.records[0].vehicleId, vehicleId);
});

test('record edit/delete conflicts and whole-vehicle cascades preserve explicit choices and markers', () => {
  const { collection, vehicleId } = vehicle();
  const saved = History.saveSession(collection, { vehicleId, date: '2024', odometerUnit: 'km' }, [{ kind: 'oil-change' }]);
  const recordId = saved.recordIds[0];
  const removed = History.removeRecord(saved.collection, recordId);
  assert.throws(() => Storage.applyMerge(saved.collection, removed), /Choose/);
  assert.equal(Storage.applyMerge(saved.collection, removed, { [recordId]: 'incoming' }).records.length, 0);
  const withExtra = History.saveSession(saved.collection, { vehicleId, date: '2025', odometerUnit: 'km' }, [{ kind: 'observation' }]).collection;
  const deletedVehicle = History.removeVehicle(saved.collection, vehicleId);
  const result = Storage.applyMerge(withExtra, deletedVehicle, { [vehicleId]: 'incoming' });
  assert.equal(result.vehicles.length, 0);
  assert.equal(result.records.length, 0);
  assert.equal(result.tombstones.length, 3);
  assert.deepEqual(Storage.applyMerge(withExtra, deletedVehicle, { [vehicleId]: 'local' }), withExtra);
  assert.deepEqual(Storage.applyMerge(result, deletedVehicle), result);
});

test('item settings and linked history round-trip and item deletion resolves as a complete branch', () => {
  const { collection, vehicleId } = vehicle();
  const item = History.saveItem(collection, vehicleId, { name: 'Air filter', tracking: { distance: { value: 10000, unit: 'mi' }, months: 12, condition: null } });
  const saved = History.saveSession(item.collection, { vehicleId, date: '2024-02', odometerUnit: 'mi' }, [{ kind: 'maintenance', itemId: item.itemId, action: 'Replace', partUsed: 'X', cost: { amount: 12, currency: 'CAD' } }]).collection;
  assert.deepEqual(Storage.deserialize(Storage.serialize(saved)), saved);
  const deleted = History.removeItem(saved, item.itemId);
  assert.deepEqual(Storage.applyMerge(saved, deleted, { [item.itemId]: 'local' }), saved);
  const merged = Storage.applyMerge(saved, deleted, { [item.itemId]: 'incoming' });
  assert.equal(merged.items.length, 0);
  assert.equal(merged.records.length, 0);
  assert.deepEqual(new Set(merged.tombstones.map(marker => marker.id)), new Set(deleted.tombstones.map(marker => marker.id)));
});

test('different collection IDs and matching names do not establish identity or infer deletion from absence', () => {
  const first = vehicle();
  const second = vehicle();
  // Deterministic distinct timestamp ID even if both creations fell in one millisecond.
  second.collection.vehicles[0].id = (Number.parseInt(first.vehicleId, 36) + 1).toString(36);
  const merged = Storage.applyMerge(first.collection, second.collection);
  assert.equal(merged.vehicles.length, 2);
  assert.equal(merged.id, first.collection.id);
  assert.deepEqual(Storage.applyMerge(merged, History.createCollection()), merged);
  // Object key order does not turn an equal vehicle into a conflict.
  const reorderedVehicle = structuredClone(merged);
  reorderedVehicle.vehicles[0] = Object.fromEntries(Object.entries(merged.vehicles[0]).reverse());
  assert.equal(Storage.previewMerge(merged, reorderedVehicle).conflicts.length, 0);
});

test('entire imported format is validated before merge, including unsupported fields and references', () => {
  const { collection } = vehicle();
  const original = structuredClone(collection);
  for (const change of [
    value => { value.schemaVersion = 999; },
    value => { value.credentials = 'secret'; },
    value => { value.vehicles[0].odometerUnit = 'metres'; },
    value => { value.vehicles.push(structuredClone(value.vehicles[0])); },
    value => { value.items = [{ id: crypto.randomUUID(), vehicleId: 'missing' }]; },
    value => { value.records = [{ id: crypto.randomUUID(), vehicleId: value.vehicles[0].id, kind: 'tire-placement' }]; },
  ]) {
    const invalid = structuredClone(collection);
    change(invalid);
    assert.throws(() => Storage.deserialize(JSON.stringify(invalid)));
    assert.throws(() => Storage.previewMerge(collection, invalid));
    assert.deepEqual(collection, original);
  }
  assert.throws(() => Storage.deserialize('{broken'));
});
