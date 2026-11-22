import { getVehicle, listRecords, dateBounds } from './history.js?v=cf4ee93be591';

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

export function vehicleHistory(collection, vehicleId) {
  const records = listRecords(collection, vehicleId);
  const evidence = mileageEvidence(collection, vehicleId);
  const issues = [...evidence.issues];
  const readings = new Map(evidence.points.map(point => [point.recordId, point.value]));
  const newer = new Map(records.map(record => [record.id, new Set()]));
  for (let i = 0; i < records.length; i++) {
    for (const b of records.slice(i + 1)) {
      const a = records[i];
      const left = dateBounds(a.date), right = dateBounds(b.date);
      if (left.end < right.start) newer.get(a.id).add(b.id);
      else if (right.end < left.start) newer.get(b.id).add(a.id);
      else if (a.kind !== 'gap' && b.kind !== 'gap') {
        if (readings.has(a.id) && readings.has(b.id)) {
          const difference = readings.get(a.id) - readings.get(b.id);
          if (Math.abs(difference) >= 1e-8 && !evidence.issues.some(issue => issue.recordIds.includes(a.id) && issue.recordIds.includes(b.id))) {
            newer.get(difference < 0 ? a.id : b.id).add(difference < 0 ? b.id : a.id);
          }
        } else if (a.date.length < 10 || b.date.length < 10) {
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
