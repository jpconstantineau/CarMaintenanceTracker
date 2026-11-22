import { test, expect, chromium, webkit } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(new URL('../fixtures/collection-v1.json', import.meta.url)));

test('a full browser restart restores durable data @live', async ({ baseURL, browserName }, testInfo) => {
  const browserType = { chromium, webkit }[browserName];
  const profile = testInfo.outputPath('browser-profile');
  const options = { headless: true, baseURL };
  let browserContext = await browserType.launchPersistentContext(profile, options);
  try {
    let page = await browserContext.newPage();
    await page.goto('./');
    await createVehicle(page, 'Durable vehicle');
    await page.getByLabel('Theme', { exact: true }).selectOption('dark');
    const original = await loadSnapshot(page);
    await browserContext.close();
    browserContext = await browserType.launchPersistentContext(profile, options);
    page = await browserContext.newPage();
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Durable vehicle' })).toBeVisible();
    await expect(page.getByLabel('Theme', { exact: true })).toHaveValue('dark');
    expect(await loadSnapshot(page)).toEqual(original);
  } finally { await browserContext.close(); }
});

async function createVehicle(page, name = 'Older Civic', unit = 'Kilometres (km)') {
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  await page.getByLabel('Vehicle name (required)').fill(name);
  await page.getByLabel(unit, { exact: true }).check();
  await page.getByRole('button', { name: 'Create vehicle', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Saved on this device.');
}

async function loadSnapshot(page) {
  return page.evaluate(async () => {
    const { createLocalStorage } = await import(new URL('storage.js', location.href));
    return createLocalStorage().load();
  });
}

test('create, edit, isolate multiple vehicles and reopen the selected collection @live', async ({ page, context }) => {
  await page.goto('./');
  await createVehicle(page);
  await expect(page.getByText('Unknown — No odometer readings recorded.')).toBeVisible();
  await expect(page.getByText('No entries yet. Earlier maintenance history is unknown.')).toBeVisible();
  const original = await loadSnapshot(page);
  await page.getByRole('button', { name: 'Edit vehicle details' }).click();
  await page.getByLabel('Vehicle name (required)').fill('Blue Civic');
  await page.getByLabel('Make (optional)', { exact: true }).fill('Honda');
  await page.getByLabel('Model (optional)', { exact: true }).fill('Civic');
  await page.getByLabel('Year (optional)', { exact: true }).fill('2011');
  await page.getByLabel('Notes (optional)', { exact: true }).fill('Earlier history unknown.\nMy first vehicle.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'Blue Civic' })).toBeVisible();
  await expect(page.getByText('2011 Honda Civic')).toBeVisible();
  await page.getByRole('button', { name: 'All vehicles' }).click();
  await createVehicle(page, 'Truck', 'Miles (mi)');
  await expect(page.locator('#summary-notes')).toHaveText('No notes added.');
  await page.getByRole('button', { name: 'All vehicles' }).click();
  await page.getByRole('button', { name: 'Blue Civic', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Saved on this device.');
  const current = await loadSnapshot(page);
  expect(current.collection.id).toBe(original.collection.id);
  expect(current.selectedVehicleId).toBe(original.selectedVehicleId);
  expect(current.collection.vehicles).toHaveLength(2);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('./');
  await expect(reopened.getByRole('heading', { name: 'Blue Civic' })).toBeVisible();
  await expect(reopened.locator('#summary-notes')).toHaveText('Earlier history unknown.\nMy first vehicle.');
  await expect(reopened.locator('#summary-units')).toHaveText('Kilometres (km)');
  expect(await loadSnapshot(reopened)).toEqual(current);
});

test('keyboard creation, accessible validation, correction and cancel @live', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Add vehicle', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Theme', { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Add vehicle', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  const name = page.getByLabel('Vehicle name (required)');
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'false');
  await page.keyboard.press('Enter');
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toBeFocused();
  await name.fill('   ');
  await page.getByLabel('Kilometres (km)', { exact: true }).check();
  await page.getByRole('button', { name: 'Create vehicle', exact: true }).click();
  await expect(page.locator('#name-error')).toContainText('non-blank');
  await name.fill('Keyboard car');
  await expect(name).toHaveAttribute('aria-invalid', 'false');
  await expect(page.getByLabel('Year (optional)', { exact: true })).toBeHidden();
  await page.locator('#optional-vehicle-details > summary').click();
  await page.getByLabel('Year (optional)', { exact: true }).fill('1e2');
  await page.locator('#optional-vehicle-details > summary').click();
  await page.getByRole('button', { name: 'Create vehicle', exact: true }).click();
  await expect(page.getByLabel('Year (optional)', { exact: true })).toBeFocused();
  await page.getByLabel('Year (optional)', { exact: true }).fill('');
  await name.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Kilometres (km)', { exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByLabel('Miles (mi)', { exact: true })).toBeChecked();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Fuel units', { exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#optional-vehicle-details > summary')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Make (optional)', { exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Keyboard car' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit vehicle details' }).click();
  await name.fill('Discard this draft');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Keyboard car' })).toBeVisible();
});

test('long and untrusted text stays readable on narrow screens @live', async ({ page }, testInfo) => {
  await page.goto('./');
  const longName = 'A'.repeat(100);
  await createVehicle(page, longName);
  await page.getByRole('button', { name: 'Edit vehicle details' }).click();
  const notes = '<img src=x onerror=alert(1)>\n' + 'LongWord'.repeat(100);
  await page.getByLabel('Notes (optional)', { exact: true }).fill(notes);
  await page.screenshot({ path: testInfo.outputPath('editor.png'), fullPage: true });
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('#summary-notes')).toHaveText(notes);
  await expect(page.locator('#summary-notes img')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('summary.png'), fullPage: true });
  await page.getByRole('button', { name: 'All vehicles' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('aborted real IndexedDB write preserves editable work, never announces success and retries once', async ({ page }) => {
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    window.abortNextWrite = true;
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args);
      if (window.abortNextWrite) {
        window.abortNextWrite = false;
        request.addEventListener('success', () => this.transaction.abort());
      }
      return request;
    };
    window.saveMessages = [];
    new MutationObserver(() => {
      const message = document.getElementById('save-status')?.textContent;
      if (message) window.saveMessages.push(message);
    }).observe(document, { subtree: true, childList: true, characterData: true });
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  await page.getByLabel('Vehicle name (required)').fill('Recover me');
  await page.getByLabel('Miles (mi)', { exact: true }).check();
  await page.getByRole('button', { name: 'Create vehicle', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Not saved on this device.');
  await expect(page.getByLabel('Vehicle name (required)')).toHaveValue('Recover me');
  await expect(page.locator('#storage-error')).toContainText('Your work is still open here');
  expect(await loadSnapshot(page)).toBeNull();
  expect(await page.evaluate(() => window.saveMessages)).not.toContain('Saved on this device.');
  await page.locator('#optional-vehicle-details > summary').click();
  await page.getByLabel('Notes (optional)', { exact: true }).fill('Still editable after failure.');
  await page.getByRole('button', { name: 'Retry saving details' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved on this device.');
  expect((await loadSnapshot(page)).collection.vehicles).toHaveLength(1);
  await page.reload();
  await expect(page.locator('#summary-notes')).toHaveText('Still editable after failure.');
});

test('failed update preserves the last committed vehicle and retries without changing its ID', async ({ page }) => {
  await page.goto('./');
  await createVehicle(page, 'Original');
  const before = await loadSnapshot(page);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      IDBObjectStore.prototype.put = put;
      const request = put.apply(this, args);
      request.addEventListener('success', () => this.transaction.abort());
      return request;
    };
  });
  await page.getByRole('button', { name: 'Edit vehicle details' }).click();
  await page.getByLabel('Vehicle name (required)').fill('Updated');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Not saved on this device.');
  expect(await loadSnapshot(page)).toEqual(before);
  await page.getByRole('button', { name: 'Retry saving details' }).click();
  await expect(page.getByRole('heading', { name: 'Updated' })).toBeVisible();
  expect((await loadSnapshot(page)).selectedVehicleId).toBe(before.selectedVehicleId);
});

test('unavailable storage is retryable and cannot start an overwriting collection', async ({ page }) => {
  await page.addInitScript(() => {
    const open = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function (...args) {
      if (!window.allowStorage) throw new DOMException('Storage is blocked.', 'SecurityError');
      return open.apply(this, args);
    };
  });
  await page.goto('./');
  await expect(page.getByRole('status')).toHaveText('Could not open local vehicles.');
  await expect(page.getByRole('button', { name: 'Add vehicle', exact: true })).toBeHidden();
  await page.evaluate(() => { window.allowStorage = true; });
  await page.getByRole('button', { name: 'Retry local storage' }).click();
  await createVehicle(page);
});

test('a prior v1 collection reopens and edits without replacing IDs, notes or deletion markers', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('status')).toHaveText('No vehicles saved yet.');
  await page.evaluate(async collection => {
    // Seed exactly what the preceding release stored, before the new loader runs.
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('car-maintenance-tracker');
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('workspace', 'readwrite');
        tx.objectStore('workspace').put({ json: JSON.stringify(collection), selectedVehicleId: collection.vehicles[0].id, revision: 1 }, 'active');
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onabort = () => reject(tx.error);
      };
    });
  }, fixture);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Older Civic' })).toBeVisible();
  expect((await loadSnapshot(page)).collection).toEqual({ ...fixture, schemaVersion: 3, vehicles: fixture.vehicles.map(vehicle => ({ ...vehicle, fuelUnit: 'L' })) });
  await page.getByRole('button', { name: 'All vehicles' }).click();
  await createVehicle(page, 'Another vehicle');
  const result = (await loadSnapshot(page)).collection;
  expect(result.id).toBe(fixture.id);
  expect(result.vehicles[0]).toEqual({ ...fixture.vehicles[0], fuelUnit: 'L' });
  expect(result.tombstones).toEqual(fixture.tombstones);
});

test('unsupported saved versions are exposed without resetting stored data', async ({ page }) => {
  await page.goto('./');
  await createVehicle(page);
  const original = await loadSnapshot(page);
  const future = { ...original.collection, schemaVersion: 99 };
  await page.evaluate(async collection => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('car-maintenance-tracker');
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('workspace', 'readwrite');
        tx.objectStore('workspace').put({ json: JSON.stringify(collection), selectedVehicleId: collection.vehicles[0].id, revision: 1 }, 'active');
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onabort = () => reject(tx.error);
      };
    });
  }, future);
  await page.reload();
  await expect(page.locator('#storage-error')).toContainText('version is not supported');
  await expect(page.getByRole('button', { name: 'Add vehicle', exact: true })).toBeHidden();
  const stored = await page.evaluate(async () => new Promise(resolve => {
    const request = indexedDB.open('car-maintenance-tracker');
    request.onsuccess = () => {
      const db = request.result;
      const read = db.transaction('workspace').objectStore('workspace').get('active');
      read.onsuccess = () => { resolve(JSON.parse(read.result.json)); db.close(); };
    };
  }));
  expect(stored).toEqual(future);
});

test('stale tabs cannot overwrite a newer committed collection', async ({ page, context }) => {
  await page.goto('./');
  await createVehicle(page, 'Original');
  const other = await context.newPage();
  await other.goto('./');
  await expect(other.getByRole('heading', { name: 'Original' })).toBeVisible();
  await page.getByRole('button', { name: 'Edit vehicle details' }).click();
  await other.getByRole('button', { name: 'Edit vehicle details' }).click();
  await page.getByLabel('Vehicle name (required)').fill('First tab saved');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved on this device.');
  await other.getByLabel('Vehicle name (required)').fill('Second tab draft');
  await other.getByRole('button', { name: 'Save changes' }).click();
  await expect(other.locator('#storage-error')).toContainText('Another tab changed');
  await expect(other.getByLabel('Vehicle name (required)')).toHaveValue('Second tab draft');
  expect((await loadSnapshot(other)).collection.vehicles[0].name).toBe('First tab saved');
});
