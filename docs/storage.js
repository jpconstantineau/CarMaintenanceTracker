import { validateCollection, migrateCollection } from './history.js?v=b9a3937625e5';

export const DATABASE_NAME = 'car-maintenance-tracker';
const DATABASE_VERSION = 1;

export function serialize(collection) {
  return JSON.stringify(validateCollection(collection));
}

export function deserialize(json) {
  return migrateCollection(JSON.parse(json));
}

// Compare values, not JSON property order. Arrays retain their factual order.
function equal(left, right) {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every(key => Object.hasOwn(right, key) && equal(left[key], right[key]));
}

const buckets = ['vehicles', 'items', 'records', 'tombstones'];
function entries(collection) {
  return new Map(buckets.flatMap(bucket => collection[bucket].map(value => [value.id, { bucket, value }])));
}

function kind(entry) {
  return entry.bucket === 'vehicles' ? 'vehicle' : entry.bucket === 'items' ? 'item' : entry.value.kind;
}

function descendants(id, type, current, incoming) {
  return [...new Set([current, incoming].flatMap(collection =>
    [...collection.items, ...collection.records].filter(value => type === 'vehicle' ? value.vehicleId === id : value.itemId === id).map(value => value.id)))];
}

export function previewMerge(current, incoming) {
  validateCollection(current);
  validateCollection(incoming);
  const local = entries(current);
  const additions = [];
  const conflicts = [];
  let unchanged = 0;
  for (const [id, entry] of entries(incoming)) {
    const previous = local.get(id);
    if (id === current.id || local.has(incoming.id)) throw new Error('A collection ID collides with a record ID. The file cannot be merged.');
    if (previous && kind(previous) !== kind(entry)) throw new Error('The same ID refers to different record types. The file cannot be merged.');
    if (!previous) additions.push({ id, kind: kind(entry), incoming: entry.value });
    else if (equal(previous, entry) || (previous.bucket === 'tombstones' && entry.bucket === 'tombstones')) unchanged++;
    else {
      const type = kind(entry);
      const group = type === 'vehicle' || (type === 'item' && [previous, entry].some(value => value.bucket === 'tombstones'));
      conflicts.push({ id, kind: type, local: previous.value, incoming: entry.value, group,
        children: group ? descendants(id, type, current, incoming) : [],
        canCombine: type === 'vehicle' && previous.bucket === 'vehicles' && entry.bucket === 'vehicles' });
    }
  }
  return structuredClone({ additions, conflicts, unchanged, differentCollection: current.id !== incoming.id });
}

export function applyMerge(current, incoming, choices = {}) {
  const preview = previewMerge(current, incoming);
  const merged = entries(current);
  const local = entries(current);
  const imported = entries(incoming);
  const covered = new Set();
  for (const addition of preview.additions) merged.set(addition.id, imported.get(addition.id));
  // Resolve parent branches first; a whole-branch decision covers its children.
  const conflicts = [...preview.conflicts].sort((a, b) =>
    (a.kind === 'vehicle' ? 0 : a.group ? 1 : 2) - (b.kind === 'vehicle' ? 0 : b.group ? 1 : 2));
  for (const conflict of conflicts) {
    if (covered.has(conflict.id)) continue;
    const choice = choices[conflict.id];
    const allowed = conflict.canCombine ? ['local', 'incoming', 'merge-local', 'merge-incoming'] : ['local', 'incoming'];
    if (!allowed.includes(choice)) throw new Error('Choose a version for every conflict before merging.');
    const selected = choice.endsWith('incoming') ? imported : local;
    merged.set(conflict.id, selected.get(conflict.id));
    if (conflict.group && !choice.startsWith('merge-')) {
      const parent = selected.get(conflict.id);
      for (const id of conflict.children) {
        covered.add(id);
        if (selected.has(id)) merged.set(id, selected.get(id));
        else if (parent.bucket === 'tombstones') {
          const previous = merged.get(id);
          merged.set(id, { bucket: 'tombstones', value: { id, kind: kind(previous), deletedAt: parent.value.deletedAt } });
        } else merged.delete(id);
      }
    }
  }
  const result = { ...current };
  for (const bucket of buckets) result[bucket] = [...merged.values()].filter(entry => entry.bucket === bucket).map(entry => entry.value);
  return structuredClone(validateCollection(result));
}

