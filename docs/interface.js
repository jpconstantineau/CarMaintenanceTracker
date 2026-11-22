import { createCollection, getVehicle, saveVehicle, getRecord, saveSession, updateRecord, removeRecord, HISTORY_TYPES } from './history.js';
import { summarizeVehicle, vehicleHistory } from './calculations.js';

const dateLabel = date => `${date}${date.length === 4 ? ' (year known)' : date.length === 7 ? ' (month known)' : ''}`;
const mileageLabel = (value, unit) => value === null ? 'Mileage unknown' : `${new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(value)} ${unit}`;
const kindLabels = { observation: 'Observation', odometer: 'Odometer reading', gap: 'Known gap' };

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
  let historyEditing = false;
  let removedDraftIds = [];
  let fieldSequence = 0;

  function status(message, error = '') {
    byId('save-status').textContent = message;
    byId('storage-error').textContent = error;
    byId('retry').hidden = !error || !byId('vehicle-editor').hidden || !byId('history-editor').hidden;
  }

  function screen(id, focusId) {
    for (const name of ['selection', 'vehicle-summary', 'vehicle-editor', 'history-view', 'history-editor']) byId(name).hidden = name !== id;
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
    byId('summary-mileage').textContent = summary.odometer.value === null ? `Unknown — ${summary.odometer.reason}` :
      `${mileageLabel(summary.odometer.value, summary.odometer.unit)} — ${summary.odometer.date ? dateLabel(summary.odometer.date) : summary.odometer.reason}`;
    byId('summary-history').textContent = `${summary.history.count ? `${summary.history.count} records.` : 'No entries yet.'} ${summary.history.reason}`;
    byId('summary-notes').textContent = vehicle.notes || 'No notes added.';
    screen('vehicle-summary', focus ? 'vehicle-title' : null);
  }

  async function persist() {
    busy = true;
    pending = true;
    byId('editor-fields').disabled = true;
    byId('history-fields').disabled = true;
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
      byId('history-fields').disabled = false;
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

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function button(label, action) {
    const control = element('button', label, 'secondary');
    control.type = 'button';
    control.addEventListener('click', action);
    return control;
  }

  function showHistory() {
    render(false);
    const vehicle = getVehicle(snapshot.collection, snapshot.selectedVehicleId);
    byId('history-title').textContent = `History — ${vehicle.name}`;
    const history = vehicleHistory(snapshot.collection, vehicle.id);
    byId('history-empty').hidden = history.records.length > 0;
    const list = byId('history-list');
    list.replaceChildren();
    history.records.forEach((record, index) => {
      const row = element('li');
      row.append(element('h3', `${kindLabels[record.kind]} — ${dateLabel(record.date)}`));
      row.append(element('p', record.kind === 'gap' ? `${record.historyType} history missing through ${dateLabel(record.endDate)}` : mileageLabel(record.odometer, record.odometerUnit)));
      if (record.notes) row.append(element('p', record.notes, 'record-notes'));
      const messages = new Set(history.issues.filter(issue => issue.recordIds.includes(record.id)).map(issue => issue.message));
      for (const message of messages) {
        row.append(element('p', message, 'review-note'));
      }
      const actions = element('div', undefined, 'actions');
      actions.append(button(`Edit record ${index + 1}`, () => openHistoryEditor(record.id)), button(`Remove record ${index + 1}`, async () => {
        if (busy || !view.confirm(`Remove this ${kindLabels[record.kind].toLowerCase()} from ${dateLabel(record.date)}?`)) return;
        snapshot.collection = removeRecord(snapshot.collection, record.id);
        await persist();
        showHistory();
      }));
      row.append(actions);
      list.append(row);
    });
    screen('history-view', 'history-title');
  }

  function draftChanged() {
    dirty = true;
    byId('save-status').textContent = 'Unsaved history — submit to save on this device.';
  }

  function historyField(parent, name, label, value, options = {}) {
    const wrapper = element('div', undefined, 'field');
    const control = element(options.choices ? 'select' : options.multiline ? 'textarea' : 'input');
    control.id = `history-field-${++fieldSequence}`;
    control.name = control.id;
    control.dataset.field = name;
    const caption = element('label', label);
    caption.htmlFor = control.id;
    if (options.choices) {
      for (const [key, text] of options.choices) {
        const choice = element('option', text);
        choice.value = key;
        control.append(choice);
      }
    } else if (options.multiline) { control.rows = 3; control.maxLength = 5000; }
    else if (name === 'odometer') { control.type = 'number'; control.min = '0'; control.step = 'any'; control.inputMode = 'decimal'; }
    else { control.maxLength = 10; }
    control.required = Boolean(options.required);
    control.disabled = Boolean(options.disabled);
    control.value = value ?? '';
    control.setAttribute('aria-invalid', 'false');
    wrapper.append(caption);
    if (name === 'date' || name === 'endDate') {
      const hint = element('p', 'YYYY-MM-DD, YYYY-MM, or YYYY.', 'hint');
      hint.id = `${control.id}-hint`;
      control.setAttribute('aria-describedby', hint.id);
      wrapper.append(hint);
    }
    const error = element('p', '', 'field-error');
    error.id = `${control.name}-error`;
    error.hidden = true;
    wrapper.append(control, error);
    parent.append(wrapper);
    return control;
  }

  function addDraft(kind, record = null) {
    const vehicle = getVehicle(snapshot.collection, snapshot.selectedVehicleId);
    const row = element('fieldset', undefined, 'record-editor');
    row.dataset.kind = kind;
    if (record) row.dataset.recordId = record.id;
    row.append(element('legend', kindLabels[kind]));
    historyField(row, 'vehicleId', 'Vehicle', record?.vehicleId ?? vehicle.id, {
      choices: snapshot.collection.vehicles.map(value => [value.id, value.name]),
    });
    const date = historyField(row, 'date', kind === 'gap' ? 'Start date (required)' : 'Date (required)', record?.date ?? byId('default-date').value, { required: true });
    if (kind === 'gap') {
      historyField(row, 'endDate', 'End date (required)', record?.endDate ?? byId('default-date').value, { required: true });
      historyField(row, 'historyType', 'Affected history', record?.historyType ?? 'all', { choices: HISTORY_TYPES.map(type => [type, type === 'all' ? 'All history' : type[0].toUpperCase() + type.slice(1)]) });
    } else {
      historyField(row, 'odometer', `Odometer (${kind === 'odometer' ? 'required' : 'optional'})`, record ? record.odometer : byId('default-odometer').value, { required: kind === 'odometer' });
      historyField(row, 'odometerUnit', 'Reading units', record?.odometerUnit ?? vehicle.odometerUnit, { choices: [['km', 'Kilometres (km)'], ['mi', 'Miles (mi)']] });
    }
    historyField(row, 'notes', 'Notes (optional)', record?.notes ?? '', { multiline: true });
    if (!historyEditing) row.append(button('Discard draft record', () => {
      if (row.dataset.recordId) removedDraftIds.push(row.dataset.recordId);
      row.remove();
      draftChanged();
      byId('add-observation').focus();
    }));
    byId('record-editors').append(row);
    date.focus();
    if (!record) draftChanged();
  }

  function openHistoryEditor(recordId = null) {
    if (busy) return;
    dirty = false;
    removedDraftIds = [];
    historyEditing = Boolean(recordId);
    byId('record-editors').replaceChildren();
    byId('history-error').textContent = '';
    byId('history-editor-title').textContent = historyEditing ? 'Edit history record' : 'Record history';
    byId('history-vehicle').textContent = getVehicle(snapshot.collection, snapshot.selectedVehicleId).name;
    byId('default-odometer-label').textContent = `Default odometer (${getVehicle(snapshot.collection, snapshot.selectedVehicleId).odometerUnit}, optional)`;
    byId('session-defaults').hidden = historyEditing;
    byId('session-add-actions').hidden = historyEditing;
    byId('submit-history').textContent = historyEditing ? 'Save record' : 'Save records';
    byId('default-date').value = '';
    byId('default-odometer').value = '';
    byId('retry').hidden = true;
    screen('history-editor', historyEditing ? 'history-editor-title' : 'default-date');
    if (recordId) {
      const record = getRecord(snapshot.collection, recordId);
      addDraft(record.kind, record);
    }
  }

  function historyError(control, message) {
    if (!control) { byId('history-error').textContent = message; byId('history-error').focus(); return; }
    clearError(control);
    control.setAttribute('aria-invalid', 'true');
    const error = byId(`${control.name}-error`);
    error.textContent = message;
    error.hidden = false;
    control.setAttribute('aria-describedby', [control.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
    control.focus();
  }

  byId('history-form').addEventListener('input', event => {
    clearError(event.target);
    byId('history-error').textContent = '';
    draftChanged();
  });
  byId('history-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const rows = [...byId('record-editors').children];
    if (!rows.length) { historyError(null, 'Add at least one record before saving.'); return; }
    let collection = snapshot.collection;
    const assigned = [];
    for (const row of rows) {
      const controls = [...row.querySelectorAll('[data-field]')];
      const invalid = controls.find(control => !control.disabled && !control.validity.valid);
      if (invalid) { historyError(invalid, invalid.validationMessage); return; }
      const details = Object.fromEntries(controls.map(control => [control.dataset.field, control.value]));
      if ('odometer' in details) details.odometer = details.odometer === '' ? null : Number(details.odometer);
      try {
        if (row.dataset.recordId) {
          collection = updateRecord(collection, row.dataset.recordId, details);
        } else {
          const result = saveSession(collection, {}, [{ kind: row.dataset.kind, ...details }]);
          collection = result.collection;
          assigned.push([row, result.recordIds[0]]);
        }
      } catch (error) {
        historyError(controls.find(control => control.dataset.field === error.field), error.message);
        return;
      }
    }
    for (const recordId of removedDraftIds) collection = removeRecord(collection, recordId);
    removedDraftIds = [];
    for (const [row, recordId] of assigned) row.dataset.recordId = recordId;
    snapshot.collection = collection;
    if (await persist()) { dirty = false; showHistory(); }
    else byId('submit-history').textContent = 'Retry saving history';
  });

  byId('record-history').addEventListener('click', () => openHistoryEditor());
  byId('history-add').addEventListener('click', () => openHistoryEditor());
  byId('view-history').addEventListener('click', () => { if (!busy) showHistory(); });
  byId('history-summary').addEventListener('click', () => { if (!busy) render(); });
  for (const kind of ['observation', 'odometer', 'gap']) byId(`add-${kind}`).addEventListener('click', () => addDraft(kind));
  byId('cancel-history').addEventListener('click', () => {
    if (busy) return;
    dirty = false;
    showHistory();
    if (pending) byId('retry').hidden = false;
    else status('Saved on this device.');
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
