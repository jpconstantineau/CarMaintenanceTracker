import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCollection, saveVehicle, getVehicle, removeVehicle, validateCollection } from '../docs/history.js';
import { summarizeVehicle } from '../docs/calculations.js';
import { serialize, deserialize } from '../docs/storage.js';

const details = { name: 'Older car', odometerUnit: 'km', make: '', model: '', year: null, notes: '' };

test('name and units suffice; a 15-year-old car does not invent mileage or history', () => {
  const original = createCollection();
  const result = saveVehicle(original, { name: 'Older car', odometerUnit: 'km', year: 2011 });
  assert.equal(original.vehicles.length, 0);
  const summary = summarizeVehicle(result.collection, result.vehicleId);
  assert.equal(summary.odometer.value, null);
  assert.equal(summary.history.count, 0);
  assert.match(summary.history.reason, /unknown/);
  assert.equal(summary.vehicle.year, 2011);
  assert.deepEqual(deserialize(serialize(result.collection)), result.collection);
});

test('editing and same-name vehicles retain stable independent identities', () => {
  const first = saveVehicle(createCollection(), details);
  const second = saveVehicle(first.collection, { ...details, odometerUnit: 'mi', notes: 'Second' });
  const edited = saveVehicle(second.collection, { ...details, name: 'New name', make: 'Honda', model: 'Civic', year: 2011, notes: 'First' }, first.vehicleId);
  assert.notEqual(first.vehicleId, second.vehicleId);
  assert.equal(edited.collection.id, first.collection.id);
  assert.equal(edited.vehicleId, first.vehicleId);
  assert.deepEqual(getVehicle(edited.collection, second.vehicleId), getVehicle(second.collection, second.vehicleId));
  assert.equal(getVehicle(edited.collection, first.vehicleId).createdAt, getVehicle(first.collection, first.vehicleId).createdAt);
  const detached = getVehicle(edited.collection, first.vehicleId);
  detached.notes = 'Uncommitted';
  assert.equal(getVehicle(edited.collection, first.vehicleId).notes, 'First');
});

for (const [field, value] of [['name', '   '], ['name', 'a'.repeat(101)], ['odometerUnit', 'metres'], ['year', 0], ['year', 1.1], ['year', '2011'], ['notes', 'a'.repeat(5001)]]) {
  test(`invalid ${field} (${String(value).slice(0, 15)}) leaves the collection unchanged`, () => {
    const collection = createCollection();
    const before = serialize(collection);
    assert.throws(() => saveVehicle(collection, { ...details, [field]: value }), error => error.field === field);
    assert.equal(serialize(collection), before);
  });
}

test('deletion markers survive serialization without reusing identities', () => {
  const first = saveVehicle(createCollection(), details);
  const removed = removeVehicle(first.collection, first.vehicleId);
  assert.equal(removed.vehicles.length, 0);
  assert.equal(deserialize(serialize(removed)).tombstones[0].id, first.vehicleId);
  assert.notEqual(saveVehicle(removed, details).vehicleId, first.vehicleId);
  assert.throws(() => saveVehicle(removed, details, first.vehicleId), /existing vehicle/);
});

test('v1 fixture preserves records, deletion markers, original values and identity', async () => {
  const fixture = JSON.parse(await readFile(new URL('./fixtures/collection-v1.json', import.meta.url)));
  const migrated = deserialize(JSON.stringify(fixture));
  assert.deepEqual(migrated, { ...fixture, schemaVersion: 2 });
  assert.deepEqual(deserialize(serialize(migrated)), migrated);
  const result = saveVehicle(migrated, { ...details, name: 'Another car' });
  assert.deepEqual(result.collection.vehicles[0], fixture.vehicles[0]);
  assert.deepEqual(result.collection.tombstones, fixture.tombstones);
});

test('malformed, newer, duplicate, unsupported and credential-bearing collections are refused', () => {
  const { collection, vehicleId } = saveVehicle(createCollection(), details);
  for (const change of [
    value => { value.schemaVersion = 99; },
    value => { value.token = 'not-a-real-token'; },
    value => { value.vehicles.push(value.vehicles[0]); },
    value => { value.vehicles[0].forecast = 0; },
    value => { value.vehicles[0].updatedAt = 'yesterday'; },
    value => { value.records.push({ id: crypto.randomUUID(), vehicleId, kind: 'not-implemented' }); },
    value => { value.records.push({ id: crypto.randomUUID(), vehicleId: crypto.randomUUID(), kind: 'odometer' }); },
  ]) {
    const candidate = structuredClone(collection);
    change(candidate);
    assert.throws(() => serialize(candidate));
    assert.throws(() => deserialize(JSON.stringify(candidate)));
  }
  assert.throws(() => deserialize('{broken'));
  assert.equal(validateCollection(collection), collection);
});
