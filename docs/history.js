export const FORMAT = 'car-maintenance-tracker';
export const SCHEMA_VERSION = 2;

export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

function requireValue(condition, message, field) {
  if (!condition) throw new ValidationError(message, field);
}

function shape(value, keys, label) {
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), `${label} must be an object.`);
  requireValue(Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key)), `${label} has missing or unsupported fields.`);
}

function text(value, field, maximum, required = false) {
  requireValue(typeof value === 'string' && value.length <= maximum && (!required || value.trim().length > 0),
    `Enter ${required ? 'a non-blank' : 'an optional'} ${field} of at most ${maximum} characters.`, field);
}

function id(value) {
  requireValue(typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value), 'Expected a stable UUID.');
}

function timestamp(value) {
  requireValue(typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value, 'Expected an ISO edit timestamp.');
}

function vehicleDetails(vehicle) {
  text(vehicle.name, 'name', 100, true);
  requireValue(['km', 'mi'].includes(vehicle.odometerUnit), 'Choose kilometres or miles.', 'odometerUnit');
  text(vehicle.make, 'make', 100);
  text(vehicle.model, 'model', 100);
  text(vehicle.notes, 'notes', 5000);
  requireValue(vehicle.year === null || (Number.isInteger(vehicle.year) && vehicle.year >= 1 && vehicle.year <= 9999), 'Enter a year from 1 to 9999, or leave it blank.', 'year');
}

// New factual record kinds add their complete validator here, with an explicit
// schema migration and fixtures. Unknown kinds are refused, never discarded.
const eventKeys = ['id', 'vehicleId', 'kind', 'date', 'odometer', 'odometerUnit', 'notes', 'createdAt', 'updatedAt'];

// Calendar strings retain precision. Bounds are comparison keys, never saved dates.
export function dateBounds(value, field = 'date') {
  requireValue(typeof value === 'string' && /^[0-9]{4}(-[0-9]{2})?(-[0-9]{2})?$/.test(value), 'Enter a date as YYYY, YYYY-MM, or YYYY-MM-DD.', field);
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  requireValue(year >= 1 && (month === undefined || (month >= 1 && month <= 12)) &&
    (day === undefined || (day >= 1 && day <= days[month - 1])), 'Enter a real calendar date, month, or year.', field);
  return {
    start: year * 10000 + (month ?? 1) * 100 + (day ?? 1),
    end: year * 10000 + (month ?? 12) * 100 + (day ?? days[(month ?? 12) - 1]),
  };
}

function validateEvent(record) {
  shape(record, eventKeys, 'Observation');
  dateBounds(record.date);
  requireValue(record.odometer === null || (typeof record.odometer === 'number' && Number.isFinite(record.odometer) && record.odometer >= 0 && record.odometer <= Number.MAX_SAFE_INTEGER), 'Enter a nonnegative odometer reading, or leave it blank.', 'odometer');
  requireValue(['km', 'mi'].includes(record.odometerUnit), 'Choose kilometres or miles.', 'odometerUnit');
  text(record.notes, 'notes', 5000);
  requireValue(record.kind !== 'odometer' || record.odometer !== null, 'An odometer-only record needs a reading. Choose an observation to keep other partial history.', 'odometer');
  timestamp(record.createdAt);
  timestamp(record.updatedAt);
}

export const HISTORY_TYPES = ['all', 'odometer', 'observation', 'maintenance', 'oil', 'tires', 'fueling'];

function validateGap(record) {
  shape(record, ['id', 'vehicleId', 'kind', 'date', 'endDate', 'historyType', 'notes', 'createdAt', 'updatedAt'], 'Known gap');
  const start = dateBounds(record.date);
  const end = dateBounds(record.endDate, 'endDate');
  requireValue(start.start <= end.end, 'The gap end must not be before its start.', 'endDate');
  requireValue(HISTORY_TYPES.includes(record.historyType), 'Choose the affected history type.', 'historyType');
  text(record.notes, 'notes', 5000);
  timestamp(record.createdAt);
  timestamp(record.updatedAt);
}

const recordValidators = new Map([['odometer', validateEvent], ['observation', validateEvent], ['gap', validateGap]]);

export function validateCollection(collection) {
  return validateVersion(collection, SCHEMA_VERSION);
}

