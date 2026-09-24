import { test, expect } from '@playwright/test';

test.describe('E2E-01 (AC-01, AC-04): Actions Taken Lifecycle & Requester Read-Only Access', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('Staff records action taken and Requester views it in read-only mode', async ({ page }) => {
    // -------------------------------------------------------------
    // Step 1: IT Staff logs in and navigates to Staff Queue
    // -------------------------------------------------------------
    await page.fill('#login-email', 'staff.supachai@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('.zen-header')).toContainText('Supachai Techavichit');

    // Navigate to Staff Queue
    await page.click('.zen-header nav button:has-text("IT Staff Queue")');
    await expect(page.locator('[data-testid="staff-ticket-queue"]')).toBeVisible();

    // Click first ticket row in queue
    const firstTicketRow = page.locator('[data-testid^="ticket-row-"]').first();
    await expect(firstTicketRow).toBeVisible();
    await firstTicketRow.click();

    // Staff ticket detail view should open
    await expect(page.locator('[data-testid="staff-ticket-detail"]')).toBeVisible();

    // -------------------------------------------------------------
    // Step 2: Staff records an Action Taken
    // -------------------------------------------------------------
    const recordBtn = page.locator('[data-testid="record-action-button"]');
    await expect(recordBtn).toBeVisible();
    await recordBtn.click();

    // Modal opens
    await expect(page.locator('h4:has-text("Record Action Taken")')).toBeVisible();

    const actionDesc = `Replaced thermal paste and dusted heatsink ${Date.now()}`;
    const actionResult = 'CPU temperature stabilized below 45C under high benchmark load.';

    await page.fill('#actionDescription', actionDesc);
    await page.fill('#actionResult', actionResult);
    await page.click('[data-testid="save-action-button"]');

    // Confirm action appears in table
    const actionRow = page.locator(`tr:has-text("${actionDesc}")`);
    await expect(actionRow).toBeVisible();
    await expect(actionRow).toContainText(actionResult);

    // Sign out staff
    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();

    // -------------------------------------------------------------
    // Step 3: Requester logs in and inspects the ticket
    // -------------------------------------------------------------
    await page.fill('#login-email', 'somchai.pra@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Somchai Prasert');

    // Navigate to My Tickets
    await page.click('.zen-header nav button:has-text("My Tickets")');
    await expect(page.locator('[data-testid="my-tickets-container"]')).toBeVisible();

    // Open first ticket detail
    const reqTicketRow = page.locator('table tbody tr').first();
    await reqTicketRow.click();

    // Verify ticket detail is loaded
    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();

    // Verify Actions Taken section exists
    const actionsSection = page.locator('[data-testid="actions-taken-section"]');
    await expect(actionsSection).toBeVisible();

    // Verify the Record Action Taken button does NOT exist on requester view
    await expect(page.locator('[data-testid="record-action-button"]')).not.toBeVisible();

    // Verify editing buttons are not present
    await expect(page.locator('[data-testid^="edit-action-"]')).toHaveCount(0);
  });
});
