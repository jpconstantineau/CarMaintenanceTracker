export const FORMAT = 'car-maintenance-tracker';
export const SCHEMA_VERSION = 1;

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
const recordValidators = new Map();

export function validateCollection(collection) {
  shape(collection, ['format', 'schemaVersion', 'id', 'vehicles', 'records', 'tombstones'], 'Collection');
  requireValue(collection.format === FORMAT, 'This is not a Car Maintenance Tracker collection.');
  requireValue(collection.schemaVersion === SCHEMA_VERSION, 'This collection version is not supported. Use a compatible app; your stored data has not been changed.');
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
    requireValue(marker.kind === 'vehicle', 'Unsupported deletion kind.');
    timestamp(marker.deletedAt);
  }
  return collection;
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
