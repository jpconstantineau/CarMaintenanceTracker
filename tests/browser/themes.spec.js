import { test, expect } from '@playwright/test';

const themeKey = 'car-maintenance-tracker.theme';
const themeControl = page => page.getByLabel('Theme', { exact: true });
const canvas = page => page.locator('html');
async function expectPalette(page, dark) {
  await expect(canvas(page)).toHaveCSS('background-color', dark ? 'rgb(18, 18, 18)' : 'rgb(245, 245, 245)');
  await expect(canvas(page)).toHaveCSS('color', dark ? 'rgb(237, 237, 237)' : 'rgb(32, 32, 32)');
}
async function snapshot(page) {
  return page.evaluate(async () => (await import('./storage.js')).createLocalStorage().load());
}

test('system changes, saved overrides and cross-tab changes preserve draft and focus @live', async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');
  await expect(themeControl(page)).toHaveValue('system');
  await expectPalette(page, false);
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  await page.getByLabel('Vehicle name (required)').fill('Keep this vehicle');
  await page.getByLabel('Kilometres (km)', { exact: true }).check();
  await page.getByRole('button', { name: 'Create vehicle', exact: true }).click();
  await expect(page.locator('#save-status')).toHaveText('Saved on this device.');
  const saved = await snapshot(page);
  await page.getByRole('button', { name: 'Edit vehicle details' }).click();
  const notes = page.getByLabel('Notes (optional)', { exact: true });
  await notes.fill('Keep this unfinished draft.');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectPalette(page, true);
  await expect(notes).toBeFocused();
  await themeControl(page).selectOption('light');
  await expectPalette(page, false);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectPalette(page, false);
  await notes.focus();
  const other = await context.newPage();
  await other.goto('./');
  await expect(themeControl(other)).toHaveValue('light');
  await themeControl(other).selectOption('dark');
  await expect(themeControl(page)).toHaveValue('dark');
  await expectPalette(page, true);
  await expect(notes).toBeFocused();
  await themeControl(other).selectOption('system');
  await expect(themeControl(page)).toHaveValue('system');
  expect(await page.evaluate(key => localStorage.getItem(key), themeKey)).toBeNull();
  await page.emulateMedia({ colorScheme: 'light' });
  await expectPalette(page, false);
  await expect(notes).toHaveValue('Keep this unfinished draft.');
  await expect(notes).toBeFocused();
  expect(await snapshot(page)).toEqual(saved);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Keep this vehicle' })).toBeVisible();
  await themeControl(page).selectOption('dark');
  await page.reload();
  await expect(themeControl(page)).toHaveValue('dark');
  await expectPalette(page, true);
  expect(await snapshot(page)).toEqual(saved);
});

test('saved theme is applied before application modules load', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, 'dark'), themeKey);
  await page.route(/\/app\.js(?:\?.*)?$/, route => route.abort());
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./');
  await expectPalette(page, true);
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'dark');
});

test('blocked preference storage still permits theme selection and vehicle saving', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {
    get() { throw new DOMException('Blocked for this test', 'SecurityError'); }
  }));
  await page.goto('./');
  await expect(page.locator('#theme-status')).toBeHidden();
  await themeControl(page).selectOption('dark');
  await expectPalette(page, true);
  await expect(page.locator('#theme-status')).toHaveText('Theme applies to this page only.');
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  await page.getByLabel('Vehicle name (required)').fill('Still saves');
  await page.getByLabel('Miles (mi)', { exact: true }).check();
  await page.getByRole('button', { name: 'Create vehicle', exact: true }).click();
  await expect(page.locator('#save-status')).toHaveText('Saved on this device.');
  await expect(page.getByRole('heading', { name: 'Still saves' })).toBeVisible();
});

test('both themes retain phone targets, focus, validation and reflow at enlarged text @live', async ({ page }, testInfo) => {
  await page.goto('./');
  await expect(page.locator('footer')).toHaveCount(0);
  await expect(page.getByText('Your vehicles, one history at a time.')).toHaveCount(0);
  await expect(page.locator('section:visible')).toHaveCSS('border-top-width', '0px');
  await expect(canvas(page)).toHaveCSS('font-family', 'sans-serif');
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  for (const theme of ['light', 'dark']) {
    await themeControl(page).selectOption(theme);
    await page.getByRole('button', { name: 'Create vehicle', exact: true }).click();
    const name = page.getByLabel('Vehicle name (required)');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#name-error')).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(name).toBeFocused();
    await expect(name).toHaveCSS('outline-width', '3px');
    await expect(page.locator('#name-error')).toHaveCSS('color', theme === 'dark' ? 'rgb(255, 180, 171)' : 'rgb(179, 38, 30)');
    const targets = await page.locator('button:visible, summary:visible, select:visible, input:not([type="radio"]):visible, textarea:visible, .choices label:visible').evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect();
      return { id: element.id || element.textContent, width: box.width, height: box.height };
    }));
    for (const target of targets) {
      expect(target.width, target.id).toBeGreaterThanOrEqual(44);
      expect(target.height, target.id).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: testInfo.outputPath(`${theme}-phone-editor.png`), fullPage: true });
  }
  await page.addStyleTag({ content: 'html { font-size: 200%; } * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-block-end: 2em !important; }' });
  await page.getByLabel('Vehicle name (required)').fill('W'.repeat(100));
  await page.getByLabel('Kilometres (km)', { exact: true }).check();
  await page.locator('#optional-vehicle-details > summary').click();
  await page.getByLabel('Notes (optional)', { exact: true }).fill('LongWord'.repeat(100));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Create vehicle', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'W'.repeat(100) })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'All vehicles' }).click();
  await expect(page.locator('#vehicle-list button')).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('#vehicle-list button')).toHaveCSS('border-inline-start-width', '4px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('enlarged-selection.png'), fullPage: true });
});

test('forced colors retain native boundaries and keyboard focus', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Forced-colors emulation is supported in Chromium.');
  await page.goto('./');
  await themeControl(page).selectOption('dark');
  await page.emulateMedia({ forcedColors: 'active' });
  expect(await canvas(page).evaluate(element => getComputedStyle(element).getPropertyValue('--primary').trim())).toBe('CanvasText');
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const name = page.getByLabel('Vehicle name (required)');
  await expect(name).toBeFocused();
  await expect(name).toHaveCSS('outline-width', '3px');
  await expect(name).toHaveCSS('border-top-width', '1px');
  const colors = await name.evaluate(element => {
    const style = getComputedStyle(element);
    return [style.color, style.backgroundColor, style.outlineColor];
  });
  expect(colors[0]).not.toBe(colors[1]);
  expect(colors[2]).not.toBe(colors[1]);
});
