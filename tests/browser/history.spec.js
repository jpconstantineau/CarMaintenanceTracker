import { test, expect } from '@playwright/test';

async function fillDate(row, value, label = 'Date') {
  await row.getByLabel(label + ' precision', { exact: true }).selectOption(value.length === 4 ? 'year' : value.length === 7 ? 'month' : 'day');
  await row.getByLabel(label + ' (required)', { exact: true }).fill(value);
}

async function openVehicle(page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  await page.getByLabel('Vehicle name (required)').fill('History car');
  await page.getByLabel('Kilometres (km)', { exact: true }).check();
  await page.getByRole('button', { name: 'Create vehicle', exact: true }).click();
  await expect(page.locator('#save-status')).toHaveText('Saved on this device.');
}

test('fuel units follow vehicle setup for new entries and remain unchanged on older records @live', async ({ page }) => {
  await openVehicle(page);
  await page.getByRole('button', { name: 'Edit vehicle details' }).click();
  await expect(page.getByLabel('Fuel units', { exact: true })).toHaveValue('L');
  await page.getByLabel('Fuel units', { exact: true }).selectOption('US gal');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Record history', exact: true }).click();
  await page.getByRole('button', { name: 'Fuel up', exact: true }).click();
  const row = page.locator('.record-editor');
  await expect(row.getByLabel('Fuel units', { exact: true })).toHaveValue('US gal');
  await row.getByLabel('Date (required)', { exact: true }).fill('2024-06-02');
  await row.getByLabel('Fuel added (optional)').fill('10');
  await page.getByRole('button', { name: 'Save records', exact: true }).click();
  await page.getByRole('button', { name: 'Vehicle summary', exact: true }).click();
  await page.getByRole('button', { name: 'Edit vehicle details' }).click();
  await page.locator('#vehicle-form').getByLabel('Fuel units', { exact: true }).selectOption('Imp gal');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('#save-status')).toHaveText('Saved on this device.');
  await expect(page.locator('#summary-fuel-units')).toHaveText('Imperial gallons (Imp gal)');
  await page.reload();
  await expect(page.locator('#summary-fuel-units')).toHaveText('Imperial gallons (Imp gal)');
  await page.getByRole('button', { name: 'View history', exact: true }).click();
  await expect(page.locator('#history-list')).toContainText('10 US gal');
  await page.getByRole('button', { name: 'Edit record 1', exact: true }).click();
  await expect(row.getByLabel('Fuel units', { exact: true })).toHaveValue('US gal');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Record history', exact: true }).click();
  await page.getByRole('button', { name: 'Fuel up', exact: true }).click();
  await expect(row.getByLabel('Fuel units', { exact: true })).toHaveValue('Imp gal');
});

test('new records use blank native date pickers and never copy the previous reading @live', async ({ page }) => {
  await openVehicle(page);
  await page.getByRole('button', { name: 'Record history', exact: true }).click();
  await expect(page.getByLabel('Default date')).toHaveCount(0);
  await page.getByRole('button', { name: 'Check / inspect', exact: true }).click();
  const rows = page.locator('.record-editor');
  const date = rows.nth(0).getByLabel('Date (required)', { exact: true });
  await expect(date).toHaveAttribute('type', 'date');
  await expect(date).toHaveValue('');
  await date.fill('2024-02-29');
  await rows.nth(0).getByLabel('Odometer (optional)', { exact: true }).fill('12000');
  await expect(rows.nth(0).getByLabel('Odometer (optional)', { exact: true })).toHaveAttribute('type', 'number');
  await page.getByRole('button', { name: 'Check / inspect', exact: true }).click();
  await expect(rows.nth(1).getByLabel('Date (required)', { exact: true })).toHaveValue('');
  await expect(rows.nth(1).getByLabel('Odometer (optional)', { exact: true })).toHaveValue('');
});

