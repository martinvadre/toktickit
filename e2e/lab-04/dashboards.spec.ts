import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOTS = path.resolve(process.cwd(), 'artifacts/lab-04/screenshots/dashboards');

test.describe('E2E-03: Role-Appropriate Dashboards – Metrics Drill-Down (AC-11, AC-12, AC-13)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('TC-DASH-01: Requester dashboard displays metrics and drill-down links (AC-11)', async ({ page }) => {
    // Login as Requester (somchai.pra has: IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CLOSED, NEW tickets)
    await page.fill('#login-email', 'somchai.pra@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Somchai Prasert');

    // After login, Dashboard is the default tab
    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();

    // Verify KPI metric cards are rendered
    await expect(page.locator('[data-testid="metric-open"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-in-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-waiting"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-resolved"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-total"]')).toBeVisible();

    // Metric values must be non-negative integers
    const totalText = await page.locator('[data-testid="count-total"]').textContent();
    const total = parseInt(totalText || '0', 10);
    expect(total).toBeGreaterThan(0);

    // Verify recent tickets table is visible (Somchai has multiple tickets)
    await expect(page.locator('[data-testid="recent-tickets-table"]')).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOTS, 'requester-dashboard.png') });

    // Drill-down: Click "In Progress" metric card → navigates to My Tickets with filter
    await page.click('[data-testid="metric-in-progress"]');
    // Should transition to My Tickets view (dashboard is no longer shown)
    await expect(page.locator('[data-testid="requester-dashboard"]')).not.toBeVisible();

    // Navigate back to Dashboard
    await page.click('[data-testid="nav-dashboard-btn"]');
    await expect(page.locator('[data-testid="requester-dashboard"]')).toBeVisible();

    // Drill-down: Click "Waiting on You" card
    await page.click('[data-testid="metric-waiting"]');
    await expect(page.locator('[data-testid="requester-dashboard"]')).not.toBeVisible();
    await page.click('[data-testid="nav-dashboard-btn"]');

    // Quick action: "Create New Ticket" button
    await expect(page.locator('[data-testid="quick-create-ticket"]')).toBeVisible();
    await page.click('[data-testid="quick-create-ticket"]');
    await expect(page.locator('h1')).toContainText('Submit a New IT Ticket');

    await page.click('[data-testid="nav-dashboard-btn"]');
    await page.screenshot({ path: path.join(SCREENSHOTS, 'requester-dashboard-post-drilldown.png') });

    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();
  });

  test('TC-DASH-02: IT Staff dashboard displays operational metrics and drill-down (AC-12)', async ({ page }) => {
    // Login as IT Staff
    await page.fill('#login-email', 'staff.supachai@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Supachai Techavichit');

    // Staff sees the Staff Operational Dashboard after login
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();

    // KPI metric cards for staff
    await expect(page.locator('[data-testid="metric-unassigned"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-my-assigned"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-in-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-waiting"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-high-urgent"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-total-active"]')).toBeVisible();

    // Verify counts are non-negative integers
    const unassignedText = await page.locator('[data-testid="count-unassigned"]').textContent();
    const unassigned = parseInt(unassignedText || '0', 10);
    expect(unassigned).toBeGreaterThanOrEqual(0);

    await page.screenshot({ path: path.join(SCREENSHOTS, 'staff-dashboard.png') });

    // Verify urgent tickets table or empty state
    const urgentTable = page.locator('[data-testid="urgent-tickets-table"]');
    const emptyUrgent = page.locator('[data-testid="empty-urgent-tickets"]');
    const urgentVisible = await urgentTable.isVisible();
    const emptyUrgentVisible = await emptyUrgent.isVisible();
    expect(urgentVisible || emptyUrgentVisible).toBeTruthy();

    // Verify recent tickets table or empty state
    const recentTable = page.locator('[data-testid="recent-tickets-table"]');
    const emptyRecent = page.locator('[data-testid="empty-recent-tickets"]');
    const recentVisible = await recentTable.isVisible();
    const emptyRecentVisible = await emptyRecent.isVisible();
    expect(recentVisible || emptyRecentVisible).toBeTruthy();

    // Drill-down: Click "Unassigned" metric card → navigates to Staff Queue
    await page.click('[data-testid="metric-unassigned"]');
    await expect(page.locator('[data-testid="staff-ticket-queue"]')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, 'staff-queue-drilldown.png') });

    // Navigate back to Dashboard
    await page.click('[data-testid="nav-dashboard-btn"]');
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();

    // View Full Queue button
    await expect(page.locator('[data-testid="view-full-queue-btn"]')).toBeVisible();
    await page.click('[data-testid="view-full-queue-btn"]');
    await expect(page.locator('[data-testid="staff-ticket-queue"]')).toBeVisible();

    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();
  });

  test('TC-DASH-03: Admin dashboard shows staff metrics PLUS user account summary (AC-13)', async ({ page }) => {
    // Login as Administrator
    await page.fill('#login-email', 'admin@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Admin System');

    // Admin sees the Staff Dashboard (with Admin User Summary extension)
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();

    // Standard IT Staff operational KPIs are visible
    await expect(page.locator('[data-testid="metric-unassigned"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-my-assigned"]')).toBeVisible();

    // Admin User Management Summary card (UI-13 / AC-13)
    await expect(page.locator('[data-testid="admin-user-summary-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-active-staff"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-active-admins"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-active-requesters"]')).toBeVisible();

    // Values must be positive integers
    const totalUsersText = await page.locator('[data-testid="admin-total-users"]').textContent();
    const totalUsers = parseInt(totalUsersText || '0', 10);
    expect(totalUsers).toBeGreaterThan(0);

    const activeStaffText = await page.locator('[data-testid="admin-active-staff"]').textContent();
    const activeStaff = parseInt(activeStaffText || '0', 10);
    expect(activeStaff).toBeGreaterThan(0);

    await page.screenshot({ path: path.join(SCREENSHOTS, 'admin-dashboard.png') });

    // Responsive: Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="staff-dashboard"]')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, 'admin-dashboard-mobile.png') });
    await page.setViewportSize({ width: 1280, height: 720 });

    // Manage Users button navigates to User Management
    await expect(page.locator('[data-testid="admin-manage-users-btn"]')).toBeVisible();
    await page.click('[data-testid="admin-manage-users-btn"]');
    await expect(page.locator('[data-testid="user-management-page"]')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS, 'admin-user-management-nav.png') });

    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();
  });
});
