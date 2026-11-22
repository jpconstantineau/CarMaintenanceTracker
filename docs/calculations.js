import { getVehicle, listRecords, listItems, dateBounds } from './history.js?v=313a75df76a0';

function distance(value, from, to) {
  if (from === to) return value;
  return from === 'mi' ? value * 1.609344 : value / 1.609344;
}

// All event kinds with a recorded odometer use this one evidence interface.
export function mileageEvidence(collection, vehicleId) {
  const vehicle = getVehicle(collection, vehicleId);
  const records = listRecords(collection, vehicleId);
  const points = records.filter(record => typeof record.odometer === 'number').map(record => ({
    recordId: record.id, kind: record.kind, date: record.date, ...dateBounds(record.date),
    value: distance(record.odometer, record.odometerUnit, vehicle.odometerUnit),
    unit: vehicle.odometerUnit, recordedValue: record.odometer, recordedUnit: record.odometerUnit,
  })).sort((a, b) => a.start - b.start || a.value - b.value || a.recordId.localeCompare(b.recordId));
  const issues = [];
  for (let i = 0; i < points.length; i++) {
    for (const b of points.slice(i + 1)) {
      const a = points[i];
      if (Math.abs(a.value - b.value) < 1e-8) {
        if (a.end >= b.start && (a.date.length < 10 || b.date.length < 10)) issues.push({
          code: 'ambiguous', recordIds: [a.recordId, b.recordId],
          message: 'Equal mileage does not establish order within overlapping approximate dates. Review dates if known.',
        });
        continue;
      }
      const code = a.end < b.start && a.value > b.value ? 'decrease' :
        a.start === a.end && b.start === b.end && a.start === b.start ? 'same-day' : null;
      if (code) issues.push({ code, recordIds: [a.recordId, b.recordId], message: code === 'decrease' ?
        'Mileage decreases across recorded dates. Review these readings.' : 'Different readings share an exact day with no recorded order. Review these readings.' });
    }
  }
  return { points, gaps: records.filter(record => record.kind === 'gap' && ['all', 'odometer'].includes(record.historyType)), issues };
}

function chronologyComparator(evidence) {
  const readings = new Map(evidence.points.map(point => [point.recordId, point.value]));
  const conflictingIds = new Set(evidence.issues.filter(issue => issue.code !== 'ambiguous').flatMap(issue => issue.recordIds));
  return (a, b) => {
    const left = dateBounds(a.date), right = dateBounds(b.date);
    if (left.end < right.start) return -1;
    if (right.end < left.start) return 1;
    if (a.kind === 'gap' || b.kind === 'gap' || !readings.has(a.id) || !readings.has(b.id) || conflictingIds.has(a.id) || conflictingIds.has(b.id)) return 0;
    const difference = readings.get(a.id) - readings.get(b.id);
    return Math.abs(difference) < 1e-8 ? 0 : Math.sign(difference);
  };
}

export function vehicleHistory(collection, vehicleId) {
  const records = listRecords(collection, vehicleId);
  const evidence = mileageEvidence(collection, vehicleId);
  const issues = [...evidence.issues];
  const readings = new Map(evidence.points.map(point => [point.recordId, point.value]));
  const compare = chronologyComparator(evidence);
  const newer = new Map(records.map(record => [record.id, new Set()]));
  for (let i = 0; i < records.length; i++) {
    for (const b of records.slice(i + 1)) {
      const a = records[i];
      const order = compare(a, b);
      if (order < 0) newer.get(a.id).add(b.id);
      else if (order > 0) newer.get(b.id).add(a.id);
      else if (a.kind !== 'gap' && b.kind !== 'gap') {
        if ((!readings.has(a.id) || !readings.has(b.id)) && (a.date.length < 10 || b.date.length < 10)) {
          issues.push({ code: 'ambiguous', recordIds: [a.id, b.id], message: 'Approximate dates overlap without enough mileage evidence to establish order. Review dates if known.' });
        }
      }
    }
  }
  // A deterministic display order is not a claim of precision for unresolved ties.
  const remaining = [...records].sort((a, b) => dateBounds(b.date).start - dateBounds(a.date).start ||
    (readings.get(b.id) ?? -1) - (readings.get(a.id) ?? -1) || a.id.localeCompare(b.id));
  const ordered = [];
  while (remaining.length) {
    const index = remaining.findIndex(record => newer.get(record.id).size === 0);
    const [record] = remaining.splice(index < 0 ? 0 : index, 1);
    ordered.push(record);
    for (const predecessors of newer.values()) predecessors.delete(record.id);
  }
  return { records: ordered, issues };
}