test('record car activities and confirm vehicle deletion with its history @live', async ({ page }, testInfo) => {
  await openVehicle(page);
  await page.getByRole('button', { name: 'Record history', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mark missing records', exact: true })).toBeHidden();
  for (const [action, notes] of [
    ['Fuel up', 'Regular fuel'], ['Change oil', '5W-30 and filter'],
    ['Change tires', 'Installed summer tires'], ['Other maintenance', 'Replaced cabin filter'],
  ]) {
    await page.getByRole('button', { name: action, exact: true }).click();
    const row = page.locator('.record-editor').last();
    await row.getByLabel('Date (required)', { exact: true }).fill('2024-06-01');
    await row.getByLabel('Odometer (optional)', { exact: true }).fill('120000');
    await row.getByLabel('Notes (optional)').fill(notes);
    if (action === 'Fuel up') {
      await row.getByLabel('Fuel added (optional)').fill('42.5');
      await row.getByLabel('Tank after fueling').selectOption('full');
    }
  }
  await page.getByRole('button', { name: 'Save records', exact: true }).click();
  await expect(page.locator('#history-list > li')).toHaveCount(4);
  await expect(page.locator('#history-list')).toContainText('42.5 L — full tank');
  await page.reload();
  await page.getByRole('button', { name: 'View history', exact: true }).click();
  await expect(page.locator('#history-list')).toContainText('Oil change');
  await expect(page.locator('#history-list')).toContainText('Tire change');
  await page.screenshot({ path: testInfo.outputPath('car-activities.png'), fullPage: true });
  await page.getByRole('button', { name: 'Vehicle summary', exact: true }).click();
  await page.getByRole('button', { name: 'Edit vehicle details', exact: true }).click();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Delete vehicle', exact: true }).click();
  await expect(page.getByLabel('Vehicle name (required)')).toHaveValue('History car');
  page.once('dialog', dialog => {
    expect(dialog.message()).toContain('all of its history');
    return dialog.accept();
  });
  await page.getByRole('button', { name: 'Delete vehicle', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your vehicles' })).toBeVisible();
  await expect(page.locator('#save-status')).toHaveText('Saved on this device.');
  await page.reload();
  await expect(page.locator('#vehicle-list > li')).toHaveCount(0);
});

test('record a session, backfill, correct, remove and reopen factual history @live', async ({ page }, testInfo) => {
  await openVehicle(page);
  await page.getByRole('button', { name: 'Record history', exact: true }).click();
  await page.getByRole('button', { name: 'Check / inspect', exact: true }).click();
  await fillDate(page.locator('.record-editor').last(), '2024-06');
  await page.locator('.record-editor').last().getByLabel(/^Odometer \(/).fill('120000');
  const rows = page.locator('.record-editor');
  await rows.nth(0).getByLabel('Notes (optional)').fill('Brakes inspected');
  await page.getByRole('button', { name: 'Odometer reading', exact: true }).click();
  await fillDate(rows.nth(1), '2020');
  await rows.nth(1).getByLabel('Odometer (required)', { exact: true }).fill('80000');
  await page.getByRole('button', { name: 'Save records', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'History — History car' })).toBeVisible();
  await expect(page.locator('#history-list > li')).toHaveCount(2);
  await page.getByRole('button', { name: 'Edit record 2', exact: true }).click();
  await fillDate(rows.nth(0), '2019-12');
  await rows.nth(0).getByLabel('Odometer (required)', { exact: true }).fill('75000');
  await page.getByRole('button', { name: 'Save record', exact: true }).click();
  await expect(page.locator('#history-list > li').nth(0)).toContainText('120,000 km');
  await expect(page.locator('#history-list > li').nth(1)).toContainText('2019-12');
  await page.getByRole('button', { name: 'Vehicle summary', exact: true }).click();
  await expect(page.locator('#summary-mileage')).toHaveText('120,000 km — 2024-06 (month known)');
  await page.reload();
  await page.getByRole('button', { name: 'View history', exact: true }).click();
  await expect(page.locator('#history-list > li')).toHaveCount(2);
  await page.screenshot({ path: testInfo.outputPath('history.png'), fullPage: true });
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Remove record 1', exact: true }).click();
  await expect(page.locator('#history-list > li')).toHaveCount(1);
  await page.getByRole('button', { name: 'Vehicle summary', exact: true }).click();
  await expect(page.locator('#summary-mileage')).toHaveText('75,000 km — 2019-12 (month known)');
});

test('partial observations, known gaps and contradictions remain reviewable at narrow widths @live', async ({ page }, testInfo) => {
  await openVehicle(page);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole('button', { name: 'Record history', exact: true }).click();
  await page.getByRole('button', { name: 'Check / inspect', exact: true }).click();
  await fillDate(page.locator('.record-editor').last(), '2024');
  const rows = page.locator('.record-editor');
  await rows.nth(0).getByLabel('Notes (optional)').fill('<img src=x> ' + 'LongWord'.repeat(80));
  await rows.nth(0).getByLabel('Date (required)', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save records', exact: true }).click();
  await expect(rows.nth(0).getByLabel('Date (required)', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(rows.nth(0).getByLabel('Date (required)', { exact: true })).toBeFocused();
  await fillDate(rows.nth(0), '2024-02');
  await expect(rows.nth(0).getByLabel('Date (required)', { exact: true })).toHaveAttribute('aria-invalid', 'false');

  await page.getByLabel('Theme', { exact: true }).selectOption('dark');
  await expect(rows.nth(0).getByLabel('Date (required)', { exact: true })).toHaveValue('2024-02');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('history-editor-dark-320.png'), fullPage: true });
  await page.getByRole('button', { name: 'Save records', exact: true }).click();
  await expect(page.locator('#history-list')).toContainText('Mileage unknown');
  await page.getByRole('button', { name: 'Mark missing records', exact: true }).click();
  await fillDate(rows.nth(0), '2020', 'Start date');
  await fillDate(rows.nth(0), '2023', 'End date');
  await rows.nth(0).getByLabel('Affected history').selectOption('fueling');
  await page.getByRole('button', { name: 'Save records', exact: true }).click();
  await expect(page.locator('#history-list')).toContainText('fueling history missing through 2023 (year known)');
  await expect(page.locator('#history-list img')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Record history', exact: true }).click();
  await page.getByRole('button', { name: 'Odometer reading', exact: true }).click();
  await fillDate(page.locator('.record-editor').last(), '2024-06-01');
  await page.locator('.record-editor').last().getByLabel(/^Odometer \(/).fill('10000');
  await page.getByRole('button', { name: 'Odometer reading', exact: true }).click();
  await fillDate(page.locator('.record-editor').last(), '2025-01-01');
  await page.locator('.record-editor').last().getByLabel(/^Odometer \(/).fill('9000');
  await page.getByRole('button', { name: 'Odometer reading', exact: true }).click();
  await fillDate(page.locator('.record-editor').last(), '2026-01-01');
  await page.locator('.record-editor').last().getByLabel(/^Odometer \(/).fill('8000');
  await page.getByRole('button', { name: 'Save records', exact: true }).click();
  await expect(page.locator('#history-list > li')).toHaveCount(5);
  await expect(page.locator('#history-list').getByText('Mileage decreases across recorded dates. Review these readings.')).toHaveCount(3);
  await page.getByRole('button', { name: 'Vehicle summary', exact: true }).click();
  await expect(page.locator('#summary-mileage')).toContainText('Conflicting mileage evidence');
  await page.reload();
  await page.getByRole('button', { name: 'View history', exact: true }).click();
  await expect(page.locator('#history-list > li')).toHaveCount(5);
});

test('failed history transaction retains editable drafts and retries without duplicates', async ({ page }) => {
  await openVehicle(page);
  await page.getByRole('button', { name: 'All vehicles', exact: true }).click();
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  await page.getByLabel('Vehicle name (required)').fill('Correction target');
  await page.getByLabel('Kilometres (km)', { exact: true }).check();
  await page.getByRole('button', { name: 'Create vehicle', exact: true }).click();
  await page.getByRole('button', { name: 'All vehicles', exact: true }).click();
  await page.getByRole('button', { name: 'History car', exact: true }).click();
  await page.getByRole('button', { name: 'Record history', exact: true }).click();
  await page.getByRole('button', { name: 'Check / inspect', exact: true }).click();
  await fillDate(page.locator('.record-editor').last(), '2024-01-02');
  await page.locator('.record-editor').getByLabel('Notes (optional)').fill('Initial observation');
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      IDBObjectStore.prototype.put = put;
      const request = put.apply(this, args);
      request.addEventListener('success', () => this.transaction.abort());
      return request;
    };
  });
  await page.getByRole('button', { name: 'Save records', exact: true }).click();
  await expect(page.locator('#save-status')).toHaveText('Not saved on this device.');
  await expect(page.locator('.record-editor').getByLabel('Notes (optional)')).toHaveValue('Initial observation');
  const savedBeforeRetry = await page.evaluate(async () => (await (await import('./storage.js')).createLocalStorage().load()).collection);
  expect(savedBeforeRetry.records).toHaveLength(0);
  await page.locator('.record-editor').getByLabel('Notes (optional)').fill('Corrected after failure');
  await page.locator('.record-editor').getByLabel('Vehicle', { exact: true }).selectOption({ label: 'Correction target' });
  await page.getByRole('button', { name: 'Retry saving history', exact: true }).click();
  await expect(page.locator('#save-status')).toHaveText('Saved on this device.');
  await expect(page.locator('#history-list > li')).toHaveCount(0);
  await page.getByRole('button', { name: 'Vehicle summary', exact: true }).click();
  await page.getByRole('button', { name: 'All vehicles', exact: true }).click();
  await page.getByRole('button', { name: 'Correction target', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Correction target', exact: true })).toBeVisible();
  await expect(page.locator('#save-status')).toHaveText('Saved on this device.');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Correction target', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View history', exact: true }).click();
  await expect(page.locator('#history-list > li')).toHaveCount(1);
  await expect(page.locator('#history-list')).toContainText('Corrected after failure');
  await page.getByRole('button', { name: 'Edit record 1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Check / inspect', exact: true })).toBeHidden();
});

test('equal readings keep known mileage while exposing an uncertain latest date @live', async ({ page }) => {
  await openVehicle(page);
  await page.getByRole('button', { name: 'Record history', exact: true }).click();
  await page.getByRole('button', { name: 'Check / inspect', exact: true }).click();
  await fillDate(page.locator('.record-editor').last(), '2024');
  await page.locator('.record-editor').last().getByLabel(/^Odometer \(/).fill('100');
  await page.getByRole('button', { name: 'Check / inspect', exact: true }).click();
  await fillDate(page.locator('.record-editor').last(), '2024-06');
  await page.locator('.record-editor').last().getByLabel('Odometer (optional)', { exact: true }).fill('100');
  await page.getByRole('button', { name: 'Save records', exact: true }).click();
  await expect(page.locator('#history-list').getByText('Equal mileage does not establish order within overlapping approximate dates. Review dates if known.')).toHaveCount(2);
  await page.getByRole('button', { name: 'Vehicle summary', exact: true }).click();
  await expect(page.locator('#summary-mileage')).toHaveText('100 km — Latest date uncertain (2024; 2024-06). Review vehicle history.');
});

test('keyboard entry keeps separate vehicle activities and rejects a partial invalid session @live', async ({ page }) => {
  await openVehicle(page);
  await page.getByRole('button', { name: 'All vehicles', exact: true }).click();
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  await page.getByLabel('Vehicle name (required)').fill('Truck');
  await page.getByLabel('Miles (mi)', { exact: true }).check();
  await page.getByRole('button', { name: 'Create vehicle', exact: true }).click();
  const recordButton = page.getByRole('button', { name: 'Record history', exact: true });
  await recordButton.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Check / inspect', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  const rows = page.locator('.record-editor');
  await expect(rows.nth(0).getByLabel('Date (required)', { exact: true })).toBeFocused();
  await fillDate(rows.nth(0), '2022');
  await rows.nth(0).getByLabel('Odometer (optional)', { exact: true }).fill('100');
  await rows.nth(0).getByLabel('Vehicle', { exact: true }).selectOption({ label: 'History car' });
  await page.getByRole('button', { name: 'Check / inspect', exact: true }).click();
  await rows.nth(1).getByLabel('Date (required)', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save records', exact: true }).click();
  const snapshot = await page.evaluate(async () => (await (await import('./storage.js')).createLocalStorage().load()));
  expect(snapshot.collection.records).toHaveLength(0);
  await fillDate(rows.nth(1), '2023');
  await rows.nth(1).getByLabel('Odometer (optional)', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save records', exact: true }).click();
  await expect(page.locator('#history-list > li')).toHaveCount(1);
  await expect(page.locator('#history-list')).toContainText('Mileage unknown');
  await page.getByRole('button', { name: 'Vehicle summary', exact: true }).click();
  await page.getByRole('button', { name: 'All vehicles', exact: true }).click();
  await page.getByRole('button', { name: 'History car', exact: true }).click();
  await expect(page.locator('#summary-mileage')).toHaveText('160.934 km — 2022 (year known)');
  await page.getByRole('button', { name: 'View history', exact: true }).click();
  await expect(page.locator('#history-list')).toContainText('100 mi');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
