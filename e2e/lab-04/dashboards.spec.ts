import { test, expect } from '@playwright/test';

test.describe('E2E-03 (AC-11, AC-12, AC-13): Role Dashboards & Authoritative Drill-Downs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('Requester, IT Staff, and Administrator dashboard inspection and drill-down navigation', async ({ page }) => {
    // -------------------------------------------------------------
    // Part 1: Requester Dashboard & Drill-down
    // -------------------------------------------------------------
    await page.fill('#login-email', 'somchai.pra@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    // Defaults to Dashboard
    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="count-open"]')).toBeVisible();

    // Drill-down by clicking Open Tickets metric card
    await page.click('[data-testid="metric-open"]');
    await expect(page.locator('[data-testid="my-tickets-container"]')).toBeVisible();

    // Return to Dashboard via Nav Tab
    await page.click('[data-testid="nav-dashboard-btn"]');
    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();

    // Sign out
    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();

    // -------------------------------------------------------------
    // Part 2: IT Staff Dashboard & Drill-down
    // -------------------------------------------------------------
    await page.fill('#login-email', 'staff.supachai@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    // Defaults to Staff Dashboard
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="count-unassigned"]')).toBeVisible();

    // Verify admin card is NOT visible for staff
    await expect(page.locator('[data-testid="admin-user-summary-card"]')).not.toBeVisible();

    // Click Unassigned metric card to drill-down into queue
    await page.click('[data-testid="metric-unassigned"]');
    await expect(page.locator('[data-testid="staff-ticket-queue"]')).toBeVisible();

    // Return to dashboard
    await page.click('[data-testid="nav-dashboard-btn"]');
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();

    // Sign out
    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();

    // -------------------------------------------------------------
    // Part 3: Administrator Dashboard with User Management Extension
    // -------------------------------------------------------------
    await page.fill('#login-email', 'admin@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    // Admin lands on Dashboard
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();

    // Admin user summary card must be visible
    const adminSummaryCard = page.locator('[data-testid="admin-user-summary-card"]');
    await expect(adminSummaryCard).toBeVisible();
    await expect(page.locator('[data-testid="admin-total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-active-staff"]')).toBeVisible();

    // Click Manage Users button in summary card
    await page.click('[data-testid="admin-manage-users-btn"]');
    await expect(page.locator('[data-testid="user-management-page"]')).toBeVisible();
  });
});
