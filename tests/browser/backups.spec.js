import { test, expect } from '@playwright/test';
import * as History from '../../docs/history.js';
import { serialize } from '../../docs/storage.js';

const file = collection => ({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(serialize(collection)) });

async function preview(page, collection) {
  await page.getByLabel('App JSON file').setInputFiles(file(collection));
  await page.getByRole('button', { name: 'Preview import', exact: true }).click();
  await expect(page.locator('#import-preview')).toBeVisible();
}

test('export, preview, cancel, merge twice and recover a replacement @live', async ({ page }, testInfo) => {
  const saved = History.saveVehicle(History.createCollection(), { name: 'Imported car', odometerUnit: 'mi' });
  const incoming = History.saveSession(saved.collection, { vehicleId: saved.vehicleId, date: '2024-02', odometerUnit: 'mi' }, [{ kind: 'oil-change', notes: '<b>Literal note</b>' }]).collection;
  await page.goto('./');
  await page.getByRole('button', { name: 'JSON backups' }).click();
  await preview(page, incoming);
  await page.getByRole('button', { name: 'Cancel import' }).click();
  await expect(page.locator('#import-preview')).toBeHidden();
  await preview(page, incoming);
  await page.getByRole('button', { name: 'Merge import', exact: true }).click();
  await expect(page.locator('#save-status')).toHaveText('Import merged and saved on this device.');
  await preview(page, incoming);
  await expect(page.locator('#import-counts')).toContainText('0 additions');
  await page.getByRole('button', { name: 'Merge import', exact: true }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const downloaded = await downloadEvent;
  const stream = await downloaded.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const exported = JSON.parse(Buffer.concat(chunks).toString());
  expect(exported.vehicles).toEqual(incoming.vehicles);
  expect(exported.records).toEqual(incoming.records);
  expect(Object.keys(exported).sort()).toEqual(['format', 'schemaVersion', 'id', 'vehicles', 'items', 'records', 'tombstones'].sort());
  await preview(page, History.createCollection());
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Replace entire collection', exact: true }).click();
  await expect(page.locator('#import-preview')).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Replace entire collection', exact: true }).click();
  await expect(page.locator('#save-status')).toHaveText('Collection replaced and saved on this device. Recovery copy available.');
  await page.reload();
  await page.getByRole('button', { name: 'JSON backups' }).click();
  const recoveryEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download recovery copy' }).click();
  const recovery = await recoveryEvent;
  await page.getByLabel('App JSON file').setInputFiles(await recovery.path());
  await page.getByRole('button', { name: 'Preview import', exact: true }).click();
  await page.getByRole('button', { name: 'Merge import', exact: true }).click();
  await page.getByRole('button', { name: 'Back to vehicles', exact: true }).click();
  await page.getByRole('button', { name: 'Imported car', exact: true }).click();
  await page.getByRole('button', { name: 'View history', exact: true }).click();
  await expect(page.locator('#history-list > li')).toHaveCount(1);
  await expect(page.locator('#history-list')).toContainText('<b>Literal note</b>');
  await page.screenshot({ path: testInfo.outputPath('restored-history.png'), fullPage: true });
});

test('replacement stores a usable recovery snapshot atomically and rejects stale writers', async ({ page }) => {
  await page.goto('./');
  const result = await page.evaluate(async () => {
    const { createLocalStorage } = await import('./storage.js');
    const { createCollection, saveVehicle } = await import('./history.js');
    const storage = createLocalStorage({ databaseName: 'replacement-test' });
    const original = saveVehicle(createCollection(), { name: 'Original', odometerUnit: 'km' });
    const replacement = saveVehicle(createCollection(), { name: 'Replacement', odometerUnit: 'mi' });
    const first = { collection: original.collection, selectedVehicleId: original.vehicleId, revision: 0 };
    first.revision = (await storage.save(first)).revision;
    const second = { collection: replacement.collection, selectedVehicleId: replacement.vehicleId, revision: first.revision };
    second.revision = (await storage.replace(second, first)).revision;
    const recovery = await storage.loadRecovery();
    let stale = '';
    try { await storage.replace({ ...first, revision: 1 }, first); } catch (error) { stale = error.message; }
    return { active: await storage.load(), recovery, stale, after: await storage.loadRecovery() };
  });
  expect(result.active.collection.vehicles[0].name).toBe('Replacement');
  expect(result.recovery.collection.vehicles[0].name).toBe('Original');
  expect(result.recovery.selectedVehicleId).toBe(result.recovery.collection.vehicles[0].id);
  expect(result.stale).toContain('Another tab');
  expect(result.after).toEqual(result.recovery);
});

test('conflict choices preserve identity, show literal versions and work at narrow width by keyboard @live', async ({ page }, testInfo) => {
  const saved = History.saveVehicle(History.createCollection(), { name: 'Original car', odometerUnit: 'km' });
  const local = History.saveSession(saved.collection, { vehicleId: saved.vehicleId, date: '2024', odometerUnit: 'km' }, [{ kind: 'oil-change', notes: 'Local oil change' }]).collection;
  let incoming = History.saveVehicle(local, { name: 'Renamed car', odometerUnit: 'mi', notes: '<img src=x>' + 'Long'.repeat(90) }, saved.vehicleId).collection;
  incoming = History.saveSession(incoming, { vehicleId: saved.vehicleId, date: '2025', odometerUnit: 'mi' }, [{ kind: 'observation', notes: 'Imported check' }]).collection;
  await page.goto('./');
  await page.getByRole('button', { name: 'JSON backups' }).click();
  await preview(page, local);
  await page.getByRole('button', { name: 'Merge import', exact: true }).click();
  await expect(page.locator('#import-preview')).toBeHidden();
  await preview(page, incoming);
  await page.getByRole('button', { name: 'Merge import', exact: true }).click();
  await expect(page.getByLabel('Keep this device’s version and linked history', { exact: true })).toBeFocused();
  await expect(page.locator('#backup-error')).toContainText('Choose a version');
  await page.locator('#import-conflicts summary').filter({ hasText: 'Imported file' }).click();
  await expect(page.locator('#import-conflicts')).toContainText('<img src=x>');
  await expect(page.locator('#import-conflicts img')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('backup-conflict-light.png'), fullPage: true });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByLabel('Theme', { exact: true }).selectOption('dark');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel('Same vehicle: combine histories, use imported details').focus();
  await page.keyboard.press('Space');
  await page.screenshot({ path: testInfo.outputPath('backup-conflict-dark-narrow.png'), fullPage: true });
  await page.getByRole('button', { name: 'Merge import', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#save-status')).toHaveText('Import merged and saved on this device.');
  await page.reload();
  await page.getByRole('button', { name: 'Renamed car', exact: true }).click();
  await page.getByRole('button', { name: 'View history', exact: true }).click();
  await expect(page.locator('#history-list > li')).toHaveCount(2);
  await expect(page.locator('#history-list')).toContainText('Local oil change');
  await expect(page.locator('#history-list')).toContainText('Imported check');
});

test('invalid files and aborted merge/recovery writes leave data intact and allow retry', async ({ page }) => {
  const local = History.saveVehicle(History.createCollection(), { name: 'Keep this car', odometerUnit: 'km' }).collection;
  await page.goto('./');
  await page.getByRole('button', { name: 'JSON backups' }).click();
  await preview(page, local);
  await page.getByRole('button', { name: 'Merge import', exact: true }).click();
  await expect(page.locator('#import-preview')).toBeHidden();
  for (const json of ['{broken', JSON.stringify({ ...local, schemaVersion: 999 })]) {
    await page.getByLabel('App JSON file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(json) });
    await page.getByRole('button', { name: 'Preview import', exact: true }).click();
    await expect(page.locator('#backup-error')).toContainText('Current data has not been replaced');
    await expect(page.locator('#import-preview')).toBeHidden();
  }
  for (const key of ['active', 'recovery']) {
    await preview(page, History.createCollection());
    await page.evaluate(key => {
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args) {
        const request = put.apply(this, args);
        if (args[1] === key) {
          IDBObjectStore.prototype.put = put;
          request.addEventListener('success', () => this.transaction.abort());
        }
        return request;
      };
    }, key);
    if (key === 'recovery') page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: key === 'recovery' ? 'Replace entire collection' : 'Merge import', exact: true }).click();
    await expect(page.locator('#save-status')).toHaveText('Import not applied.');
    await expect(page.locator('#import-preview')).toBeVisible();
    const state = await page.evaluate(async () => {
      const { createLocalStorage } = await import('./storage.js');
      const storage = createLocalStorage();
      return { active: await storage.load(), recovery: await storage.loadRecovery() };
    });
    expect(state.active.collection.vehicles[0].name).toBe('Keep this car');
    expect(state.recovery).toBeNull();
    const exported = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
    expect((await exported).suggestedFilename()).toBe('car-maintenance-backup.json');
  }
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Replace entire collection', exact: true }).click();
  await expect(page.locator('#save-status')).toHaveText('Collection replaced and saved on this device. Recovery copy available.');
});