// Pure summaries: unknown observations are never inferred from vehicle age.
export function summarizeVehicle(collection, vehicleId) {
  const vehicle = getVehicle(collection, vehicleId);
  const evidence = mileageEvidence(collection, vehicleId);
  const latest = [...evidence.points].sort((a, b) => a.value - b.value || a.end - b.end || a.start - b.start).at(-1);
  const latestReadings = latest ? evidence.points.filter(point => Math.abs(point.value - latest.value) < 1e-8) : [];
  const latestDates = [...new Set(latestReadings.filter(point => !latestReadings.some(other => other.start > point.end)).map(point => point.date))].sort();
  const conflicting = evidence.issues.some(issue => issue.code !== 'ambiguous');
  return {
    vehicle,
    odometer: conflicting ? { value: null, unit: vehicle.odometerUnit, date: null, reason: 'Conflicting mileage evidence — review vehicle history.' } :
      latest ? { value: latest.value, unit: latest.unit, date: latestDates.length === 1 ? latestDates[0] : null,
        reason: latestDates.length === 1 ? null : `Latest date uncertain (${latestDates.join('; ')}). Review vehicle history.` } :
      { value: null, unit: vehicle.odometerUnit, date: null, reason: 'No odometer readings recorded.' },
    history: { count: collection.records.filter(record => record.vehicleId === vehicleId).length, reason: 'Earlier maintenance history is unknown.' },
  };
}

function addMonths(key, months) {
  const year = Math.floor(key / 10000), month = Math.floor(key / 100) % 100, day = key % 100;
  const total = year * 12 + month - 1 + months;
  const nextYear = Math.floor(total / 12), nextMonth = total % 12 + 1;
  if (nextYear > 9999) return null;
  const prefix = `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}`;
  return `${prefix}-${String(Math.min(day, dateBounds(prefix).end % 100)).padStart(2, '0')}`;
}

// Evaluation date is supplied by the caller; no clocks or persisted forecasts.
export function maintenanceSummary(collection, vehicleId, asOf) {
  const today = dateBounds(asOf);
  if (asOf.length !== 10) throw new Error('Use an exact evaluation date.');
  const vehicle = getVehicle(collection, vehicleId);
  const history = vehicleHistory(collection, vehicleId);
  const mileage = summarizeVehicle(collection, vehicleId).odometer;
  const evidence = mileageEvidence(collection, vehicleId);
  const compare = chronologyComparator(evidence);
  return listItems(collection, vehicleId).map(item => {
    const records = history.records.filter(record => record.itemId === item.id);
    const services = records.filter(record => record.kind === 'maintenance');
    const tracking = item.tracking;
    const result = { item, records, serviceId: null, dueMileage: null, unit: vehicle.odometerUnit, dueDate: null,
      status: 'unavailable', reasons: [], condition: tracking.condition };
    if (!tracking.distance && !tracking.months && !tracking.condition) return { ...result, status: 'history-only' };
    if (tracking.condition) result.reasons.push('Condition threshold configured; no condition measurement result is available.');
    const candidates = services.filter(service => !services.some(other => other !== service && compare(other, service) > 0));
    if (candidates.length !== 1) {
      result.reasons.push(candidates.length ? 'Last completed service is ambiguous. Review item history.' : 'Last completed service is unknown.');
      return result;
    }
    const service = candidates[0], bounds = dateBounds(service.date);
    result.serviceId = service.id;
    const gap = history.records.some(record => record.kind === 'gap' && ['all', 'maintenance'].includes(record.historyType) &&
      dateBounds(record.endDate).end >= bounds.start && dateBounds(record.date).start <= today.end);
    if (gap || bounds.start > today.end) {
      result.reasons.push(gap ? 'Missing maintenance records may include later service. Review vehicle history.' : 'Completed service is dated after the evaluation date.');
      return result;
    }
    const states = [];
    if (tracking.distance) {
      const conflict = evidence.issues.some(issue => issue.code !== 'ambiguous');
      if (service.odometer === null || conflict) {
        states.push('unavailable');
        result.reasons.push(conflict ? 'Conflicting mileage evidence — review vehicle history.' : 'Last service mileage is unknown.');
      } else {
        result.dueMileage = distance(service.odometer, service.odometerUnit, vehicle.odometerUnit) + distance(tracking.distance.value, tracking.distance.unit, vehicle.odometerUnit);
        const futureReading = evidence.points.some(point => point.end > today.end);
        if (futureReading) result.reasons.push('Mileage evidence extends after the evaluation date. Review dates before using the distance status.');
        states.push(mileage.value === null || futureReading ? 'unavailable' : mileage.value >= result.dueMileage ? 'due' : 'not-due');
      }
    }
    if (tracking.months) {
      const earliest = addMonths(bounds.start, tracking.months), latest = addMonths(bounds.end, tracking.months);
      if (earliest && latest) {
        result.dueDate = { earliest, latest };
        states.push(asOf >= latest ? 'due' : asOf < earliest ? 'not-due' : 'uncertain');
      } else { states.push('unavailable'); result.reasons.push('Due date exceeds the supported calendar.'); }
    }
    if (tracking.condition) states.push('unavailable');
    result.status = states.includes('due') ? 'due' : states.includes('uncertain') ? 'uncertain' :
      states.includes('unavailable') || !states.length ? 'unavailable' : 'not-due';
    return result;
  });
}
