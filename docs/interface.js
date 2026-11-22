import { createCollection, getVehicle, saveVehicle, removeVehicle, getRecord, saveSession, updateRecord, removeRecord, listItems, saveItem, removeItem, COMMON_ITEMS, HISTORY_TYPES } from './history.js?v=a1d139dcd575';
import { summarizeVehicle, vehicleHistory, maintenanceSummary } from './calculations.js?v=a1d139dcd575';
import { serialize, deserialize, previewMerge, applyMerge } from './storage.js?v=a1d139dcd575';

const dateLabel = date => `${date}${date.length === 4 ? ' (year known)' : date.length === 7 ? ' (month known)' : ''}`;
const mileageLabel = (value, unit) => value === null ? 'Mileage unknown' : `${new Intl.NumberFormat('en', { maximumFractionDigits: 3 }).format(value)} ${unit}`;
const kindLabels = { observation: 'Check / inspection', odometer: 'Odometer reading', gap: 'Missing records', fueling: 'Fueling', 'oil-change': 'Oil change', 'tire-change': 'Tire change', maintenance: 'Maintenance' };
const fuelUnitLabels = { L: 'Litres (L)', 'US gal': 'US gallons (US gal)', 'Imp gal': 'Imperial gallons (Imp gal)' };

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
  let editingItemId = null;
  let historyItemId = null;
  let importCollection = null;
  let importPreview = null;

  function status(message, error = '') {
    byId('save-status').textContent = message;
    byId('storage-error').textContent = error;
    byId('retry').hidden = !error || !byId('vehicle-editor').hidden || !byId('history-editor').hidden || !byId('item-editor').hidden;
  }

  function screen(id, focusId) {
    for (const name of ['selection', 'vehicle-summary', 'vehicle-editor', 'history-view', 'history-editor', 'item-view', 'item-editor', 'backups']) byId(name).hidden = name !== id;
    byId('open-backups').hidden = !loaded || id.endsWith('editor') || id === 'backups';
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
    byId('summary-fuel-units').textContent = fuelUnitLabels[vehicle.fuelUnit];
    byId('summary-mileage').textContent = summary.odometer.value === null ? `Unknown — ${summary.odometer.reason}` :
      `${mileageLabel(summary.odometer.value, summary.odometer.unit)} — ${summary.odometer.date ? dateLabel(summary.odometer.date) : summary.odometer.reason}`;
    byId('summary-history').textContent = `${summary.history.count ? `${summary.history.count} records.` : 'No entries yet.'} ${summary.history.reason}`;
    byId('summary-notes').textContent = vehicle.notes || 'No notes added.';
    const maintenance = byId('maintenance-list');
    maintenance.replaceChildren();
    for (const summary of itemSummaries()) {
      const row = element('li');
      row.append(button(`${summary.item.name} — details`, () => showItem(summary.item.id)), element('p', dueLabel(summary)));
      maintenance.append(row);
    }
    screen('vehicle-summary', focus ? 'vehicle-title' : null);
  }

  async function persist() {
    busy = true;
    pending = true;
    byId('editor-fields').disabled = true;
    byId('history-fields').disabled = true;
    byId('item-fields').disabled = true;
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
      byId('item-fields').disabled = false;
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
    const disclosure = controls[0].closest('details');
    if (disclosure) disclosure.open = true;
    controls[0].focus();
  }

  function edit(vehicleId = null) {
    if (busy) return;
    editingId = vehicleId;
    dirty = false;
    form.reset();
    byId('optional-vehicle-details').open = Boolean(vehicleId);
    byId('form-error').textContent = '';
    for (const control of form.querySelectorAll('input, textarea')) clearError(control);
    if (vehicleId !== null) {
      const vehicle = getVehicle(snapshot.collection, vehicleId);
      for (const key of ['name', 'make', 'model', 'year', 'notes']) form.elements.namedItem(key).value = vehicle[key] ?? '';
      form.elements.namedItem('odometerUnit').value = vehicle.odometerUnit;
      form.elements.namedItem('fuelUnit').value = vehicle.fuelUnit;
    }
    byId('editor-title').textContent = vehicleId ? 'Edit vehicle details' : 'Add vehicle';
    byId('submit-vehicle').textContent = vehicleId ? 'Save changes' : 'Create vehicle';
    byId('delete-vehicle').hidden = !vehicleId;
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
  byId('delete-vehicle').addEventListener('click', async () => {
    if (busy || !editingId) return;
    const vehicle = getVehicle(snapshot.collection, editingId);
    if (!view.confirm(`Delete “${vehicle.name}” and all of its history? This cannot be undone in the app.`)) return;
    snapshot.collection = removeVehicle(snapshot.collection, editingId);
    snapshot.selectedVehicleId = snapshot.collection.vehicles[0]?.id ?? null;
    editingId = null;
    dirty = false;
    await persist();
    render();
    if (pending) byId('retry').hidden = false;
  });
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

  function itemSummaries() {
    const now = new Date();
    const asOf = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return maintenanceSummary(snapshot.collection, snapshot.selectedVehicleId, asOf);
  }

  function dueLabel(summary) {
    const states = { 'history-only': 'History only', due: 'Due', 'not-due': 'Not due by known mileage and date', uncertain: 'Due date uncertain', unavailable: 'Due status unavailable' };
    const parts = [states[summary.status]];
    if (summary.dueMileage !== null) parts.push(`Due at ${mileageLabel(summary.dueMileage, summary.unit)}`);
    if (summary.dueDate) parts.push(`Due ${summary.dueDate.earliest === summary.dueDate.latest ? summary.dueDate.earliest : `${summary.dueDate.earliest} to ${summary.dueDate.latest}`}`);
    return parts.join(' · ');
  }

  function itemAction(kind, item) {
    return `${kind === 'observation' ? 'Inspect' : item.name.toLowerCase().includes('brake') ? 'Service' : 'Replace'} ${item.name}`;
  }

  function recordItem(kind, item) {
    historyItemId = item.id;
    openHistoryEditor();
    addDraft(kind, null, item);
  }

  function showItem(itemId) {
    if (busy) return;
    const summary = itemSummaries().find(summary => summary.item.id === itemId);
    const item = summary.item;
    editingItemId = itemId;
    byId('item-title').textContent = item.name;
    const details = byId('item-details');
    details.replaceChildren(element('p', dueLabel(summary)));
    for (const reason of summary.reasons) details.append(element('p', reason));
    const data = element('dl');
    const facts = [['Specifications', item.specifications], ['Compatible part numbers', item.compatibleParts], ['Preferred brand', item.preferredBrand], ['Notes', item.notes]];
    if (item.tracking.distance) facts.push(['Distance interval', mileageLabel(item.tracking.distance.value, item.tracking.distance.unit)]);
    if (item.tracking.months) facts.push(['Time interval', `${item.tracking.months} months`]);
    if (item.tracking.condition) {
      const condition = item.tracking.condition;
      facts.push(['Condition threshold', `${condition.metric}: ${condition.operator.replaceAll('-', ' ')} ${condition.threshold} ${condition.unit}`]);
    }
    if (summary.serviceId) {
      const service = getRecord(snapshot.collection, summary.serviceId);
      facts.push(['Last recorded completed service', `${dateLabel(service.date)} · ${mileageLabel(service.odometer, service.odometerUnit)}`]);
    }
    for (const [label, value] of facts) if (value) data.append(element('dt', label), element('dd', value));
    details.append(data);
    if (item.links.length) {
      const links = element('ul');
      for (const url of item.links) {
        const link = element('a', url); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        const row = element('li'); row.append(link); links.append(row);
      }
      details.append(element('h3', 'Reference links (open in new tab)'), links);
    }
    byId('item-actions').replaceChildren(
      button(itemAction('maintenance', item), () => recordItem('maintenance', item)),
      button(itemAction('observation', item), () => recordItem('observation', item)),
      button('View item history', () => showHistory(itemId)),
      button('Edit item', () => editItem(itemId)),
    );
    screen('item-view', 'item-title');
  }

  function editItem(itemId = null) {
    if (busy) return;
    editingItemId = itemId;
    dirty = false;
    const vehicle = getVehicle(snapshot.collection, snapshot.selectedVehicleId);
    const item = listItems(snapshot.collection, vehicle.id).find(item => item.id === itemId);
    byId('item-editor-title').textContent = item ? 'Edit maintenance item' : 'Add maintenance item';
    byId('item-vehicle').textContent = vehicle.name;
    byId('item-error').textContent = '';
    byId('submit-item').textContent = 'Save item';
    byId('delete-item').hidden = !item;
    const controls = byId('item-controls');
    controls.replaceChildren();
    const common = historyField(controls, 'common', 'Common item', '', { choices: [['', 'Custom item'], ...COMMON_ITEMS.map(name => [name, name])] });
    delete common.dataset.field;
    const name = historyField(controls, 'name', 'Item name (required)', item?.name ?? '', { required: true });
    common.addEventListener('change', () => { if (common.value) name.value = common.value; });
    for (const [key, label] of [['specifications', 'Specifications'], ['compatibleParts', 'Compatible part numbers'], ['preferredBrand', 'Preferred brand'], ['notes', 'Notes'], ['links', 'Reference links (one http/https URL per line, optional)']]) {
      const control = historyField(controls, key, key === 'links' ? label : `${label} (optional)`, key === 'links' ? item?.links.join('\n') ?? '' : item?.[key] ?? '', { multiline: key !== 'preferredBrand' });
      if (['links', 'compatibleParts'].includes(key)) {
        control.setAttribute('autocorrect', 'off'); control.setAttribute('autocapitalize', 'none'); control.spellcheck = false;
      }
    }
    const tracking = item?.tracking;
    const initialMode = tracking?.condition ? (tracking.distance || tracking.months ? 'combined' : 'condition') : tracking?.distance || tracking?.months ? 'interval' : 'history';
    const mode = historyField(controls, 'mode', 'Tracking method', initialMode, { choices: [['history', 'History only'], ['interval', 'Distance / time intervals'], ['condition', 'Condition threshold'], ['combined', 'Intervals and condition']] });
    const intervals = element('fieldset'); intervals.append(element('legend', 'User-configured intervals'));
    historyField(intervals, 'distance', 'Distance interval (optional)', tracking?.distance?.value ?? '', { numeric: true });
    historyField(intervals, 'distanceUnit', 'Interval units', tracking?.distance?.unit ?? vehicle.odometerUnit, { choices: [['km', 'Kilometres (km)'], ['mi', 'Miles (mi)']] });
    const months = historyField(intervals, 'months', 'Time interval (months, optional)', tracking?.months ?? '', { numeric: true });
    months.step = '1'; months.min = '1'; months.max = '1200';
    const conditions = element('fieldset'); conditions.append(element('legend', 'User-configured condition'));
    historyField(conditions, 'metric', 'Condition being measured (required)', tracking?.condition?.metric ?? '', { required: true });
    historyField(conditions, 'conditionUnit', 'Condition units (required)', tracking?.condition?.unit ?? '', { required: true });
    historyField(conditions, 'operator', 'Due when condition is', tracking?.condition?.operator ?? 'at-or-below', { choices: [['at-or-below', 'At or below threshold'], ['at-or-above', 'At or above threshold']] });
    historyField(conditions, 'threshold', 'Condition threshold (required)', tracking?.condition?.threshold ?? '', { numeric: true, required: true });
    conditions.append(element('p', 'This stores your threshold. A due result also needs a supported condition measurement.'));
    controls.append(intervals, conditions);
    function showSettings() {
      intervals.hidden = intervals.disabled = !['interval', 'combined'].includes(mode.value);
      conditions.hidden = conditions.disabled = !['condition', 'combined'].includes(mode.value);
    }
    mode.addEventListener('change', showSettings);
    showSettings();
    byId('retry').hidden = true;
    screen('item-editor', name.id);
  }

  byId('item-form').addEventListener('input', event => {
    clearError(event.target);
    byId('item-error').textContent = '';
    dirty = true;
    byId('save-status').textContent = 'Unsaved item — submit to save on this device.';
  });
  byId('item-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const controls = [...byId('item-controls').querySelectorAll('[data-field]')].filter(control => !control.matches(':disabled'));
    const invalid = controls.find(control => !control.validity.valid);
    if (invalid) { historyError(invalid, invalid.validationMessage); return; }
    const values = Object.fromEntries(controls.map(control => [control.dataset.field, control.value]));
    const intervals = ['interval', 'combined'].includes(values.mode), condition = ['condition', 'combined'].includes(values.mode);
    if (intervals && values.distance === '' && values.months === '') {
      historyError(controls.find(control => control.dataset.field === 'distance'), 'Enter a distance or time interval, or choose History only.'); return;
    }
    const tracking = {
      distance: intervals && values.distance !== '' ? { value: Number(values.distance), unit: values.distanceUnit } : null,
      months: intervals && values.months !== '' ? Number(values.months) : null,
      condition: condition ? { metric: values.metric, unit: values.conditionUnit, operator: values.operator, threshold: Number(values.threshold) } : null,
    };
    try {
      const details = Object.fromEntries(['name', 'specifications', 'compatibleParts', 'preferredBrand', 'notes'].map(key => [key, values[key]]));
      const result = saveItem(snapshot.collection, snapshot.selectedVehicleId, { ...details, links: values.links.split(/\r?\n/).map(link => link.trim()).filter(Boolean), tracking }, editingItemId);
      snapshot.collection = result.collection;
      editingItemId = result.itemId;
      if (await persist()) { dirty = false; showItem(result.itemId); }
      else byId('submit-item').textContent = 'Retry saving item';
    } catch (error) {
      const control = controls.find(control => control.dataset.field === error.field);
      if (control) historyError(control, error.message);
      else { byId('item-error').textContent = error.message; byId('item-error').focus(); }
    }
  });
  byId('add-item').addEventListener('click', () => editItem());
  byId('delete-item').addEventListener('click', async () => {
    if (busy || !editingItemId) return;
    const item = listItems(snapshot.collection, snapshot.selectedVehicleId).find(item => item.id === editingItemId);
    const count = snapshot.collection.records.filter(record => record.itemId === item.id).length;
    if (!view.confirm(`Delete “${item.name}” and its ${count} linked history records? This cannot be undone in the app.`)) return;
    snapshot.collection = removeItem(snapshot.collection, item.id);
    historyItemId = null;
    editingItemId = null;
    dirty = false;
    await persist();
    render();
    if (pending) byId('retry').hidden = false;
  });
  byId('item-summary').addEventListener('click', () => { if (!busy) render(); });
  byId('cancel-item').addEventListener('click', () => {
    if (busy) return;
    dirty = false;
    render();
    if (pending) byId('retry').hidden = false;
    else status('Saved on this device.');
  });

  function showHistory(itemId = historyItemId) {
    historyItemId = itemId;
    render(false);
    const vehicle = getVehicle(snapshot.collection, snapshot.selectedVehicleId);
    const item = listItems(snapshot.collection, vehicle.id).find(item => item.id === itemId);
    byId('history-title').textContent = `History — ${item ? `${item.name} — ` : ''}${vehicle.name}`;
    const history = vehicleHistory(snapshot.collection, vehicle.id);
    if (item) history.records = history.records.filter(record => record.itemId === itemId);
    byId('history-empty').hidden = history.records.length > 0;
    const list = byId('history-list');
    list.replaceChildren();
    history.records.forEach((record, index) => {
      const row = element('li');
      row.append(element('h3', `${record.action || kindLabels[record.kind]} — ${dateLabel(record.date)}`));
      if (record.itemId) row.append(element('p', `${kindLabels[record.kind]} · ${listItems(snapshot.collection, record.vehicleId).find(item => item.id === record.itemId).name}`));
      row.append(element('p', record.kind === 'gap' ? `${record.historyType} history missing through ${dateLabel(record.endDate)}` : mileageLabel(record.odometer, record.odometerUnit)));
      if (record.kind === 'fueling') row.append(element('p', `${record.fuelAmount === null ? 'Fuel quantity unknown' : `${record.fuelAmount} ${record.fuelUnit}`} — ${record.tankStatus === 'unknown' ? 'tank status unknown' : `${record.tankStatus} tank`}`));
      if (record.notes) row.append(element('p', record.notes, 'record-notes'));
      if (record.partUsed) row.append(element('p', `Part used: ${record.partUsed}`));
      if (record.cost) row.append(element('p', `Cost: ${record.cost.amount} ${record.cost.currency}`));
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
    else if (options.numeric || name === 'odometer' || name === 'fuelAmount') { control.type = 'number'; control.min = '0'; control.step = 'any'; control.inputMode = 'decimal'; }
    else { control.maxLength = options.maxLength ?? 100; }
    control.required = Boolean(options.required);
    control.disabled = Boolean(options.disabled);
    control.value = value ?? '';
    control.setAttribute('aria-invalid', 'false');
    wrapper.append(caption);
    const error = element('p', '', 'field-error');
    error.id = `${control.name}-error`;
    error.hidden = true;
    wrapper.append(control, error);
    parent.append(wrapper);
    return control;
  }

  function historyDateField(parent, name, label, value = '') {
    const precision = historyField(parent, 'precision', `${label} precision`, value.length === 4 ? 'year' : value.length === 7 ? 'month' : 'day', {
      choices: [['day', 'Exact date'], ['month', 'Month and year'], ['year', 'Year only (YYYY)']],
    });
    delete precision.dataset.field;
    const control = historyField(parent, name, `${label} (required)`, '', { required: true });
    function applyPrecision() {
      const previous = control.value;
      const yearOnly = precision.value === 'year';
      control.type = yearOnly ? 'text' : precision.value === 'month' ? 'month' : 'date';
      control.inputMode = yearOnly ? 'numeric' : '';
      control.maxLength = yearOnly ? 4 : 10;
      if (yearOnly) {
        control.pattern = '[0-9]{4}';
        control.removeAttribute('min');
        control.removeAttribute('max');
      } else {
        control.removeAttribute('pattern');
        control.min = precision.value === 'month' ? '0001-01' : '0001-01-01';
        control.max = precision.value === 'month' ? '9999-12' : '9999-12-31';
      }
      const length = yearOnly ? 4 : precision.value === 'month' ? 7 : 10;
      // Reducing precision is explicit; increasing it never invents a month/day.
      control.value = previous.length >= length ? previous.slice(0, length) : '';
      clearError(control);
    }
    applyPrecision();
    control.value = value;
    precision.addEventListener('change', applyPrecision);
    return control;
  }

  function addDraft(kind, record = null, selectedItem = null) {
    const vehicle = getVehicle(snapshot.collection, snapshot.selectedVehicleId);
    const row = element('fieldset', undefined, 'record-editor');
    row.dataset.kind = kind;
    if (record) row.dataset.recordId = record.id;
    row.append(element('legend', kindLabels[kind]));
    const vehicleControl = historyField(row, 'vehicleId', 'Vehicle', record?.vehicleId ?? vehicle.id, {
      choices: snapshot.collection.vehicles.map(value => [value.id, value.name]),
    });
    if (['maintenance', 'observation'].includes(kind)) {
      const itemControl = historyField(row, 'itemId', 'Maintenance item (optional)', record?.itemId ?? selectedItem?.id ?? '', { choices: [] });
      const action = historyField(row, 'action', 'Action performed (required with item)', record?.action ?? (selectedItem ? itemAction(kind, selectedItem) : ''), { maxLength: 200 });
      function choices() {
        const current = itemControl.value;
        itemControl.replaceChildren();
        for (const [value, label] of [['', 'Unassigned'], ...listItems(snapshot.collection, vehicleControl.value).map(item => [item.id, item.name])]) {
          const option = element('option', label); option.value = value; itemControl.append(option);
        }
        itemControl.value = [...itemControl.options].some(option => option.value === current) ? current : '';
        action.required = Boolean(itemControl.value);
      }
      choices();
      itemControl.value = record?.itemId ?? selectedItem?.id ?? '';
      action.required = Boolean(itemControl.value);
      itemControl.addEventListener('change', () => {
        const item = listItems(snapshot.collection, vehicleControl.value).find(item => item.id === itemControl.value);
        action.required = Boolean(item);
        if (!record) action.value = item ? itemAction(kind, item) : '';
      });
      vehicleControl.addEventListener('change', choices);
    }
    const date = historyDateField(row, 'date', kind === 'gap' ? 'Start date' : 'Date', record?.date ?? '');
    if (kind === 'gap') {
      historyDateField(row, 'endDate', 'End date', record?.endDate ?? '');
      historyField(row, 'historyType', 'Affected history', record?.historyType ?? 'all', { choices: HISTORY_TYPES.map(type => [type, type === 'all' ? 'All history' : type === 'observation' ? 'Checks / inspections' : type[0].toUpperCase() + type.slice(1)]) });
    } else {
      historyField(row, 'odometer', `Odometer (${kind === 'odometer' ? 'required' : 'optional'})`, record?.odometer ?? null, { required: kind === 'odometer' });
      historyField(row, 'odometerUnit', 'Reading units', record?.odometerUnit ?? vehicle.odometerUnit, { choices: [['km', 'Kilometres (km)'], ['mi', 'Miles (mi)']] });
    }
    if (kind === 'fueling') {
      historyField(row, 'fuelUnit', 'Fuel units', record?.fuelUnit ?? vehicle.fuelUnit, { choices: Object.entries(fuelUnitLabels) });
      historyField(row, 'fuelAmount', 'Fuel added (optional)', record?.fuelAmount ?? null);
      historyField(row, 'tankStatus', 'Tank after fueling', record?.tankStatus ?? 'unknown', { choices: [['unknown', 'Unknown'], ['full', 'Full'], ['partial', 'Partial']] });
    }
    if (['maintenance', 'observation'].includes(kind)) {
      historyField(row, 'partUsed', 'Part used (optional)', record?.partUsed ?? '', { maxLength: 500 });
      historyField(row, 'costAmount', 'Cost amount (optional)', record?.cost?.amount ?? '', { numeric: true });
      historyField(row, 'currency', 'Currency (three letters, required with cost)', record?.cost?.currency ?? '', { maxLength: 3 });
    }
    historyField(row, 'notes', 'Notes (optional)', record?.notes ?? '', { multiline: true });
    if (!historyEditing) row.append(button('Discard draft record', () => {
      if (row.dataset.recordId) removedDraftIds.push(row.dataset.recordId);
      row.remove();
      byId('submit-history').hidden = byId('record-editors').children.length === 0;
      draftChanged();
      byId('add-observation').focus();
    }));
    byId('record-editors').append(row);
    byId('submit-history').hidden = false;
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
    byId('session-add-actions').hidden = historyEditing;
    byId('submit-history').textContent = historyEditing ? 'Save record' : 'Save records';
    byId('submit-history').hidden = !historyEditing;
    byId('retry').hidden = true;
    screen('history-editor', historyEditing ? 'history-editor-title' : 'add-observation');
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
      for (const key of ['odometer', 'fuelAmount']) if (key in details) details[key] = details[key] === '' ? null : Number(details[key]);
      if ('itemId' in details) {
        details.itemId ||= null;
        details.cost = details.costAmount === '' ? null : { amount: Number(details.costAmount), currency: details.currency.toUpperCase() };
        delete details.costAmount;
        delete details.currency;
      }
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

  byId('record-history').addEventListener('click', () => { historyItemId = null; openHistoryEditor(); });
  byId('history-add').addEventListener('click', () => openHistoryEditor());
  byId('view-history').addEventListener('click', () => { if (!busy) showHistory(null); });
  byId('history-summary').addEventListener('click', () => { if (!busy) render(); });
  for (const kind of ['fueling', 'oil-change', 'tire-change', 'maintenance', 'observation', 'odometer']) byId(`add-${kind}`).addEventListener('click', () => addDraft(kind));
  byId('history-gap').addEventListener('click', () => {
    if (busy) return;
    openHistoryEditor();
    byId('history-editor-title').textContent = 'Mark missing records';
    addDraft('gap');
  });
  byId('cancel-history').addEventListener('click', () => {
    if (busy) return;
    dirty = false;
    showHistory();
    if (pending) byId('retry').hidden = false;
    else status('Saved on this device.');
  });
  function backupError(error) {
    byId('backup-error').textContent = `${error.message} Current data has not been replaced. Correct the file or retry.`;
    byId('backup-error').focus();
  }

  function download(collection, name) {
    const url = view.URL.createObjectURL(new view.Blob([serialize(collection)], { type: 'application/json' }));
    const link = element('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    view.setTimeout(() => view.URL.revokeObjectURL(url), 60000);
  }

  function clearImport() {
    importCollection = null;
    importPreview = null;
    byId('import-preview').hidden = true;
    byId('import-file-form').reset();
    byId('backup-error').textContent = '';
  }

  byId('open-backups').addEventListener('click', () => {
    if (busy) return;
    clearImport();
    screen('backups', 'backups-title');
  });
  byId('close-backups').addEventListener('click', () => {
    if (busy) return;
    clearImport();
    render();
  });
  byId('export-json').addEventListener('click', () => {
    try { download(snapshot.collection, 'car-maintenance-backup.json'); } catch (error) { backupError(error); }
  });
  byId('export-recovery').addEventListener('click', async () => {
    if (busy) return;
    try {
      const recovery = await storage.loadRecovery();
      if (!recovery) throw new Error('No recovery copy exists yet. A replacement creates one.');
      download(recovery.collection, 'car-maintenance-recovery.json');
    } catch (error) { backupError(error); }
  });
  byId('cancel-import').addEventListener('click', () => {
    if (busy) return;
    clearImport();
    byId('import-file').focus();
  });
  byId('import-file').addEventListener('change', () => {
    importCollection = null;
    importPreview = null;
    byId('import-preview').hidden = true;
    byId('backup-error').textContent = '';
  });

  function recordLabel(value) {
    if (value.deletedAt) return `Deleted ${kindLabels[value.kind] ?? value.kind}`;
    return value.name ?? `${kindLabels[value.kind] ?? value.kind} — ${dateLabel(value.date)}`;
  }

  function describeValue(value) {
    if (value === null) return 'Unknown';
    if (value === '') return 'Not specified';
    if (Array.isArray(value)) return value.length ? value.map(describeValue).join('\n') : 'None';
    if (typeof value === 'object') return Object.entries(value).map(([key, item]) => `${fieldLabel(key)}: ${describeValue(item)}`).join('\n');
    return String(value);
  }
  const fieldNames = { odometer: 'Odometer reading', odometerUnit: 'Odometer unit', fuelUnit: 'Fuel unit', vehicleId: 'Vehicle ID', itemId: 'Maintenance item ID', createdAt: 'Created', updatedAt: 'Edited', deletedAt: 'Deleted', id: 'ID' };
  function fieldLabel(key) {
    return fieldNames[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, value => value.toUpperCase());
  }
  function versionDetails(label, value, children = []) {
    const details = element('details');
    details.append(element('summary', label));
    const list = element('dl');
    for (const [key, field] of Object.entries(value)) {
      list.append(element('dt', fieldLabel(key)), element('dd', describeValue(field)));
    }
    details.append(list);
    for (const child of children) details.append(versionDetails(recordLabel(child), child));
    return details;
  }

  function importChoices() {
    return Object.fromEntries(new view.FormData(byId('merge-form')));
  }
  function conflictError(group, message = '') {
    const error = group.querySelector('.field-error');
    error.textContent = message;
    error.hidden = !message;
    for (const input of group.querySelectorAll('input')) {
      input.setAttribute('aria-invalid', String(Boolean(message)));
      if (message) input.setAttribute('aria-describedby', error.id);
      else input.removeAttribute('aria-describedby');
    }
  }
  function updateConflictGroups() {
    const choices = importChoices();
    for (const conflict of importPreview.conflicts) {
      const covered = importPreview.conflicts.some(parent => parent.group && parent.children.includes(conflict.id) && ['local', 'incoming'].includes(choices[parent.id]));
      const group = byId(`conflict-${conflict.id}`);
      group.hidden = covered;
      group.disabled = covered;
      if (covered) conflictError(group);
    }
  }
  function showImportPreview() {
    byId('import-counts').textContent = importPreview.mergeError ?
      `${importPreview.mergeError} The file is valid for complete replacement; its contents are listed below.` :
      `${importPreview.additions.length} additions, ${importPreview.conflicts.length} conflicts, ${importPreview.unchanged} already matching.` +
      (importPreview.conflicts.some(conflict => conflict.group) ? ' Additions linked to a conflicting vehicle or item follow your choice for that group.' : '');
    byId('merge-import').disabled = Boolean(importPreview.mergeError);
    byId('import-collection-note').hidden = !importPreview.differentCollection || Boolean(importPreview.mergeError);
    const additions = byId('import-additions');
    additions.replaceChildren();
    for (const addition of importPreview.additions) {
      const row = element('li');
      row.append(versionDetails(recordLabel(addition.incoming), addition.incoming));
      additions.append(row);
    }
    const conflicts = byId('import-conflicts');
    conflicts.replaceChildren();
    for (const conflict of importPreview.conflicts) {
      const group = element('fieldset', undefined, 'import-conflict');
      group.id = `conflict-${conflict.id}`;
      group.append(element('legend', `${recordLabel(conflict.local)} / ${recordLabel(conflict.incoming)}`));
      if (conflict.group) group.append(element('p', 'These versions share an ID. Keeping one version also keeps only its linked history.' +
        (conflict.canCombine ? ' Combine histories only if you know this is the same vehicle.' : '')));
      for (const [side, collection, label] of [['local', snapshot.collection, 'This device'], ['incoming', importCollection, 'Imported file']]) {
        const children = [...collection.items, ...collection.records, ...collection.tombstones].filter(value => conflict.children.includes(value.id));
        group.append(versionDetails(label, conflict[side], children));
      }
      const options = [['local', conflict.group ? 'Keep this device’s version and linked history' : 'Keep this device’s version'], ['incoming', conflict.group ? 'Use imported version and linked history' : 'Use imported version']];
      if (conflict.canCombine) options.push(['merge-local', 'Same vehicle: combine histories, keep this device’s details'], ['merge-incoming', 'Same vehicle: combine histories, use imported details']);
      const choices = element('div', undefined, 'choices');
      for (const [value, label] of options) {
        const row = element('div');
        const input = element('input');
        input.type = 'radio';
        input.name = conflict.id;
        input.value = value;
        input.id = `${conflict.id}-${value}`;
        input.required = true;
        const caption = element('label', label);
        caption.htmlFor = input.id;
        row.append(input, caption);
        choices.append(row);
      }
      group.append(choices);
      const error = element('p', '', 'field-error');
      error.id = `conflict-${conflict.id}-error`;
      error.hidden = true;
      group.append(error);
      conflicts.append(group);
    }
    byId('import-preview').hidden = false;
    status('Import preview ready. No changes applied.');
    byId('preview-title').focus();
  }
  byId('merge-form').addEventListener('change', event => {
    byId('backup-error').textContent = '';
    conflictError(event.target.closest('fieldset'));
    updateConflictGroups();
  });
  byId('import-file-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const file = byId('import-file').files[0];
    if (!file) return;
    busy = true;
    byId('preview-import').disabled = true;
    byId('import-file').disabled = true;
    byId('backup-error').textContent = '';
    try {
      importCollection = deserialize(await file.text());
      try {
        importPreview = previewMerge(snapshot.collection, importCollection);
      } catch (error) {
        // File validity and compatibility with the current collection are separate.
        importPreview = {
          mergeError: error.message, conflicts: [],
          additions: [...importCollection.vehicles, ...importCollection.items, ...importCollection.records, ...importCollection.tombstones].map(incoming => ({ incoming })),
        };
      }
      showImportPreview();
    } catch (error) {
      importCollection = null;
      importPreview = null;
      byId('import-preview').hidden = true;
      backupError(error);
    } finally {
      busy = false;
      byId('preview-import').disabled = false;
      byId('import-file').disabled = false;
    }
  });

  async function commitImport(replace) {
    if (busy || !importCollection) return;
    try {
      if (!replace && importPreview.mergeError) throw new Error(importPreview.mergeError);
      const collection = replace ? importCollection : applyMerge(snapshot.collection, importCollection, importChoices());
      const selectedVehicleId = collection.vehicles.some(vehicle => vehicle.id === snapshot.selectedVehicleId) ? snapshot.selectedVehicleId : null;
      const candidate = { collection, selectedVehicleId, revision: snapshot.revision };
      busy = true;
      for (const control of byId('backups').querySelectorAll('button, input')) control.disabled = true;
      status('Saving on this device…');
      const saved = replace ? await storage.replace(candidate, snapshot) : await storage.save(candidate);
      snapshot = { ...candidate, revision: saved.revision };
      pending = false;
      clearImport();
      status(replace ? 'Collection replaced and saved on this device. Recovery copy available.' : 'Import merged and saved on this device.');
      byId('backups-title').focus();
    } catch (error) {
      backupError(error);
      status('Import not applied.');
    } finally {
      busy = false;
      for (const control of byId('backups').querySelectorAll('button, input')) control.disabled = false;
      byId('merge-import').disabled = Boolean(importPreview?.mergeError);
    }
  }
  byId('merge-form').addEventListener('submit', event => {
    event.preventDefault();
    const invalid = [...byId('merge-form').querySelectorAll('input')].find(input => !input.matches(':disabled') && !input.validity.valid);
    if (invalid) {
      for (const group of byId('import-conflicts').querySelectorAll('fieldset')) {
        if (!group.disabled && !group.querySelector('input:checked')) conflictError(group, 'Choose a version for this conflict.');
      }
      byId('backup-error').textContent = 'Choose a version for every conflict before merging.';
      invalid.focus();
      return;
    }
    commitImport(false);
  });
  byId('replace-import').addEventListener('click', () => {
    if (busy || !importCollection) return;
    if (view.confirm('Replace the entire collection with this file? The current collection will be saved as the recovery copy first.')) commitImport(true);
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
