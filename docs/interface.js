import { createCollection, getVehicle, saveVehicle } from './history.js';
import { summarizeVehicle } from './calculations.js';

export async function start(document, storage) {
  const byId = id => document.getElementById(id);
  const form = byId('vehicle-form');
  const view = document.defaultView;
  const theme = byId('theme');
  const scheme = document.querySelector('meta[name="color-scheme"]');
  const themeKey = 'car-maintenance-tracker.theme';
  function applyTheme(value) {
    const preference = ['light', 'dark'].includes(value) ? value : 'system';
    scheme.content = preference === 'system' ? 'light dark' : preference;
    theme.value = preference;
  }
  applyTheme(scheme.content);
  theme.addEventListener('change', () => {
    applyTheme(theme.value);
    try {
      if (theme.value === 'system') view.localStorage.removeItem(themeKey);
      else view.localStorage.setItem(themeKey, theme.value);
      byId('theme-status').textContent = '';
    } catch {
      byId('theme-status').textContent = 'Theme applies to this page only.';
    }
  });
  view.addEventListener('storage', event => {
    if (event.key === themeKey || event.key === null) {
      applyTheme(event.newValue);
      byId('theme-status').textContent = '';
    }
  });
  let snapshot;
  let editingId = null;
  let pending = false;
  let dirty = false;
  let busy = false;
  let loaded = false;

  function status(message, error = '') {
    byId('save-status').textContent = message;
    byId('storage-error').textContent = error;
    byId('retry').hidden = !error || !byId('vehicle-editor').hidden;
  }

  function screen(id, focusId) {
    for (const name of ['selection', 'vehicle-summary', 'vehicle-editor']) byId(name).hidden = name !== id;
    if (focusId) byId(focusId).focus();
  }

  function render(focus = true) {
    const list = byId('vehicle-list');
    list.replaceChildren();
    for (const vehicle of snapshot.collection.vehicles) {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = vehicle.name;
      if (vehicle.id === snapshot.selectedVehicleId) button.setAttribute('aria-current', 'true');
      button.addEventListener('click', async () => {
        if (busy) return;
        snapshot.selectedVehicleId = vehicle.id;
        render();
        await persist();
      });
      li.append(button);
      list.append(li);
    }
    if (snapshot.selectedVehicleId === null) {
      screen('selection', focus ? 'selection-title' : null);
      return;
    }
    const summary = summarizeVehicle(snapshot.collection, snapshot.selectedVehicleId);
    const vehicle = summary.vehicle;
    byId('vehicle-title').textContent = vehicle.name;
    byId('vehicle-description').textContent = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ');
    byId('vehicle-description').hidden = !byId('vehicle-description').textContent;
    byId('summary-units').textContent = vehicle.odometerUnit === 'km' ? 'Kilometres (km)' : 'Miles (mi)';
    byId('summary-mileage').textContent = `Unknown — ${summary.odometer.reason}`;
    byId('summary-history').textContent = `No entries yet. ${summary.history.reason}`;
    byId('summary-notes').textContent = vehicle.notes || 'No notes added.';
    screen('vehicle-summary', focus ? 'vehicle-title' : null);
  }

  async function persist() {
    busy = true;
    pending = true;
    byId('editor-fields').disabled = true;
    status('Saving on this device…');
    try {
      const result = await storage.save(snapshot);
      snapshot.revision = result.revision;
      pending = false;
      status('Saved on this device.');
      return true;
    } catch (error) {
      status('Not saved on this device.', `${error.message} Your work is still open here. Retry before closing this page.`);
      return false;
    } finally {
      busy = false;
      byId('editor-fields').disabled = false;
    }
  }

  function clearError(control) {
    control.setAttribute('aria-invalid', 'false');
    const errorId = `${control.name}-error`;
    const error = byId(errorId);
    if (error) { error.hidden = true; error.textContent = ''; }
    const descriptions = (control.getAttribute('aria-describedby') || '').split(' ').filter(value => value && value !== errorId);
    if (descriptions.length) control.setAttribute('aria-describedby', descriptions.join(' '));
    else control.removeAttribute('aria-describedby');
  }

  function showError(name, message) {
    const controls = [...form.elements].filter(control => control.name === name);
    const error = byId(`${name}-error`);
    if (!error) { byId('form-error').textContent = message; return; }
    error.textContent = message;
    error.hidden = false;
    for (const control of controls) {
      control.setAttribute('aria-invalid', 'true');
      control.setAttribute('aria-describedby', [control.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
    }
    controls[0].focus();
  }

  function edit(vehicleId = null) {
    if (busy) return;
    editingId = vehicleId;
    dirty = false;
    form.reset();
    byId('form-error').textContent = '';
    for (const control of form.querySelectorAll('input, textarea')) clearError(control);
    if (vehicleId !== null) {
      const vehicle = getVehicle(snapshot.collection, vehicleId);
      for (const key of ['name', 'make', 'model', 'year', 'notes']) form.elements.namedItem(key).value = vehicle[key] ?? '';
      form.elements.namedItem('odometerUnit').value = vehicle.odometerUnit;
    }
    byId('editor-title').textContent = vehicleId ? 'Edit vehicle details' : 'Add vehicle';
    byId('submit-vehicle').textContent = vehicleId ? 'Save changes' : 'Create vehicle';
    byId('retry').hidden = true;
    screen('vehicle-editor', 'vehicle-name');
  }

  form.addEventListener('input', event => {
    dirty = true;
    if (event.target.name === 'odometerUnit') {
      for (const radio of form.querySelectorAll('[name="odometerUnit"]')) clearError(radio);
    } else clearError(event.target);
    byId('form-error').textContent = '';
    byId('save-status').textContent = 'Unsaved details — submit to save on this device.';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    for (const control of form.querySelectorAll('input, textarea')) {
      if (!control.validity.valid) {
        showError(control.name, control.validationMessage);
        return;
      }
    }
    const values = new view.FormData(form);
    const details = Object.fromEntries(values);
    details.odometerUnit ??= '';
    details.year = details.year === '' ? null : Number(details.year);
    try {
      const result = saveVehicle(snapshot.collection, details, editingId);
      snapshot.collection = result.collection;
      snapshot.selectedVehicleId = result.vehicleId;
      editingId = result.vehicleId;
      if (await persist()) {
        dirty = false;
        render();
      } else {
        byId('submit-vehicle').textContent = 'Retry saving details';
      }
    } catch (error) {
      showError(error.field, error.message);
    }
  });

  byId('add-vehicle').addEventListener('click', () => edit());
  byId('edit-vehicle').addEventListener('click', () => edit(snapshot.selectedVehicleId));
  byId('all-vehicles').addEventListener('click', () => {
    if (!busy) screen('selection', 'selection-title');
  });
  byId('cancel-edit').addEventListener('click', () => {
    if (busy) return;
    dirty = false;
    render();
    if (pending) byId('retry').hidden = false;
    else status(snapshot.revision ? 'Saved on this device.' : 'No vehicles saved yet.');
  });
  byId('retry').addEventListener('click', async () => {
    if (busy) return;
    if (!loaded) await load();
    else await persist();
  });
  view.addEventListener('beforeunload', event => {
    if (pending || dirty) { event.preventDefault(); event.returnValue = ''; }
  });

  async function load() {
    busy = true;
    status('Opening local vehicles…');
    try {
      snapshot = await storage.load() ?? { collection: createCollection(), selectedVehicleId: null, revision: 0 };
      loaded = true;
      render(false);
      status(snapshot.revision ? 'Saved on this device.' : 'No vehicles saved yet.');
    } catch (error) {
      status('Could not open local vehicles.', `${error.message} Existing data has not been replaced. Retry local storage to continue.`);
    } finally { busy = false; }
  }
  await load();
}
