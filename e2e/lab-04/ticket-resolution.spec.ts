import { test, expect } from '@playwright/test';

test.describe('E2E-02 (AC-06, AC-08, AC-09): Requester Advisory Resolution & Staff Resolution Gate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('Requester indicates problem resolved, Staff verifies advisory cue and executes formal resolution gate', async ({ page }) => {
    // -------------------------------------------------------------
    // Step 1: Requester creates an issue and indicates resolution
    // -------------------------------------------------------------
    await page.fill('#login-email', 'somchai.pra@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Somchai Prasert');

    // Create ticket
    await page.click('.zen-header nav button:has-text("Create Ticket")');
    await expect(page.locator('h1')).toContainText('Submit a New IT Ticket');

    await page.selectOption('#ticket-category', '2'); // Hardware
    await page.selectOption('#ticket-related-system', '7'); // Corporate Laptop
    await page.selectOption('#ticket-priority', 'HIGH');
    const ticketSummary = `Trackpad unresponsive after sleep ${Date.now()}`;
    await page.fill('#ticket-summary', ticketSummary);
    await page.fill(
      '#ticket-description',
      'Trackpad does not register clicks or swipes after laptop wakes from sleep state.'
    );
    await page.click('button[type="submit"]');

    // Open created ticket from My Tickets list
    const createdRow = page.locator(`tr:has-text("${ticketSummary}")`);
    await expect(createdRow).toBeVisible();
    await createdRow.click();

    // Verify detail loaded
    await expect(page.locator('[data-testid="ticket-detail-view"]')).toBeVisible();

    // Requester clicks "Problem Appears Resolved"
    const indicateBtn = page.locator('[data-testid="indicate-resolved-btn"]');
    if (await indicateBtn.isVisible()) {
      await indicateBtn.click();
      await expect(page.locator('[data-testid="indicated-resolved-badge"]')).toBeVisible();
    }

    // Sign out requester
    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();

    // -------------------------------------------------------------
    // Step 2: IT Staff logs in and inspects the ticket
    // -------------------------------------------------------------
    await page.fill('#login-email', 'staff.supachai@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Supachai Techavichit');

    // Go to Staff Queue
    await page.click('.zen-header nav button:has-text("IT Staff Queue")');
    await expect(page.locator('[data-testid="staff-ticket-queue"]')).toBeVisible();

    // Search or find ticket
    const staffRow = page.locator(`tr:has-text("${ticketSummary}")`);
    await expect(staffRow).toBeVisible();
    await staffRow.click();

    // Staff ticket detail view
    await expect(page.locator('[data-testid="staff-ticket-detail"]')).toBeVisible();

    // Verify status dropdown only shows permitted transitions
    const statusSelect = page.locator('[data-testid="status-select"]');
    await expect(statusSelect).toBeVisible();

    // Transition NEW -> IN_PROGRESS first
    await statusSelect.selectOption('IN_PROGRESS');
    await expect(page.locator('[data-testid="ticket-status-badge"]')).toContainText('IN PROGRESS');

    // Transition IN_PROGRESS -> RESOLVED (triggers Resolution Gate modal)
    await statusSelect.selectOption('RESOLVED');

    // Mandatory Resolution Summary Modal must appear
    await expect(page.locator('h5:has-text("Resolution Summary Required")')).toBeVisible();

    const confirmBtn = page.locator('[data-testid="confirm-resolution-btn"]');
    const summaryInput = page.locator('[data-testid="resolution-summary-input"]');

    // Confirm button is disabled with short text
    await summaryInput.fill('Short');
    await expect(confirmBtn).toBeDisabled();

    // Enter valid resolution summary
    const resolutionText = 'Reinstalled I2C HID bus driver and verified trackpad gestures.';
    await summaryInput.fill(resolutionText);
    await expect(confirmBtn).toBeEnabled();

    // Confirm resolution
    await confirmBtn.click();

    // Verify modal closes and ticket status becomes RESOLVED
    await expect(page.locator('[data-testid="ticket-status-badge"]')).toContainText('RESOLVED');
    await expect(page.locator('text=' + resolutionText)).toBeVisible();
  });
});
