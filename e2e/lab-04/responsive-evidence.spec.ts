import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const STAFF_DASH_DIR = path.resolve(process.cwd(), 'artifacts/lab-04/screenshots/staff-dashboard');
const REQ_DASH_DIR = path.resolve(process.cwd(), 'artifacts/lab-04/screenshots/requester-dashboard');
const ACTIONS_DIR = path.resolve(process.cwd(), 'artifacts/lab-04/screenshots/actions-taken');

test.beforeAll(() => {
  [STAFF_DASH_DIR, REQ_DASH_DIR, ACTIONS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
});

test.describe('Responsive Screenshots & Visual Evidence (Lab 4)', () => {
  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 },
  ];

  test('Capture Staff Dashboard across Desktop, Tablet, and Mobile viewports', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    await page.fill('#login-email', 'staff.supachai@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(STAFF_DASH_DIR, `${vp.name}.png`),
        fullPage: true,
      });
    }
  });

  test('Capture Requester Dashboard across Desktop, Tablet, and Mobile viewports', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    await page.fill('#login-email', 'somchai.pra@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(REQ_DASH_DIR, `${vp.name}.png`),
        fullPage: true,
      });
    }
  });

  test('Capture Actions Taken UI on Staff and Requester Detail', async ({ page }) => {
    // 1. Staff View of Actions Taken
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    await page.fill('#login-email', 'staff.supachai@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.click('.zen-header nav button:has-text("IT Staff Queue")');
    await expect(page.locator('[data-testid="staff-ticket-queue"]')).toBeVisible();

    await page.locator('[data-testid^="ticket-row-"]').first().click();
    await expect(page.locator('[data-testid="staff-ticket-detail"]')).toBeVisible();

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.screenshot({
      path: path.join(ACTIONS_DIR, 'staff-actions-desktop.png'),
      fullPage: true,
    });

    // Open Record Action Modal
    await page.click('[data-testid="record-action-button"]');
    await expect(page.locator('h4:has-text("Record Action Taken")')).toBeVisible();
    await page.screenshot({
      path: path.join(ACTIONS_DIR, 'action-modal.png'),
    });
    await page.click('[data-testid="cancel-action-modal-btn"]');

    // Sign out
    await page.click('button:has-text("Sign Out")');

    // 2. Requester View of Actions Taken (Read-only)
    await page.fill('#login-email', 'somchai.pra@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.click('.zen-header nav button:has-text("My Tickets")');
    await expect(page.locator('[data-testid="my-tickets-container"]')).toBeVisible();

    await page.locator('table tbody tr').first().click();
    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();

    await page.screenshot({
      path: path.join(ACTIONS_DIR, 'requester-actions-desktop.png'),
      fullPage: true,
    });
  });
});
