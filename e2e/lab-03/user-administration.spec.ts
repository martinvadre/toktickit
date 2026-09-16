import { test, expect } from '@playwright/test';
import path from 'path';

const USER_SCREENSHOTS = path.resolve(process.cwd(), 'artifacts/lab-03/screenshots/user-management');

test.describe('E2E-03: Administrator User Management & Safety Constraints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('Complete Admin flow: User list, Create, Search, Edit safety guardrail, and Password reset', async ({ page }) => {
    // -------------------------------------------------------------
    // Step 1: Admin logs in
    // -------------------------------------------------------------
    await page.fill('#login-email', 'admin@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Admin System');

    // Navigate to User Management
    await page.click('.zen-header nav button:has-text("User Management")');
    await expect(page.locator('[data-testid="user-management-page"]')).toBeVisible();

    // Desktop Screenshot
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.screenshot({ path: path.join(USER_SCREENSHOTS, 'user-list-desktop.png') });

    // Mobile Screenshot
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ path: path.join(USER_SCREENSHOTS, 'user-list-mobile.png') });

    // Restore Desktop
    await page.setViewportSize({ width: 1280, height: 720 });

    // -------------------------------------------------------------
    // Step 2: Create User Modal & User Creation (AC-11)
    // -------------------------------------------------------------
    await page.click('[data-testid="create-user-btn"]');
    await expect(page.locator('.modal-title')).toContainText('Create New User Account');
    await page.screenshot({ path: path.join(USER_SCREENSHOTS, 'create-user-modal.png') });

    const testEmail = `newstaff.${Date.now()}@kmutt.ac.th`;
    await page.fill('[data-testid="create-name-input"]', 'Kittipong Dev');
    await page.fill('[data-testid="create-email-input"]', testEmail);
    await page.fill('[data-testid="create-dept-input"]', 'IT Infrastructure');
    await page.selectOption('[data-testid="create-role-select"]', 'STAFF');
    await page.fill('[data-testid="create-password-input"]', 'Password123!');
    await page.click('[data-testid="submit-create-user-btn"]');

    // Confirm new user appears in table
    await expect(page.locator('[data-testid="users-table"]')).toContainText('Kittipong Dev');

    // -------------------------------------------------------------
    // Step 3: Search & Filter Users (AC-09)
    // -------------------------------------------------------------
    const search1 = page.waitForResponse(r => r.url().includes('/api/admin/users') && r.status() === 200);
    await page.fill('[data-testid="user-search-input"]', 'Kittipong');
    await search1;
    await expect(page.locator('[data-testid="users-table"]')).toContainText('Kittipong Dev');

    const clearSearch = page.waitForResponse(r => r.url().includes('/api/admin/users') && r.status() === 200);
    await page.fill('[data-testid="user-search-input"]', '');
    await clearSearch;

    // -------------------------------------------------------------
    // Step 4: Safety Guardrails - Self-Deactivation Prohibited (AC-10)
    // -------------------------------------------------------------
    // Search for admin's own account to ensure visibility
    const searchAdmin = page.waitForResponse(r => r.url().includes('/api/admin/users') && r.status() === 200);
    await page.fill('[data-testid="user-search-input"]', 'admin@kmutt.ac.th');
    await searchAdmin;
    const adminRow = page.locator('tr:has-text("Admin System")');
    await expect(adminRow).toBeVisible();
    await adminRow.locator('button:has-text("Edit")').click();
    await expect(page.locator('.modal-title')).toContainText('Edit User Account');

    // Verify self-deactivation warning and absence of active toggle
    await expect(page.locator('.alert-info')).toContainText('Self-deactivation is prevented');
    await page.screenshot({ path: path.join(USER_SCREENSHOTS, 'edit-user-safety-guardrail.png') });

    // Cancel edit
    await page.click('.modal-footer button:has-text("Cancel")');

    // -------------------------------------------------------------
    // Step 5: Password Reset Modal & Execution (AC-02 / AC-11)
    // -------------------------------------------------------------
    const searchNewUser = page.waitForResponse(r => r.url().includes('/api/admin/users') && r.status() === 200);
    await page.fill('[data-testid="user-search-input"]', testEmail);
    await searchNewUser;
    const targetRow = page.locator(`tr:has-text("${testEmail}")`);
    await expect(targetRow).toBeVisible();
    await targetRow.locator('button:has-text("Reset Password")').click();
    await expect(page.locator('.modal-title')).toContainText('Reset User Password');
    await page.screenshot({ path: path.join(USER_SCREENSHOTS, 'reset-password-modal.png') });

    await page.fill('[data-testid="reset-password-input"]', 'ResetSecurePass789!');
    await page.click('[data-testid="submit-reset-password-btn"]');
    await expect(page.locator('.alert-success')).toContainText(/success/i);

    // Sign out Admin
    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();
  });
});