function validateSnapshot(snapshot) {
  validateCollection(snapshot.collection);
  if (snapshot.selectedVehicleId !== null && !snapshot.collection.vehicles.some(vehicle => vehicle.id === snapshot.selectedVehicleId)) {
    throw new Error('The selected vehicle is missing from this collection.');
  }
}

export function createLocalStorage({ indexedDB = globalThis.indexedDB, databaseName = DATABASE_NAME } = {}) {
  let connection;
  function open() {
    if (connection) return connection;
    connection = new Promise((resolve, reject) => {
      if (!indexedDB) { reject(new Error('This browser does not provide local storage.')); return; }
      const request = indexedDB.open(databaseName, DATABASE_VERSION);
      let blocked = false;
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('workspace')) db.createObjectStore('workspace');
      };
      request.onblocked = () => {
        blocked = true;
        reject(new Error('Close other Car Maintenance Tracker tabs, then retry.'));
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        if (blocked) { db.close(); return; }
        db.onversionchange = () => { db.close(); connection = undefined; };
        resolve(db);
      };
    }).catch(error => { connection = undefined; throw error; });
    return connection;
  }

  async function readSnapshot(key) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('workspace', 'readonly');
      const request = transaction.objectStore('workspace').get(key);
      transaction.onabort = () => reject(transaction.error ?? new Error('Local read was interrupted.'));
      transaction.oncomplete = () => {
        try {
          if (request.result === undefined) { resolve(null); return; }
          const saved = request.result;
          const snapshot = { collection: deserialize(saved.json), selectedVehicleId: saved.selectedVehicleId, revision: saved.revision };
          validateSnapshot(snapshot);
          if (!Number.isSafeInteger(snapshot.revision) || snapshot.revision < (key === 'active' ? 1 : 0)) throw new Error('Invalid local revision.');
          resolve(snapshot);
        } catch (error) { reject(error); }
      };
    });
  }

  async function writeSnapshot(snapshot, recovery = null) {
    validateSnapshot(snapshot);
    const json = serialize(snapshot.collection);
    const selectedVehicleId = snapshot.selectedVehicleId;
    const revision = snapshot.revision;
    if (!Number.isSafeInteger(revision) || revision < 0) throw new Error('Invalid local revision.');
    let recoveryValue;
    if (recovery) {
      validateSnapshot(recovery);
      if (recovery.revision !== revision) throw new Error('The recovery copy must match the current local revision.');
      recoveryValue = { json: serialize(recovery.collection), selectedVehicleId: recovery.selectedVehicleId, revision };
    }
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('workspace', 'readwrite');
      const store = transaction.objectStore('workspace');
      const read = store.get('active');
      let failure;
      read.onsuccess = () => {
        if ((read.result?.revision ?? 0) !== revision) {
          failure = new Error('Another tab changed this collection. Keep your edits here; reopen in another tab to compare before reloading.');
          transaction.abort();
          return;
        }
        // Both writes share a transaction: a failed recovery write prevents replacement.
        if (recoveryValue) store.put(recoveryValue, 'recovery');
        store.put({ json, selectedVehicleId, revision: revision + 1 }, 'active');
      };
      transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Local save was interrupted.'));
      // A successful request is not a committed transaction.
      transaction.oncomplete = () => resolve({ revision: revision + 1 });
    });
  }

  return {
    load: () => readSnapshot('active'),
    loadRecovery: () => readSnapshot('recovery'),
    save: snapshot => writeSnapshot(snapshot),
    replace: (snapshot, recovery) => {
      if (!recovery) throw new Error('Replacement requires a recovery copy.');
      return writeSnapshot(snapshot, recovery);
    },
  };
}
