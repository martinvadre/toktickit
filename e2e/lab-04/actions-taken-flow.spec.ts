import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOTS = path.resolve(process.cwd(), 'artifacts/lab-04/screenshots/actions-taken');

test.describe('E2E-01: Actions Taken – Staff Create & Requester Read-Only (AC-01, AC-04)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('TC-AT-01: IT Staff records an Action Taken; Requester views it in read-only mode', async ({ page }) => {
    // -----------------------------------------------------------------------
    // Step 1: IT Staff logs in and opens a ticket with existing Actions Taken
    // -----------------------------------------------------------------------
    await page.fill('#login-email', 'staff.supachai@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Supachai Techavichit');

    // Navigate to IT Staff Queue
    await page.click('.zen-header nav button:has-text("IT Staff Queue")');
    await expect(page.locator('[data-testid="staff-ticket-queue"]')).toBeVisible();

    // Open ticket TCK-20260901-0001 (Corporate laptop — IN_PROGRESS with 3 existing actions)
    await page.fill('[data-testid="search-input"]', 'TCK-20260901-0001');
    await expect(page.locator('table')).toContainText('TCK-20260901-0001');
    await page.click('button:has-text("TCK-20260901-0001")');
    await expect(page.locator('[data-testid="staff-ticket-detail"]')).toBeVisible();

    // Verify the Actions Taken section is present with existing entries
    await expect(page.locator('[data-testid="actions-taken-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="actions-table"]')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, 'actions-staff-overview.png') });

    // Step 2: IT Staff records a new Action Taken (AC-01)
    const recordBtn = page.locator('[data-testid="record-action-button"]');
    await expect(recordBtn).toBeVisible();
    await recordBtn.click();

    // Fill in the Record Action modal
    await expect(page.locator('.modal.show')).toBeVisible();
    await page.fill('[data-testid="action-description-input"]', 'Ran firmware update on corporate laptop battery management unit.');
    await page.fill('[data-testid="action-result-input"]', 'BMU updated successfully; charging behavior normalized.');
    await page.selectOption('#actionStatus', 'COMPLETED');

    // Enable follow-up and enter a note
    await page.check('[data-testid="follow-up-checkbox"]');
    await expect(page.locator('[data-testid="follow-up-note-container"]')).toBeVisible();
    await page.fill('[data-testid="follow-up-note-input"]', 'Monitor battery health after 48-hour run-in period.');
    await page.screenshot({ path: path.join(SCREENSHOTS, 'actions-create-modal.png') });

    await page.click('[data-testid="save-action-button"]');

    // Confirm the new action appears in the table
    await expect(page.locator('[data-testid="actions-table"]')).toContainText(
      'Ran firmware update on corporate laptop battery management unit.'
    );
    await page.screenshot({ path: path.join(SCREENSHOTS, 'actions-saved.png') });

    // Sign out IT Staff
    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();

    // -----------------------------------------------------------------------
    // Step 3: Requester logs in and views ticket with Actions Taken (read-only, AC-04)
    // -----------------------------------------------------------------------
    await page.fill('#login-email', 'somchai.pra@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Somchai Prasert');

    // Navigate to My Tickets and open the same ticket
    await page.click('.zen-header nav button:has-text("My Tickets")');
    await page.locator('tr:has-text("TCK-20260901-0001")').click();

    // Actions Taken should be visible (read-only — no "Record Action" button)
    await expect(page.locator('[data-testid="actions-taken-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="actions-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="record-action-button"]')).not.toBeVisible();

    // Verify our newly added action is visible to the Requester
    await expect(page.locator('[data-testid="actions-table"]')).toContainText(
      'Ran firmware update on corporate laptop battery management unit.'
    );
    await page.screenshot({ path: path.join(SCREENSHOTS, 'actions-requester-readonly.png') });
  });
});
