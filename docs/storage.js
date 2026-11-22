import { validateCollection, migrateCollection } from './history.js?v=313a75df76a0';

export const DATABASE_NAME = 'car-maintenance-tracker';
const DATABASE_VERSION = 1;

export function serialize(collection) {
  return JSON.stringify(validateCollection(collection));
}

export function deserialize(json) {
  return migrateCollection(JSON.parse(json));
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

  async function load() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('workspace', 'readonly');
      const request = transaction.objectStore('workspace').get('active');
      transaction.onabort = () => reject(transaction.error ?? new Error('Local read was interrupted.'));
      transaction.oncomplete = () => {
        try {
          if (request.result === undefined) { resolve(null); return; }
          const saved = request.result;
          const snapshot = { collection: deserialize(saved.json), selectedVehicleId: saved.selectedVehicleId, revision: saved.revision };
          validateSnapshot(snapshot);
          if (!Number.isSafeInteger(snapshot.revision) || snapshot.revision < 1) throw new Error('Invalid local revision.');
          resolve(snapshot);
        } catch (error) { reject(error); }
      };
    });
  }

  async function save(snapshot) {
    validateSnapshot(snapshot);
    const json = serialize(snapshot.collection);
    const selectedVehicleId = snapshot.selectedVehicleId;
    const revision = snapshot.revision;
    if (!Number.isSafeInteger(revision) || revision < 0) throw new Error('Invalid local revision.');
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
        store.put({ json, selectedVehicleId, revision: revision + 1 }, 'active');
      };
      transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Local save was interrupted.'));
      // A successful request is not a committed transaction.
      transaction.oncomplete = () => resolve({ revision: revision + 1 });
    });
  }

  return { load, save };
}
