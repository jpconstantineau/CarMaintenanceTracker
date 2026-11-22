import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';

for (const fixture of ['pre-history-release', 'pre-maintenance-release', 'pre-backup-release']) {
test(`a cached ${fixture} upgrades to history and maintenance without clearing browser data`, async ({ page }) => {
  const previous = JSON.parse(await readFile(new URL(`../fixtures/${fixture}.json`, import.meta.url)));
  const current = Object.fromEntries(await Promise.all(Object.keys(previous.assets).map(async name =>
    [name, await readFile(new URL(`../../docs/${name}`, import.meta.url), 'utf8')])));
  let assets = previous.assets;
  const server = createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const name = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!Object.hasOwn(assets, name)) { response.writeHead(404); response.end(); return; }
    response.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : name.endsWith('.css') ? 'text/css' : 'text/html');
    response.setHeader('Cache-Control', name === 'index.html' ? 'no-store' : 'public, max-age=3600');
    response.end(assets[name]);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/`;
  try {
    await page.goto(url);
    await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
    await page.getByLabel('Vehicle name (required)').fill('Existing vehicle');
    await page.getByLabel('Kilometres (km)', { exact: true }).check();
    await page.getByRole('button', { name: 'Create vehicle', exact: true }).click();
    await expect(page.locator('#save-status')).toHaveText('Saved on this device.');
    if (fixture === 'pre-maintenance-release') {
      await page.getByRole('button', { name: 'Record history', exact: true }).click();
      await page.getByRole('button', { name: 'Other maintenance', exact: true }).click();
      await page.getByLabel('Date (required)', { exact: true }).fill('2020-06-01');
      await page.locator('.record-editor').getByLabel('Notes (optional)').fill('Earlier unassigned filter replacement');
      await page.getByRole('button', { name: 'Save records', exact: true }).click();
      await expect(page.locator('#save-status')).toHaveText('Saved on this device.');
    }
    assets = current;
    // New document, same origin and cached assets: no routes or cache-clearing reload.
    await page.goto(`${url}?updated`);
    await expect(page.getByRole('heading', { name: 'Existing vehicle', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'View history', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'History — Existing vehicle' })).toBeVisible({ timeout: 2000 });
    await page.getByRole('button', { name: 'Record history', exact: true }).click();
    await page.getByRole('button', { name: 'Change oil', exact: true }).click();
    await expect(page.getByLabel('Date (required)', { exact: true })).toHaveAttribute('type', 'date');
    await page.getByLabel('Date (required)', { exact: true }).fill('2024-01-02');
    await page.getByRole('button', { name: 'Save records', exact: true }).click();
    await expect(page.locator('#history-list > li')).toHaveCount(fixture === 'pre-maintenance-release' ? 2 : 1);
    if (fixture === 'pre-maintenance-release') await expect(page.locator('#history-list')).toContainText('Earlier unassigned filter replacement');
    await page.getByRole('button', { name: 'Vehicle summary', exact: true }).click();
    await page.getByRole('button', { name: 'Add maintenance item', exact: true }).click();
    await page.getByLabel('Common item').selectOption('Brakes');
    await page.getByRole('button', { name: 'Save item', exact: true }).click();
    await expect(page.locator('#item-details')).toContainText('History only');
    await page.getByRole('button', { name: 'JSON backups', exact: true }).click();
    const exported = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
    await page.getByLabel('App JSON file').setInputFiles(await (await exported).path());
    await page.getByRole('button', { name: 'Preview import', exact: true }).click();
    await expect(page.locator('#import-counts')).toContainText('0 additions, 0 conflicts');
    await page.getByRole('button', { name: 'Merge import', exact: true }).click();
    await expect(page.locator('#save-status')).toHaveText('Import merged and saved on this device.');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
}
