export const FORMAT = 'car-maintenance-tracker';
export const SCHEMA_VERSION = 4;
export const FUEL_UNITS = ['L', 'US gal', 'Imp gal'];

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

function id(value, vehicle = false) {
  const stamp = typeof value === 'string' ? Number.parseInt(value, 36) : NaN;
  const timestampId = vehicle && Number.isSafeInteger(stamp) && stamp >= 0 && stamp.toString(36) === value;
  requireValue(typeof value === 'string' && (timestampId || /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)), 'Expected a stable record ID.');
}

function timestamp(value) {
  requireValue(typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value, 'Expected an ISO edit timestamp.');
}

function vehicleDetails(vehicle, version = SCHEMA_VERSION) {
  text(vehicle.name, 'name', 100, true);
  requireValue(['km', 'mi'].includes(vehicle.odometerUnit), 'Choose kilometres or miles.', 'odometerUnit');
  if (version >= 3) requireValue(FUEL_UNITS.includes(vehicle.fuelUnit), 'Choose litres, US gallons, or Imperial gallons.', 'fuelUnit');
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

const itemEventKinds = ['maintenance', 'observation'];
const itemEventDefaults = { itemId: null, action: '', partUsed: '', cost: null };

function validateEvent(record, collection, version = SCHEMA_VERSION) {
  const extra = record.kind === 'fueling' ? ['fuelAmount', 'fuelUnit', 'tankStatus'] :
    version >= 4 && itemEventKinds.includes(record.kind) ? Object.keys(itemEventDefaults) : [];
  shape(record, [...eventKeys, ...extra], 'Vehicle activity');
  dateBounds(record.date);
  requireValue(record.odometer === null || (typeof record.odometer === 'number' && Number.isFinite(record.odometer) && record.odometer >= 0 && record.odometer <= Number.MAX_SAFE_INTEGER), 'Enter a nonnegative odometer reading, or leave it blank.', 'odometer');
  requireValue(['km', 'mi'].includes(record.odometerUnit), 'Choose kilometres or miles.', 'odometerUnit');
  text(record.notes, 'notes', 5000);
  requireValue(record.kind !== 'odometer' || record.odometer !== null, 'An odometer-only record needs a reading. Choose a car activity to keep other partial history.', 'odometer');
  timestamp(record.createdAt);
  timestamp(record.updatedAt);
  if (version >= 4 && itemEventKinds.includes(record.kind)) {
    requireValue(record.itemId === null || collection.items.some(item => item.id === record.itemId && item.vehicleId === record.vehicleId), 'Choose an item belonging to this vehicle.', 'itemId');
    text(record.action, 'action', 100, record.itemId !== null);
    text(record.partUsed, 'partUsed', 500);
    if (record.cost !== null) {
      shape(record.cost, ['amount', 'currency'], 'Cost');
      requireValue(Number.isFinite(record.cost.amount) && record.cost.amount >= 0, 'Enter a nonnegative cost or leave it blank.', 'costAmount');
      requireValue(typeof record.cost.currency === 'string' && /^[A-Z]{3}$/.test(record.cost.currency), 'Enter a three-letter currency, such as CAD.', 'currency');
    }
  }
  if (record.kind === 'fueling') {
    requireValue(record.fuelAmount === null || (typeof record.fuelAmount === 'number' && Number.isFinite(record.fuelAmount) && record.fuelAmount > 0), 'Enter a positive fuel quantity, or leave it blank.', 'fuelAmount');
    requireValue(FUEL_UNITS.includes(record.fuelUnit), 'Choose litres, US gallons, or Imperial gallons.', 'fuelUnit');
    requireValue(['full', 'partial', 'unknown'].includes(record.tankStatus), 'Choose full, partial, or unknown tank status.', 'tankStatus');
  }
}

export const HISTORY_TYPES = ['all', 'odometer', 'observation', 'maintenance', 'oil', 'tires', 'fueling'];

export const COMMON_ITEMS = ['Engine air filter', 'Cabin air filter', 'Oil filter', 'Fuel filter', 'Engine coolant', 'Brake fluid', 'Transmission fluid', 'Brakes', 'Spark plugs', 'Belts', 'Wipers', 'Battery', 'Bulbs'];
const itemDetailKeys = ['name', 'specifications', 'compatibleParts', 'preferredBrand', 'notes', 'links', 'tracking'];

function validateItem(item) {
  shape(item, ['id', 'vehicleId', ...itemDetailKeys, 'createdAt', 'updatedAt'], 'Maintenance item');
  text(item.name, 'name', 100, true);
  for (const key of ['specifications', 'compatibleParts', 'notes']) text(item[key], key, 5000);
  text(item.preferredBrand, 'preferredBrand', 100);
  requireValue(Array.isArray(item.links) && item.links.length <= 20, 'Enter at most 20 reference links.', 'links');
  for (const link of item.links) {
    let url;
    try { url = new URL(link); } catch { /* Report the field below. */ }
    requireValue(typeof link === 'string' && link.length <= 2000 && url && ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password,
      'Use complete http or https reference links without credentials.', 'links');
  }
  const tracking = item.tracking;
  shape(tracking, ['distance', 'months', 'condition'], 'Tracking settings');
  if (tracking.distance !== null) {
    shape(tracking.distance, ['value', 'unit'], 'Distance interval');
    requireValue(Number.isFinite(tracking.distance.value) && tracking.distance.value > 0 && tracking.distance.value <= Number.MAX_SAFE_INTEGER, 'Enter a positive distance interval.', 'distance');
    requireValue(['km', 'mi'].includes(tracking.distance.unit), 'Choose interval kilometres or miles.', 'distanceUnit');
  }
  requireValue(tracking.months === null || (Number.isInteger(tracking.months) && tracking.months > 0 && tracking.months <= 1200), 'Enter a whole number of months from 1 to 1200.', 'months');
  if (tracking.condition !== null) {
    shape(tracking.condition, ['metric', 'unit', 'operator', 'threshold'], 'Condition setting');
    text(tracking.condition.metric, 'metric', 100, true);
    text(tracking.condition.unit, 'conditionUnit', 100, true);
    requireValue(['at-or-below', 'at-or-above'].includes(tracking.condition.operator), 'Choose a condition comparison.', 'operator');
    requireValue(Number.isFinite(tracking.condition.threshold) && tracking.condition.threshold >= 0, 'Enter a nonnegative condition threshold.', 'threshold');
  }
  timestamp(item.createdAt);
  timestamp(item.updatedAt);
}

export function listItems(collection, vehicleId) {
  getVehicle(collection, vehicleId);
  return structuredClone(collection.items.filter(item => item.vehicleId === vehicleId));
}

export function saveItem(collection, vehicleId, details, itemId = null) {
  getVehicle(collection, vehicleId);
  const previous = collection.items.find(item => item.id === itemId && item.vehicleId === vehicleId);
  requireValue(itemId === null || previous, 'Select an existing item on this vehicle.');
  const values = { specifications: '', compatibleParts: '', preferredBrand: '', notes: '', links: [], tracking: { distance: null, months: null, condition: null }, ...details };
  shape(values, itemDetailKeys, 'Item details');
  const now = new Date().toISOString();
  const item = { ...values, id: previous?.id ?? crypto.randomUUID(), vehicleId, createdAt: previous?.createdAt ?? now, updatedAt: now };
  const next = structuredClone(collection);
  if (previous) next.items[next.items.findIndex(value => value.id === itemId)] = structuredClone(item);
  else next.items.push(structuredClone(item));
  return { collection: validateCollection(next), itemId: item.id };
}

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

const recordValidators = new Map([
  ...['odometer', 'observation', 'fueling', 'oil-change', 'tire-change', 'maintenance'].map(kind => [kind, validateEvent]),
  ['gap', validateGap],
]);
const versionTwoKinds = ['odometer', 'observation', 'gap'];

export function validateCollection(collection) {
  return validateVersion(collection, SCHEMA_VERSION);
}

function validateVersion(collection, version) {
  shape(collection, ['format', 'schemaVersion', 'id', 'vehicles', 'records', 'tombstones', ...(version >= 4 ? ['items'] : [])], 'Collection');
  requireValue(collection.format === FORMAT, 'This is not a Car Maintenance Tracker collection.');
  requireValue(collection.schemaVersion === version, 'This collection version is not supported. Use a compatible app; your stored data has not been changed.');
  id(collection.id);
  for (const key of ['vehicles', 'records', 'tombstones']) requireValue(Array.isArray(collection[key]), `${key} must be a list.`);
  const identities = new Set([collection.id]);
  const unique = (value, vehicle = false) => {
    id(value, vehicle);
    requireValue(!identities.has(value), 'Duplicate record identity.');
    identities.add(value);
  };
  for (const vehicle of collection.vehicles) {
    shape(vehicle, ['id', 'name', 'odometerUnit', 'make', 'model', 'year', 'notes', 'createdAt', 'updatedAt', ...(version >= 3 ? ['fuelUnit'] : [])], 'Vehicle');
    unique(vehicle.id, version >= 3);
    vehicleDetails(vehicle, version);
    timestamp(vehicle.createdAt);
    timestamp(vehicle.updatedAt);
  }
  if (version >= 4) {
    requireValue(Array.isArray(collection.items), 'Items must be a list.');
    for (const item of collection.items) {
      unique(item.id);
      requireValue(collection.vehicles.some(vehicle => vehicle.id === item.vehicleId), 'Item refers to a missing vehicle.');
      validateItem(item);
    }
  }
  for (const record of collection.records) {
    requireValue(version !== 1, 'Version one does not support factual records.');
    requireValue(version !== 2 || versionTwoKinds.includes(record?.kind), 'This record kind is not supported in version two.');
    requireValue(record !== null && typeof record === 'object', 'Record must be an object.');
    unique(record.id);
    requireValue(collection.vehicles.some(vehicle => vehicle.id === record.vehicleId), 'Record refers to a missing vehicle.');
    const validate = recordValidators.get(record.kind);
    requireValue(Boolean(validate), 'This record kind is not supported. Your stored data has not been changed.');
    validate(record, collection, version);
  }
  for (const marker of collection.tombstones) {
    shape(marker, ['id', 'kind', 'deletedAt'], 'Deletion marker');
    unique(marker.id, version >= 3 && marker.kind === 'vehicle');
    requireValue(marker.kind === 'vehicle' || (version >= 4 && marker.kind === 'item') || (version !== 1 && recordValidators.has(marker.kind) && (version !== 2 || versionTwoKinds.includes(marker.kind))), 'Unsupported deletion kind.');
    timestamp(marker.deletedAt);
  }
  return collection;
}

export function migrateCollection(collection) {
  if ([1, 2, 3].includes(collection?.schemaVersion)) {
    validateVersion(collection, collection.schemaVersion);
    const migrated = structuredClone(collection);
    migrated.schemaVersion = SCHEMA_VERSION;
    migrated.vehicles = migrated.vehicles.map(vehicle => ({ fuelUnit: 'L', ...vehicle }));
    migrated.items = [];
    migrated.records = migrated.records.map(record => itemEventKinds.includes(record.kind) ? { ...itemEventDefaults, ...record } : record);
    return validateCollection(migrated);
  }
  return validateCollection(collection);
}

export function createCollection() {
  return { format: FORMAT, schemaVersion: SCHEMA_VERSION, id: crypto.randomUUID(), vehicles: [], items: [], records: [], tombstones: [] };
}

export function getVehicle(collection, vehicleId) {
  validateCollection(collection);
  const vehicle = collection.vehicles.find(value => value.id === vehicleId);
  requireValue(Boolean(vehicle), 'Select an existing vehicle.');
  return structuredClone(vehicle);
}

export function saveVehicle(collection, details, vehicleId = null) {
  validateCollection(collection);
  details = { make: '', model: '', year: null, notes: '', fuelUnit: 'L', ...details };
  shape(details, ['name', 'odometerUnit', 'make', 'model', 'year', 'notes', 'fuelUnit'], 'Vehicle details');
  vehicleDetails(details);
  const next = structuredClone(collection);
  const now = new Date().toISOString();
  const previous = vehicleId === null ? null : getVehicle(collection, vehicleId);
  const vehicle = {
    id: previous?.id ?? newVehicleId(collection),
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

function newVehicleId(collection) {
  const used = new Set([collection.id, ...collection.vehicles.map(value => value.id), ...collection.records.map(value => value.id), ...collection.tombstones.map(value => value.id)]);
  let milliseconds = Date.now();
  while (used.has(milliseconds.toString(36))) milliseconds++;
  return milliseconds.toString(36);
}

export function removeVehicle(collection, vehicleId) {
  getVehicle(collection, vehicleId);
  const next = structuredClone(collection);
  const deletedAt = new Date().toISOString();
  for (const record of next.records.filter(record => record.vehicleId === vehicleId)) {
    next.tombstones.push({ id: record.id, kind: record.kind, deletedAt });
  }
  next.records = next.records.filter(record => record.vehicleId !== vehicleId);
  for (const item of next.items.filter(item => item.vehicleId === vehicleId)) next.tombstones.push({ id: item.id, kind: 'item', deletedAt });
  next.items = next.items.filter(item => item.vehicleId !== vehicleId);
  next.vehicles = next.vehicles.filter(vehicle => vehicle.id !== vehicleId);
  next.tombstones.push({ id: vehicleId, kind: 'vehicle', deletedAt });
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
    const record = { notes: '', ...(itemEventKinds.includes(entry.kind) ? itemEventDefaults : {}), ...shared, ...entry, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    try {
      getVehicle(collection, record.vehicleId);
      const validate = recordValidators.get(record.kind);
      requireValue(Boolean(validate), 'Choose a supported record kind.', 'kind');
      validate(record, collection);
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
  const immutable = ['id', 'kind', 'createdAt', 'updatedAt'];
  requireValue(changes !== null && typeof changes === 'object' && Object.keys(changes).every(key => !immutable.includes(key)), 'Record identity, kind, and edit metadata cannot be replaced.');
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