function validateVersion(collection, version) {
  shape(collection, ['format', 'schemaVersion', 'id', 'vehicles', 'records', 'tombstones'], 'Collection');
  requireValue(collection.format === FORMAT, 'This is not a Car Maintenance Tracker collection.');
  requireValue(collection.schemaVersion === version, 'This collection version is not supported. Use a compatible app; your stored data has not been changed.');
  id(collection.id);
  for (const key of ['vehicles', 'records', 'tombstones']) requireValue(Array.isArray(collection[key]), `${key} must be a list.`);
  const identities = new Set([collection.id]);
  const unique = value => {
    id(value);
    requireValue(!identities.has(value), 'Duplicate record identity.');
    identities.add(value);
  };
  for (const vehicle of collection.vehicles) {
    shape(vehicle, ['id', 'name', 'odometerUnit', 'make', 'model', 'year', 'notes', 'createdAt', 'updatedAt'], 'Vehicle');
    unique(vehicle.id);
    vehicleDetails(vehicle);
    timestamp(vehicle.createdAt);
    timestamp(vehicle.updatedAt);
  }
  for (const record of collection.records) {
    requireValue(version !== 1, 'Version one does not support factual records.');
    requireValue(record !== null && typeof record === 'object', 'Record must be an object.');
    unique(record.id);
    requireValue(collection.vehicles.some(vehicle => vehicle.id === record.vehicleId), 'Record refers to a missing vehicle.');
    const validate = recordValidators.get(record.kind);
    requireValue(Boolean(validate), 'This record kind is not supported. Your stored data has not been changed.');
    validate(record, collection);
  }
  for (const marker of collection.tombstones) {
    shape(marker, ['id', 'kind', 'deletedAt'], 'Deletion marker');
    unique(marker.id);
    requireValue(marker.kind === 'vehicle' || (version !== 1 && recordValidators.has(marker.kind)), 'Unsupported deletion kind.');
    timestamp(marker.deletedAt);
  }
  return collection;
}

export function migrateCollection(collection) {
  if (collection?.schemaVersion === 1) {
    validateVersion(collection, 1);
    return validateCollection({ ...structuredClone(collection), schemaVersion: SCHEMA_VERSION });
  }
  return validateCollection(collection);
}

export function createCollection() {
  return { format: FORMAT, schemaVersion: SCHEMA_VERSION, id: crypto.randomUUID(), vehicles: [], records: [], tombstones: [] };
}

export function getVehicle(collection, vehicleId) {
  validateCollection(collection);
  const vehicle = collection.vehicles.find(value => value.id === vehicleId);
  requireValue(Boolean(vehicle), 'Select an existing vehicle.');
  return structuredClone(vehicle);
}

export function saveVehicle(collection, details, vehicleId = null) {
  validateCollection(collection);
  details = { make: '', model: '', year: null, notes: '', ...details };
  shape(details, ['name', 'odometerUnit', 'make', 'model', 'year', 'notes'], 'Vehicle details');
  vehicleDetails(details);
  const next = structuredClone(collection);
  const now = new Date().toISOString();
  const previous = vehicleId === null ? null : getVehicle(collection, vehicleId);
  const vehicle = {
    id: previous?.id ?? crypto.randomUUID(),
    ...details,
    name: details.name.trim(),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
  if (previous) next.vehicles[next.vehicles.findIndex(value => value.id === vehicle.id)] = vehicle;
  else next.vehicles.push(vehicle);
  validateCollection(next);
  return { collection: next, vehicleId: vehicle.id };
}

export function removeVehicle(collection, vehicleId) {
  getVehicle(collection, vehicleId);
  requireValue(!collection.records.some(record => record.vehicleId === vehicleId), 'Remove associated records before removing this vehicle.');
  const next = structuredClone(collection);
  next.vehicles = next.vehicles.filter(vehicle => vehicle.id !== vehicleId);
  next.tombstones.push({ id: vehicleId, kind: 'vehicle', deletedAt: new Date().toISOString() });
  return validateCollection(next);
}

export function listRecords(collection, vehicleId) {
  getVehicle(collection, vehicleId);
  return structuredClone(collection.records.filter(record => record.vehicleId === vehicleId));
}

export function saveSession(collection, defaults, entries) {
  validateCollection(collection);
  requireValue(Array.isArray(entries) && entries.length > 0, 'Add at least one record.');
  const next = structuredClone(collection);
  const now = new Date().toISOString();
  const recordIds = [];
  for (const [index, entry] of entries.entries()) {
    const shared = entry.kind === 'gap' ? { vehicleId: defaults.vehicleId, date: defaults.date } : { odometer: null, ...defaults };
    const record = { notes: '', ...shared, ...entry, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    try {
      getVehicle(collection, record.vehicleId);
      const validate = recordValidators.get(record.kind);
      requireValue(Boolean(validate), 'Choose a supported record kind.', 'kind');
      validate(record);
    } catch (error) { error.entryIndex = index; throw error; }
    next.records.push(record);
    recordIds.push(record.id);
  }
  return { collection: validateCollection(next), recordIds };
}

export function getRecord(collection, recordId) {
  validateCollection(collection);
  const record = collection.records.find(value => value.id === recordId);
  requireValue(Boolean(record), 'Select an existing record.');
  return structuredClone(record);
}

export function updateRecord(collection, recordId, changes) {
  const previous = getRecord(collection, recordId);
  const immutable = ['id', 'vehicleId', 'kind', 'createdAt', 'updatedAt'];
  requireValue(changes !== null && typeof changes === 'object' && Object.keys(changes).every(key => !immutable.includes(key)), 'Record identity, kind, vehicle, and edit metadata cannot be replaced.');
  const next = structuredClone(collection);
  next.records[next.records.findIndex(record => record.id === recordId)] = { ...previous, ...changes, updatedAt: new Date().toISOString() };
  return validateCollection(next);
}

export function removeRecord(collection, recordId) {
  const previous = getRecord(collection, recordId);
  const next = structuredClone(collection);
  next.records = next.records.filter(record => record.id !== recordId);
  next.tombstones.push({ id: recordId, kind: previous.kind, deletedAt: new Date().toISOString() });
  return validateCollection(next);
}
