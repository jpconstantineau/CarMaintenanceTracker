import { getVehicle, listRecords, listItems, dateBounds } from './history.js?v=5690864654b3';

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
  return { vehicle, odometer: summarizeMileage(evidence, vehicle.odometerUnit),
    history: { count: collection.records.filter(record => record.vehicleId === vehicleId).length, reason: 'Earlier maintenance history is unknown.' } };
}

function summarizeMileage(evidence, unit) {
  const latest = [...evidence.points].sort((a, b) => a.value - b.value || a.end - b.end || a.start - b.start).at(-1);
  const latestReadings = latest ? evidence.points.filter(point => Math.abs(point.value - latest.value) < 1e-8) : [];
  const latestDates = [...new Set(latestReadings.filter(point => !latestReadings.some(other => other.start > point.end)).map(point => point.date))].sort();
  const conflicting = evidence.issues.some(issue => issue.code !== 'ambiguous');
  return conflicting ? { value: null, unit, date: null, reason: 'Conflicting mileage evidence — review vehicle history.' } :
      latest ? { value: latest.value, unit: latest.unit, date: latestDates.length === 1 ? latestDates[0] : null,
        reason: latestDates.length === 1 ? null : `Latest date uncertain (${latestDates.join('; ')}). Review vehicle history.` } :
      { value: null, unit, date: null, reason: 'No odometer readings recorded.' };
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
    const services = records.filter(record => ['maintenance', 'oil-change'].includes(record.kind));
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

function oilCalendar(forecast, evidence, latest) {
  if (!forecast || forecast.source === 'observed') return { reason: 'A projected distance is needed for a calendar estimate.' };
  if (latest.value === null || latest.date?.length !== 10) return { reason: 'Latest mileage needs an unambiguous exact date for a calendar estimate.' };
  const dated = evidence.points.filter(point => point.date.length === 10);
  const dates = [...new Set(dated.map(point => point.date))].sort().slice(-2);
  if (dates.length < 2) return { reason: 'Two suitable dated odometers are needed for a calendar estimate.' };
  const support = dates.map(date => dated.find(point => point.date === date));
  const [from, to] = support;
  const supportIds = new Set(dated.filter(point => dates.includes(point.date)).map(point => point.recordId));
  if (evidence.issues.some(issue => issue.code !== 'ambiguous' && issue.recordIds.some(id => supportIds.has(id))) ||
      evidence.points.some(point => point.date.length !== 10 && point.end >= from.start) ||
      evidence.gaps.some(gap => dateBounds(gap.date).start <= to.end && dateBounds(gap.endDate).end >= from.start)) {
    return { reason: 'Ambiguous dates or missing mileage records prevent a calendar estimate.' };
  }
  const day = date => Date.parse(`${date}T00:00:00Z`) / 86400000;
  const rate = (to.value - from.value) / (day(to.date) - day(from.date));
  if (!(rate > 0)) return { reason: 'The latest two suitable odometers do not establish a positive driving rate.' };
  const remainingDistance = Math.max(0, forecast.dueMileage - to.value);
  const target = (day(to.date) + Math.ceil(remainingDistance / rate)) * 86400000;
  if (!Number.isFinite(target) || target > Date.parse('9999-12-31T00:00:00Z')) return { reason: 'Calendar estimate exceeds the supported calendar.' };
  return { value: { date: new Date(target).toISOString().slice(0, 10), rate, remainingDistance, support } };
}

// Forecasts are derived from retained facts, never written back to history.
export function oilSummary(collection, vehicleId) {
  const vehicle = getVehicle(collection, vehicleId);
  const history = vehicleHistory(collection, vehicleId);
  const evidence = mileageEvidence(collection, vehicleId);
  const compare = chronologyComparator(evidence);
  const records = history.records.filter(record => record.kind.startsWith('oil-'));
  const changes = records.filter(record => record.kind === 'oil-change');
  const candidates = changes.filter(change => !changes.some(other => other !== change && compare(other, change) > 0));
  const lastChange = candidates.length === 1 ? candidates[0] : null;
  const readings = records.filter(record => record.kind === 'oil-life' && record.oilLife !== null &&
    (!lastChange || compare(record, lastChange) > 0)).reverse();
  const result = { records, lastChange, unit: vehicle.odometerUnit, intervals: [], median: null, count: 0,
    coverage: lastChange ? `Since recorded oil change ${lastChange.date}.` : 'Earlier oil change unknown; coverage starts at the first recorded oil-life reading.',
    forecast: null, calendar: null, calendarReason: '', reasons: [] };
  const serviceGaps = history.records.filter(record => record.kind === 'gap' && ['all', 'oil', 'maintenance'].includes(record.historyType));
  const conflicts = new Set(evidence.issues.filter(issue => issue.code !== 'ambiguous').flatMap(issue => issue.recordIds));
  const start = lastChange ?? readings[0];
  const currentPoints = evidence.points.filter(point => !start || point.end >= dateBounds(start.date).start);
  const currentIds = new Set(currentPoints.map(point => point.recordId));
  const currentIssues = evidence.issues.filter(issue => issue.recordIds.some(id => currentIds.has(id)));
  const currentConflict = currentIssues.some(issue => issue.code !== 'ambiguous');
  const latestMileage = summarizeMileage({ points: currentPoints, issues: currentIssues }, result.unit);
  for (const from of [...changes].reverse()) {
    for (const to of [...changes].reverse()) {
      if (compare(from, to) >= 0 || from.odometer === null || to.odometer === null || conflicts.has(from.id) || conflicts.has(to.id)) continue;
      if (changes.some(other => other !== from && other !== to && compare(other, from) >= 0 && compare(other, to) <= 0)) continue;
      if (serviceGaps.some(gap => dateBounds(gap.date).start <= dateBounds(to.date).end && dateBounds(gap.endDate).end >= dateBounds(from.date).start)) continue;
      const driven = distance(to.odometer, to.odometerUnit, result.unit) - distance(from.odometer, from.odometerUnit, result.unit);
      if (driven >= 0) result.intervals.push({ from, to, distance: driven, unit: result.unit });
    }
  }
  const distances = result.intervals.map(interval => interval.distance).sort((a, b) => a - b);
  result.count = distances.length;
  if (result.count) result.median = (distances[Math.floor((result.count - 1) / 2)] + distances[Math.floor(result.count / 2)]) / 2;
  function finish() {
    if (!result.forecast && lastChange && lastChange.odometer !== null && result.median !== null &&
        !currentConflict &&
        !serviceGaps.some(gap => dateBounds(gap.endDate).end >= dateBounds(lastChange.date).start)) {
      const dueMileage = distance(lastChange.odometer, lastChange.odometerUnit, result.unit) + result.median;
      const latest = latestMileage;
      result.forecast = { source: 'historical', dueMileage, remainingDistance: latest.value === null ? null : Math.max(0, dueMileage - latest.value),
        reference: latest, support: result.intervals, count: result.count };
    }
    const calendar = oilCalendar(result.forecast, evidence, latestMileage);
    result.calendar = calendar.value ?? null;
    result.calendarReason = calendar.reason ?? '';
    return result;
  }
  if (candidates.length > 1 || (lastChange && records.some(record => record.kind === 'oil-life' && compare(record, lastChange) === 0))) {
    result.reasons.push('Oil-change boundary is ambiguous. Review dates and mileage.');
    return finish();
  }
  const latestLife = readings.at(-1);
  if (latestLife?.oilLife === 0 && readings.every(record => record === latestLife || compare(record, latestLife) < 0 || record.oilLife === 0) &&
      !serviceGaps.some(gap => dateBounds(gap.endDate).end >= dateBounds(latestLife.date).start)) {
    result.forecast = { source: 'observed', dueMileage: latestLife.odometer === null || currentConflict ? null : distance(latestLife.odometer, latestLife.odometerUnit, result.unit),
      remainingDistance: 0, reference: latestLife, support: [latestLife] };
    return finish();
  }
  if (currentConflict) {
    result.reasons.push('Conflicting mileage evidence — review vehicle history.');
    return finish();
  }
  const gaps = history.records.filter(record => record.kind === 'gap' && ['all', 'oil', 'maintenance', 'observation', 'odometer'].includes(record.historyType));
  if (start && gaps.some(gap => dateBounds(gap.endDate).end >= dateBounds(start.date).start)) {
    result.reasons.push('Missing records leave the current oil interval unresolved.');
    return finish();
  }
  for (let index = 0; index < readings.length; index++) {
    for (const later of readings.slice(index + 1)) {
      const earlier = readings[index];
      if (compare(earlier, later) === 0 && !(earlier.date.length === 10 && earlier.date === later.date && earlier.odometer === later.odometer && earlier.odometerUnit === later.odometerUnit && earlier.oilLife === later.oilLife)) {
        result.reasons.push('Oil-life reading order is ambiguous. Review dates and mileage.');
        return finish();
      }
      if (later.oilLife > earlier.oilLife) {
        result.reasons.push('Oil life increased without a recorded change. Review the unresolved reset.');
        return finish();
      }
    }
  }
  const usable = readings.filter(record => record.odometer !== null);
  const points = usable.map(record => ({ x: distance(record.odometer, record.odometerUnit, vehicle.odometerUnit), y: record.oilLife }));
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const denominator = points.reduce((sum, point) => sum + (point.x - meanX) ** 2, 0);
  if (denominator > 0) {
    const slope = points.reduce((sum, point) => sum + (point.x - meanX) * (point.y - meanY), 0) / denominator;
    if (slope < 0) {
      const latest = usable.at(-1), reference = points.at(-1);
      const remainingDistance = Math.max(0, latest.oilLife / -slope);
      result.forecast = { source: 'fit', slope, dueMileage: reference.x + remainingDistance, remainingDistance,
        reference: latest, support: usable, limited: usable.length === 2 };
    }
  }
  if (!result.forecast) result.reasons.push('At least two distinct mileages with declining oil life are needed for a fit.');
  return finish();
}
