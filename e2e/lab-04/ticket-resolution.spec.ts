import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOTS = path.resolve(process.cwd(), 'artifacts/lab-04/screenshots/ticket-resolution');

test.describe('E2E-02: Ticket Resolution Lifecycle – Requester Indication & IT Staff Gate (AC-06, AC-08)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('TC-RES-01: Requester indicates resolved; Staff formally resolves with mandatory summary', async ({ page }) => {
    // -----------------------------------------------------------------------
    // Step 1: Requester creates a ticket for this test (fresh ticket)
    // -----------------------------------------------------------------------
    await page.fill('#login-email', 'kittisak.rat@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Kittisak Rattana');

    // Create a new ticket
    await page.click('.zen-header nav button:has-text("Create Ticket")');
    await expect(page.locator('h1')).toContainText('Submit a New IT Ticket');

    await page.selectOption('#ticket-category', '3'); // Software
    await page.selectOption('#ticket-related-system', '4'); // LEB2
    await page.selectOption('#ticket-priority', 'MEDIUM');
    const ticketSummary = `LEB2 video playback issue EE Dept ${Date.now()}`;
    await page.fill('#ticket-summary', ticketSummary);
    await page.fill('#ticket-description', 'Video lectures in LEB2 do not load on Chrome browser, only shows a black screen.');
    await page.click('button[type="submit"]');

    // Confirm new ticket shows in My Tickets
    const ticketRow = page.locator(`tr:has-text("${ticketSummary}")`);
    await expect(ticketRow).toBeVisible();
    const ticketNumberText = await ticketRow.locator('.font-monospace, td:first-child').first().textContent();
    const ticketNumber = ticketNumberText?.trim() || '';
    expect(ticketNumber).toMatch(/^TCK-\d{8}-\d{4}$/);

    // Open the ticket to mark "Problem Appears Resolved" (AC-09)
    await ticketRow.click();
    await expect(page.locator('.zen-card, [data-testid], .card').first()).toBeVisible();

    const indicateBtn = page.locator('button:has-text("Problem Appears Resolved"), button:has-text("Indicate Resolved"), [data-testid="indicate-resolved-btn"]');
    if (await indicateBtn.isVisible()) {
      await indicateBtn.click();
      await page.screenshot({ path: path.join(SCREENSHOTS, 'requester-indicate-resolved.png') });
    }

    // Sign out Requester
    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();

    // -----------------------------------------------------------------------
    // Step 2: IT Staff logs in and triages the ticket
    // -----------------------------------------------------------------------
    await page.fill('#login-email', 'staff.supachai@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Supachai Techavichit');

    await page.click('.zen-header nav button:has-text("IT Staff Queue")');
    await expect(page.locator('[data-testid="staff-ticket-queue"]')).toBeVisible();

    // Search for our newly created ticket
    await page.fill('[data-testid="search-input"]', ticketNumber);
    await expect(page.locator('table')).toContainText(ticketNumber);

    // Open the ticket
    await page.click(`button:has-text("${ticketNumber}")`);
    await expect(page.locator('[data-testid="staff-ticket-detail"]')).toBeVisible();

    // Verify ticket is still in NEW status — requester's indication did NOT change the status
    await expect(page.locator('[data-testid="ticket-status-badge"]')).toContainText(/NEW/i);
    await page.screenshot({ path: path.join(SCREENSHOTS, 'staff-view-new-ticket.png') });

    // Transition to IN_PROGRESS (AC-06: valid transition from NEW)
    await page.selectOption('[data-testid="status-select"]', 'IN_PROGRESS');
    await expect(page.locator('[data-testid="ticket-status-badge"]')).toContainText(/IN.?PROGRESS/i);

    // Attempt to RESOLVE without summary — ensure gate blocks it (AC-08)
    await page.selectOption('[data-testid="status-select"]', 'RESOLVED');
    await expect(page.locator('.modal-title')).toContainText('Resolution Summary Required');
    await page.screenshot({ path: path.join(SCREENSHOTS, 'resolution-modal-gate.png') });

    // Submit an empty summary — verify validation prevents submission
    const resolutionInput = page.locator('[data-testid="resolution-summary-input"]');
    await resolutionInput.fill('');
    const confirmBtn = page.locator('[data-testid="confirm-resolution-btn"]');
    // Button should be disabled or form invalid with empty input
    const isDisabled = await confirmBtn.isDisabled();
    if (!isDisabled) {
      await confirmBtn.click();
      // If button click doesn't close modal, validation rejected it
      await expect(page.locator('.modal-title')).toContainText('Resolution Summary Required');
    }

    // Provide a valid resolution summary (≥ 10 characters)
    await resolutionInput.fill('Cleared browser cache and disabled conflicting LEB2 Chrome extension. Video playback fully restored.');
    await confirmBtn.click();

    // Confirm status is now RESOLVED
    await expect(page.locator('[data-testid="ticket-status-badge"]')).toContainText(/RESOLVED/i);
    await page.screenshot({ path: path.join(SCREENSHOTS, 'ticket-resolved.png') });
  });
});
