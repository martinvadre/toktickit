import { test } from '@playwright/test';
import path from 'path';

const OUT_DIR = path.resolve(process.cwd(), 'artifacts/lab-03/report');

test.describe('Responsive Viewports Capture (Desktop, Tablet, Mobile)', () => {
  test('Capture responsive views for all major screens', async ({ page }) => {
    // -----------------------------------------------------------
    // 1. Login Screen
    // -----------------------------------------------------------
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');

    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.screenshot({ path: path.join(OUT_DIR, 'part9_responsive_login_desktop.png') });

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: path.join(OUT_DIR, 'part9_responsive_login_tablet.png') });

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: path.join(OUT_DIR, 'part9_responsive_login_mobile.png') });

    // -----------------------------------------------------------
    // 2. IT Staff Ticket Queue
    // -----------------------------------------------------------
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.fill('#login-email', 'staff.supachai@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.zen-header');
    await page.click('button:has-text("IT Staff Queue")');
    await page.waitForSelector('[data-testid="staff-ticket-queue"]');

    // Desktop
    await page.screenshot({ path: path.join(OUT_DIR, 'part9_responsive_queue_desktop.png') });

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: path.join(OUT_DIR, 'part9_responsive_queue_tablet.png') });

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: path.join(OUT_DIR, 'part9_responsive_queue_mobile.png') });

    // -----------------------------------------------------------
    // 3. IT Staff Ticket Detail
    // -----------------------------------------------------------
    await page.setViewportSize({ width: 1280, height: 720 });
    const viewBtn = page.locator('button:has-text("View"), button:has-text("Manage"), button:has-text("Open")').first();
    if (await viewBtn.count() > 0) {
      await viewBtn.click();
      await page.waitForSelector('[data-testid="staff-ticket-detail"]');

      // Desktop
      await page.screenshot({ path: path.join(OUT_DIR, 'part9_responsive_detail_desktop.png') });

      // Tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.screenshot({ path: path.join(OUT_DIR, 'part9_responsive_detail_tablet.png') });

      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({ path: path.join(OUT_DIR, 'part9_responsive_detail_mobile.png') });
    }

    // -----------------------------------------------------------
    // 4. Admin User Management
    // -----------------------------------------------------------
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.fill('#login-email', 'admin@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.zen-header');

    await page.click('.zen-header nav button:has-text("User Management")');
    await page.waitForSelector('[data-testid="user-management-page"]');

    // Desktop
    await page.screenshot({ path: path.join(OUT_DIR, 'part9_responsive_admin_desktop.png') });

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: path.join(OUT_DIR, 'part9_responsive_admin_tablet.png') });

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: path.join(OUT_DIR, 'part9_responsive_admin_mobile.png') });
  });
});
