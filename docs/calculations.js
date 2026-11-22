import { getVehicle } from './history.js';

// Pure summaries: unknown observations are never inferred from vehicle age.
export function summarizeVehicle(collection, vehicleId) {
  const vehicle = getVehicle(collection, vehicleId);
  return {
    vehicle,
    odometer: { value: null, unit: vehicle.odometerUnit, reason: 'No odometer readings recorded.' },
    history: { count: collection.records.filter(record => record.vehicleId === vehicleId).length, reason: 'Earlier maintenance history is unknown.' },
  };
}
