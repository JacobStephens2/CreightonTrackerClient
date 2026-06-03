import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

// Override with SCREENSHOT_DIR env var if you want output somewhere else.
const OUT_DIR = process.env.SCREENSHOT_DIR
  || '/var/www/creighton.stephens.page/play-store-package/screenshots';
const VIEWPORT = { width: 1080, height: 1920, deviceScaleFactor: 1 };
const BASE = 'https://chart35.com';

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function shot(page, file, scene) {
  console.log(`  -> ${file} (${scene})`);
  await page.screenshot({ path: path.join(OUT_DIR, file), fullPage: false });
}

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--lang=en-US'],
});

try {
  // ---- 1. Chart view with sample data (Normal zoom) ----
  let page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0', timeout: 30000 });
  // Dismiss the first-launch disclaimer if present
  await page.evaluate(() => localStorage.setItem('disclaimerDismissed', '1'));
  await page.evaluate(() => localStorage.setItem('cookieConsentDismissed', '1'));
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(800);
  await shot(page, '05-phone-chart-normal-1080x1920.png', 'chart Normal zoom, sample data');
  await page.close();

  // ---- 2. Chart view in Trend zoom ----
  page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem('disclaimerDismissed', '1');
    localStorage.setItem('cookieConsentDismissed', '1');
    localStorage.setItem('chartZoom', 'trend');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(800);
  await shot(page, '06-phone-chart-trend-1080x1920.png', 'chart Trend zoom');
  await page.close();

  // ---- 3. Settings view ----
  page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem('disclaimerDismissed', '1');
    localStorage.setItem('cookieConsentDismissed', '1');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(800);
  await shot(page, '07-phone-settings-1080x1920.png', 'settings page (signed-out)');
  await page.close();

  // ---- 4. Observation form modal ----
  page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem('disclaimerDismissed', '1');
    localStorage.setItem('cookieConsentDismissed', '1');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(800);
  // Click the FAB (floating add button) — try common selectors
  const fab = await page.$('.fab') || await page.$('button[aria-label*="ew"], button[aria-label*="add"]');
  if (fab) {
    await fab.click();
    await wait(500);
    await shot(page, '08-phone-observation-form-1080x1920.png', 'observation form modal');
  } else {
    console.log('   (FAB not found; skipping observation form shot)');
  }
  await page.close();
} catch (err) {
  console.error('ERROR:', err.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
