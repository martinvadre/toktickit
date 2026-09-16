import { test, expect } from '@playwright/test';
import path from 'path';

const QUEUE_SCREENSHOTS = path.resolve(process.cwd(), 'artifacts/lab-03/screenshots/staff-queue');
const DETAIL_SCREENSHOTS = path.resolve(process.cwd(), 'artifacts/lab-03/screenshots/staff-ticket-detail');

test.describe('E2E-02: IT Staff Ticket Lifecycle & Requester Privacy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('Complete flow: Ticket creation, Staff queue triage, Operations, and Privacy verification', async ({ page }) => {
    // -------------------------------------------------------------
    // Step 1: Requester creates a test ticket
    // -------------------------------------------------------------
    await page.fill('#login-email', 'somchai.pra@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Somchai Prasert');

    // Navigate to Create Ticket
    await page.click('.zen-header nav button:has-text("Create Ticket")');
    await expect(page.locator('h1')).toContainText('Submit a New IT Ticket');

    await page.selectOption('#ticket-category', '4'); // Network
    await page.selectOption('#ticket-related-system', '2'); // Campus Wi-Fi
    await page.selectOption('#ticket-priority', 'HIGH');
    const ticketSummary = `Wi-Fi intermittency in Central Library ${Date.now()}`;
    await page.fill('#ticket-summary', ticketSummary);
    await page.fill(
      '#ticket-description',
      'Users are experiencing sporadic connection loss and latency spikes on the 4th floor of the library.'
    );
    await page.click('button[type="submit"]');

    // Confirm submission redirects to My Tickets and shows new ticket
    const ticketRow = page.locator(`tr:has-text("${ticketSummary}")`);
    await expect(ticketRow).toBeVisible();
    const ticketNumberText = await ticketRow.locator('.font-monospace').first().textContent();
    const ticketNumber = ticketNumberText?.trim() || '';
    expect(ticketNumber).toMatch(/^TCK-\d{8}-\d{4}$/);

    // Sign out requester
    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();

    // -------------------------------------------------------------
    // Step 2: IT Staff logs in and inspects IT Staff Queue
    // -------------------------------------------------------------
    await page.fill('#login-email', 'staff.supachai@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Supachai Techavichit');

    // Open Staff Queue
    await page.click('.zen-header nav button:has-text("IT Staff Queue")');
    await expect(page.locator('[data-testid="staff-ticket-queue"]')).toBeVisible();

    // Desktop screenshot of Staff Queue
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.screenshot({ path: path.join(QUEUE_SCREENSHOTS, 'queue-desktop.png') });

    // Filter by keyword and status
    await page.fill('[data-testid="search-input"]', ticketNumber);
    await expect(page.locator('table')).toContainText(ticketNumber);
    await page.screenshot({ path: path.join(QUEUE_SCREENSHOTS, 'queue-filters.png') });

    // Mobile screenshot of Staff Queue
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: path.join(QUEUE_SCREENSHOTS, 'queue-mobile.png') });

    // Restore desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // -------------------------------------------------------------
    // Step 3: IT Staff opens ticket detail & performs triage operations
    // -------------------------------------------------------------
    await page.click(`button:has-text("${ticketNumber}")`);
    await expect(page.locator('[data-testid="staff-ticket-detail"]')).toBeVisible();
    await page.screenshot({ path: path.join(DETAIL_SCREENSHOTS, 'detail-overview.png') });

    // Claim ticket (Assign to self)
    const claimBtn = page.locator('[data-testid="claim-ticket-btn"]');
    if (await claimBtn.isVisible()) {
      await claimBtn.click();
    } else {
      await page.selectOption('[data-testid="assignee-select"]', { label: /Supachai/ });
    }

    // Update IT Priority to URGENT
    await page.selectOption('[data-testid="priority-select"]', 'URGENT');
    await expect(page.locator('[data-testid="ticket-it-priority-badge"]')).toContainText('URGENT');

    // Post an Internal Staff Note (isInternal = true)
    await page.fill(
      '[data-testid="comment-textarea"]',
      'Internal triage note: Checked AP-402 syslogs, switch port error counters elevated. Replaced transceiver.'
    );
    await page.check('[data-testid="internal-note-toggle"]');
    await page.click('[data-testid="submit-comment-btn"]');
    await expect(page.locator('[data-testid="internal-note-badge"]')).toBeVisible();
    await page.screenshot({ path: path.join(DETAIL_SCREENSHOTS, 'detail-internal-notes.png') });

    // Post a Public Comment (isInternal = false)
    await page.fill(
      '[data-testid="comment-textarea"]',
      'Hello Somchai, our network engineers are on-site investigating the 4th floor access point.'
    );
    // ensure checkbox is unchecked
    await page.uncheck('[data-testid="internal-note-toggle"]');
    await page.click('[data-testid="submit-comment-btn"]');
    await expect(page.locator('text=Hello Somchai, our network engineers')).toBeVisible();

    // Transition status to IN_PROGRESS (per BR-06 transition matrix)
    await page.selectOption('[data-testid="status-select"]', 'IN_PROGRESS');
    await expect(page.locator('[data-testid="ticket-status-badge"]')).toContainText(/IN PROGRESS/i);

    // Transition status to RESOLVED (requires resolution modal)
    await page.selectOption('[data-testid="status-select"]', 'RESOLVED');
    await expect(page.locator('.modal-title')).toContainText('Resolution Summary Required');
    await page.screenshot({ path: path.join(DETAIL_SCREENSHOTS, 'detail-resolution-modal.png') });

    await page.fill(
      '[data-testid="resolution-summary-input"]',
      'Replaced degraded optical transceiver on core switch distribution port. Wi-Fi signal restored.'
    );
    await page.click('[data-testid="confirm-resolution-btn"]');

    // Confirm status is now RESOLVED
    await expect(page.locator('[data-testid="ticket-status-badge"]')).toContainText(/RESOLVED/i);

    // Sign out IT staff
    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();

    // -------------------------------------------------------------
    // Step 4: Requester verifies resolution & Privacy isolation
    // -------------------------------------------------------------
    await page.fill('#login-email', 'somchai.pra@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Somchai Prasert');

    // Open ticket in My Tickets
    await page.locator(`tr:has-text("${ticketNumber}")`).click();

    // Verify status is RESOLVED
    await expect(page.locator('.zen-card').first()).toContainText('RESOLVED');

    // Verify Public Comment IS visible to Requester
    await expect(page.locator('text=Hello Somchai, our network engineers')).toBeVisible();

    // Verify Internal Note is NOT visible to Requester (AC-04)
    const pageContent = await page.content();
    expect(pageContent).not.toContain('Internal triage note');
    expect(pageContent).not.toContain('AP-402 syslogs');
    expect(pageContent).not.toContain('Internal Staff Note');

    // Requester view screenshot
    await page.screenshot({ path: path.join(DETAIL_SCREENSHOTS, 'requester-view-isolation.png') });
  });
});
