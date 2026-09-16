import { test, expect } from '@playwright/test';
import path from 'path';

const AUTH_SCREENSHOTS = path.resolve(process.cwd(), 'artifacts/lab-03/screenshots/authentication');

test.describe('E2E-01: Authentication & Authorization Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh unauthenticated state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  });

  test('TC-AUTH-01: Renders login screen and captures initial state', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('TokTickIT');
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await page.screenshot({ path: path.join(AUTH_SCREENSHOTS, 'login-screen.png') });
  });

  test('TC-AUTH-02: Rejects invalid credentials with error alert', async ({ page }) => {
    await page.fill('#login-email', 'somchai.pra@kmutt.ac.th');
    await page.fill('#login-password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    const alert = page.locator('.alert-danger');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/invalid/i);
  });

  test('TC-AUTH-03: Rejects inactive user login with lockout error (AC-05)', async ({ page }) => {
    await page.fill('#login-email', 'wandee.old@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    const alert = page.locator('.alert-danger');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/inactive|deactivated/i);
    await page.screenshot({ path: path.join(AUTH_SCREENSHOTS, 'login-error-inactive.png') });
  });

  test('TC-AUTH-04: Enforces mandatory first-login password change and enters application (AC-02)', async ({ page }) => {
    await page.fill('#login-email', 'firstlogin@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');

    // Should be redirected to Change Password screen
    await expect(page.locator('h1')).toContainText('Change Your Password');
    await expect(page.locator('#current-password')).toBeVisible();
    await expect(page.locator('#new-password')).toBeVisible();
    await expect(page.locator('#confirm-password')).toBeVisible();
    await page.screenshot({ path: path.join(AUTH_SCREENSHOTS, 'password-change-mandatory.png') });

    // Submit valid new password
    await page.fill('#current-password', 'Password123!');
    await page.fill('#new-password', 'NewSecure123!@');
    await page.fill('#confirm-password', 'NewSecure123!@');
    await page.click('button[type="submit"]');

    // Successfully transitioned into main application
    await expect(page.locator('.zen-header')).toBeVisible();
    await expect(page.locator('.zen-header')).toContainText('First Login User');
    await page.screenshot({ path: path.join(AUTH_SCREENSHOTS, 'password-change-success.png') });

    // Sign out
    await page.click('button:has-text("Sign Out")');
    await expect(page.locator('#login-email')).toBeVisible();
  });

  test('TC-AUTH-05: Verifies role-based navigation bar visibility', async ({ page }) => {
    // 1. Requester Role: somchai.pra@kmutt.ac.th
    await page.fill('#login-email', 'somchai.pra@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Somchai Prasert');
    await expect(page.locator('.zen-header nav button:has-text("My Tickets")')).toBeVisible();
    await expect(page.locator('.zen-header nav button:has-text("Create Ticket")')).toBeVisible();
    await expect(page.locator('.zen-header nav button:has-text("IT Staff Queue")')).not.toBeVisible();
    await expect(page.locator('.zen-header nav button:has-text("User Management")')).not.toBeVisible();
    await page.click('button:has-text("Sign Out")');

    // 2. IT Staff Role: staff.supachai@kmutt.ac.th
    await page.fill('#login-email', 'staff.supachai@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Supachai Techavichit');
    await expect(page.locator('.zen-header nav button:has-text("IT Staff Queue")')).toBeVisible();
    await expect(page.locator('.zen-header nav button:has-text("My Tickets")')).toBeVisible();
    await expect(page.locator('.zen-header nav button:has-text("User Management")')).not.toBeVisible();
    await page.click('button:has-text("Sign Out")');

    // 3. Admin Role: admin@kmutt.ac.th
    await page.fill('#login-email', 'admin@kmutt.ac.th');
    await page.fill('#login-password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.zen-header')).toContainText('Admin System');
    await expect(page.locator('.zen-header nav button:has-text("IT Staff Queue")')).toBeVisible();
    await expect(page.locator('.zen-header nav button:has-text("User Management")')).toBeVisible();
    await expect(page.locator('.zen-header nav button:has-text("My Tickets")')).toBeVisible();
    await page.click('button:has-text("Sign Out")');
  });
});
