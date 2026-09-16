# Lab 3 Test Plan & Traceability Matrix

This document defines the test plan, automated test suites, and traceability matrix for TokTickIT Sprint 3 (Authentication, IT Staff Operations, and Admin User Management).

---

## 1. Test Strategy & Architecture

Automated testing for Lab 3 spans three complementary layers:

1. **Backend Integration & Unit Tests (`server/tests/lab-03/`)**:
   - Executed via Vitest + Supertest against an isolated PostgreSQL test database instance.
   - Tests REST endpoints (`/api/auth/*`, `/api/staff/tickets/*`, `/api/admin/users/*`), password hashing, JWT signing/verification, RBAC middleware, and database model constraints.

2. **Frontend Component & Interaction Tests (`client/tests/lab-03/`)**:
   - Executed via Vitest + React Testing Library (RTL).
   - Tests React component rendering, state transitions, AuthContext provider, form validation error handling, role-based navigation bar, change password workflow, staff queue filtering, and admin modal dialogs.

3. **End-to-End Integration Scenarios (`e2e/lab-03/`)**:
   - Executed via Playwright.
   - Comprehensive workflow verification of multi-user login, mandatory first-login password change, staff queue triage, status transitions with mandatory resolution summaries, internal note privacy verification, and admin user creation/management.

---

## 2. Server Test Suite (`server/tests/lab-03/`)

### 2.1. Authentication API Tests (`server/tests/lab-03/auth.api.test.ts`)
- **API-01 (AC-01)**: `POST /api/auth/login` succeeds with valid active credentials and returns signed JWT token + user profile.
- **API-02 (AC-05)**: `POST /api/auth/login` fails with 401 Unauthorized for invalid password or non-existent email.
- **API-03 (AC-05)**: `POST /api/auth/login` fails with 401 Unauthorized for inactive user account (`isActive = false`).
- **API-04 (AC-01)**: `GET /api/auth/me` returns current user profile and role when valid token is provided.
- **API-05 (AC-01)**: `POST /api/auth/logout` invalidates session and confirms logout.
- **API-06 (AC-02)**: `POST /api/auth/change-password` successfully updates password and resets `mustChangePassword = false`.
- **API-07 (AC-02)**: `POST /api/auth/change-password` rejects request when current password is invalid or new password fails complexity rules.

### 2.2. Authorization & RBAC API Tests (`server/tests/lab-03/authorization.api.test.ts`)
- **API-08 (AC-01)**: Protected endpoint returns 401 Unauthorized when authorization token is missing or malformed.
- **API-09 (AC-01)**: Endpoint requiring `STAFF` role returns 403 Forbidden when accessed with `REQUESTER` token.
- **API-10 (AC-01)**: Endpoint requiring `ADMIN` role returns 403 Forbidden when accessed with `STAFF` or `REQUESTER` token.
- **API-11 (AC-03)**: Requester accessing `/api/tickets` receives strictly only their owned tickets even if query parameters request another requester's data.

### 2.3. IT Staff Queue API Tests (`server/tests/lab-03/staff-queue.api.test.ts`)
- **API-12 (AC-06)**: `GET /api/staff/tickets` returns tickets across all requesters when accessed by Staff or Admin.
- **API-13 (AC-06)**: `GET /api/staff/tickets` correctly filters by Ticket Status (`NEW`, `OPEN`, `IN_PROGRESS`, `RESOLVED`, etc.).
- **API-14 (AC-06)**: `GET /api/staff/tickets` correctly filters by Category, Related System, and Assigned Staff ID.
- **API-15 (AC-06)**: `GET /api/staff/tickets` matches keyword search against Ticket Number, Summary, Description, and Requester Name.
- **API-16 (AC-06)**: `GET /api/staff/tickets` handles pagination and sorting (`createdAt`, `requestedPriority`, `itPriority`).

### 2.4. IT Staff Ticket Detail & Operations (`server/tests/lab-03/staff-ticket-detail.api.test.ts`)
- **API-17 (AC-08)**: `GET /api/staff/tickets/:id` returns full ticket metadata, requester details, and attachments for Staff/Admin.
- **API-18 (AC-07)**: `PATCH /api/staff/tickets/:id/status` executes valid status transitions according to the permitted matrix.
- **API-19 (AC-07)**: `PATCH /api/staff/tickets/:id/status` rejects illegal transitions (e.g. `CLOSED` $\rightarrow$ `NEW`) with 400 Bad Request.
- **API-20 (AC-07)**: `PATCH /api/staff/tickets/:id/status` strictly requires a non-empty `resolutionSummary` ($\ge 10$ chars) when transitioning to `RESOLVED` or `CLOSED`.
- **API-21 (AC-08)**: `PATCH /api/staff/tickets/:id/assign` assigns ticket to an active Staff/Admin user, and rejects assignment to inactive users or Requesters.
- **API-22 (AC-08)**: `PATCH /api/staff/tickets/:id/priority` updates `itPriority` independently from Requested Priority.

### 2.5. Comments & Notes API Tests (`server/tests/lab-03/comments-notes.api.test.ts`)
- **API-23 (AC-04)**: `POST /api/staff/tickets/:id/comments` creates internal staff note (`isInternal = true`) when posted by Staff/Admin.
- **API-24 (AC-04)**: `GET /api/tickets/:id` for Requester user strictly omits internal staff notes (`isInternal = true`).
- **API-25 (AC-04)**: `GET /api/staff/tickets/:id` for Staff/Admin user includes all internal staff notes with author attribution.
- **API-26 (AC-12)**: `POST /api/tickets/:id/comments` allows Requesters to post public comments on their owned tickets.
- **API-27 (AC-12)**: `PATCH /api/tickets/:id/indicate-resolved` allows Requester to set `requesterIndicatedResolved = true`.

### 2.6. Administrator User Management API Tests (`server/tests/lab-03/users-admin.api.test.ts`)
- **API-28 (AC-09)**: `GET /api/admin/users` returns user list with role and status filtering for Admin users.
- **API-29 (AC-11)**: `POST /api/admin/users` creates a new user with hashed password and assigned role (`REQUESTER`, `STAFF`, `ADMIN`).
- **API-30 (AC-11)**: `POST /api/admin/users` rejects duplicate email registration with 409 Conflict.
- **API-31 (AC-10)**: `PATCH /api/admin/users/:id` updates user profile, role, and `isActive` flag.
- **API-32 (AC-10)**: `PATCH /api/admin/users/:id` rejects deactivating (`isActive = false`) or demoting the last active Administrator.
- **API-33 (AC-10)**: `PATCH /api/admin/users/:id` rejects an Administrator deactivating their own account.
- **API-34 (AC-02)**: `POST /api/admin/users/:id/reset-password` sets a new initial password and flags `mustChangePassword = true`.

---

## 3. Client Test Suite (`client/tests/lab-03/`)

### 3.1. Authentication Component Tests (`client/tests/lab-03/Login.test.tsx`)
- **UI-01 (AC-01)**: Renders Login form with email/password inputs and sign-in button.
- **UI-02 (AC-01)**: Displays inline validation errors when submitting empty or malformed inputs.
- **UI-03 (AC-01)**: Submits login request, sets auth token, and redirects based on user role.
- **UI-04 (AC-05)**: Displays server authentication error banner upon invalid credentials or disabled account.

### 3.2. Change Password Component Tests (`client/tests/lab-03/ChangePassword.test.tsx`)
- **UI-05 (AC-02)**: Renders current password, new password, and confirm password fields.
- **UI-06 (AC-02)**: Validates password complexity dynamically (min 8 chars, uppercase, lowercase, digit, special char).
- **UI-07 (AC-02)**: Submits new password, updates session state, and redirects into the main application.

### 3.3. Staff Ticket Queue Component Tests (`client/tests/lab-03/StaffTicketQueue.test.tsx`)
- **UI-08 (AC-06)**: Fetches and renders all ticket rows with Status and IT Priority badges.
- **UI-09 (AC-06)**: Filters table items dynamically when search terms or filter dropdown values change.
- **UI-10 (AC-06)**: Renders pagination controls and responds to page change clicks.

### 3.4. Staff Ticket Detail Component Tests (`client/tests/lab-03/StaffTicketDetail.test.tsx`)
- **UI-11 (AC-08)**: Renders ticket details, requester info, attachments, and comment timeline.
- **UI-12 (AC-07)**: Prompts for mandatory resolution summary modal when selecting `RESOLVED` or `CLOSED`.
- **UI-13 (AC-08)**: Assigns staff member via assignee selector and updates IT Priority.
- **UI-14 (AC-04)**: Renders internal staff notes with distinct lock icon banner and separation from public remarks.

### 3.5. User Management Component Tests (`client/tests/lab-03/UserManagement.test.tsx`)
- **UI-15 (AC-09)**: Renders user table with search and role filter dropdowns.
- **UI-16 (AC-11)**: Opens Create User modal, validates inputs, and submits new user account.
- **UI-17 (AC-10)**: Opens Edit User modal and updates active status toggle, disabling toggle for self or last admin.
- **UI-18 (AC-02)**: Opens Reset Password modal and submits password update with first-login requirement.

---

## 4. End-to-End Test Suite (`e2e/lab-03/`)

- **E2E-01 (`e2e/lab-03/authentication.spec.ts`)**: Complete login, session persistence, role navigation verification, first-login password change flow, and logout.
- **E2E-02 (`e2e/lab-03/staff-ticket-flow.spec.ts`)**: IT Staff ticket triage flow: queue search/filtering, opening detail, assigning staff, setting IT priority, posting public comment & internal note, entering resolution summary, and verifying requester view has no internal notes.
- **E2E-03 (`e2e/lab-03/user-administration.spec.ts`)**: Administrator user management flow: creating a new user, searching user, editing role/status, resetting initial password, and verifying safety constraints.

---

## 5. Requirement Traceability Matrix

| Requirement / Acceptance Criterion | Backend Test Cases | Frontend Test Cases | E2E Scenario | Execution Status |
| :--- | :--- | :--- | :--- | :--- |
| **AC-01 (Valid Login & Session Token)** | `API-01`, `API-04`, `API-05`, `API-08`, `API-09`, `API-10` | `UI-01`, `UI-02`, `UI-03` | `E2E-01` | **VERIFIED (100% Pass)** |
| **AC-02 (Mandatory Password Change)** | `API-06`, `API-07`, `API-34` | `UI-05`, `UI-06`, `UI-07`, `UI-18` | `E2E-01` | **VERIFIED (100% Pass)** |
| **AC-03 (Requester Ownership Protection)** | `API-11` | `UI-03` | `E2E-01`, `E2E-02` | **VERIFIED (100% Pass)** |
| **AC-04 (Internal Notes Isolation)** | `API-23`, `API-24`, `API-25` | `UI-14` | `E2E-02` | **VERIFIED (100% Pass)** |
| **AC-05 (Inactive Account Lockout)** | `API-02`, `API-03` | `UI-04` | `E2E-01` | **VERIFIED (100% Pass)** |
| **AC-06 (Staff Ticket Queue & Search)** | `API-12`, `API-13`, `API-14`, `API-15`, `API-16` | `UI-08`, `UI-09`, `UI-10` | `E2E-02` | **VERIFIED (100% Pass)** |
| **AC-07 (Status Progression & Resolution Summary)** | `API-18`, `API-19`, `API-20` | `UI-12` | `E2E-02` | **VERIFIED (100% Pass)** |
| **AC-08 (Staff Assignment & IT Priority)** | `API-17`, `API-21`, `API-22` | `UI-11`, `UI-13` | `E2E-02` | **VERIFIED (100% Pass)** |
| **AC-09 (Admin User Listing & Search)** | `API-28` | `UI-15` | `E2E-03` | **VERIFIED (100% Pass)** |
| **AC-10 (Admin Safety Guardrails)** | `API-31`, `API-32`, `API-33` | `UI-17` | `E2E-03` | **VERIFIED (100% Pass)** |
| **AC-11 (User Creation & Email Uniqueness)** | `API-29`, `API-30` | `UI-16` | `E2E-03` | **VERIFIED (100% Pass)** |
| **AC-12 (Requester Regression & Public Comments)** | `API-26`, `API-27` | `UI-11` | `E2E-02` | **VERIFIED (100% Pass)** |

---

## 6. Execution Evidence & Verification Summary

Across all layers of the testing pyramid, **119 automated tests** run and pass with 0 failures:

| Test Suite Layer | Runner / Tool | Test Files | Total Tests | Passed | Failed | Execution Time |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Server Integration & Unit** | Vitest + Supertest | 17 | 72 | 72 | 0 | ~8.6s |
| **Client Component & RTL** | Vitest + Testing Library | 11 | 40 | 40 | 0 | ~2.2s |
| **End-to-End User Workflows** | Playwright (Chromium) | 3 | 7 | 7 | 0 | ~12.3s |
| **TOTAL** | | **31** | **119** | **119** | **0** | **100% PASS** |

### 6.1. Server Test Suite Output (`npm run test:server`)
```text
 RUN  v2.1.9 /Users/martin/Uni/CPE334/toktickit/server

 ✓ tests/lab-03/auth.api.test.ts (12 tests) 1864ms
 ✓ tests/lab-03/staff-queue.api.test.ts (11 tests) 197ms
 ✓ tests/lab-03/users-admin.api.test.ts (7 tests) 910ms
 ✓ tests/lab-03/staff-ticket-detail.api.test.ts (6 tests) 138ms
 ✓ tests/lab-03/comments-notes.api.test.ts (5 tests) 122ms
 ✓ tests/lab-02/attachments.api.test.ts (5 tests) 108ms
 ✓ tests/lab-02/my-tickets.api.test.ts (3 tests) 138ms
 ✓ tests/lab-03/authorization.api.test.ts (5 tests) 38ms
 ✓ tests/lab-02/create-ticket.api.test.ts (2 tests) 96ms
 ✓ tests/lab-02/validation.unit.test.ts (4 tests) 2ms
 ✓ tests/lab-02/ticket-detail.api.test.ts (2 tests) 62ms
 ✓ tests/lab-02/reference-data.api.test.ts (2 tests) 25ms
 ✓ tests/lab-02/attachment-validator.unit.test.ts (3 tests) 2ms
 ✓ tests/lab-01/categories.test.ts (1 test) 13ms
 ✓ tests/lab-02/requesters.api.test.ts (1 test) 33ms
 ✓ tests/lab-02/ticket-number.unit.test.ts (2 tests) 2ms
 ✓ tests/lab-01/health.test.ts (1 test) 12ms

 Test Files  17 passed (17)
      Tests  72 passed (72)
   Duration  8.64s
```

### 6.2. Client Test Suite Output (`npm run test:client`)
```text
 RUN  v2.1.9 /Users/martin/Uni/CPE334/toktickit/client

 ✓ tests/lab-02/MyTickets.test.tsx (3 tests) 126ms
 ✓ tests/lab-03/ChangePassword.test.tsx (4 tests) 199ms
 ✓ tests/lab-03/Login.test.tsx (5 tests) 263ms
 ✓ tests/lab-02/TicketDetail.test.tsx (3 tests) 268ms
 ✓ tests/lab-03/StaffTicketDetail.test.tsx (5 tests) 295ms
 ✓ tests/lab-03/UserManagement.test.tsx (5 tests) 343ms
 ✓ tests/lab-03/StaffTicketQueue.test.tsx (7 tests) 371ms
 ✓ tests/lab-02/CreateTicket.test.tsx (2 tests) 141ms
 ✓ tests/lab-02/RequesterContext.test.tsx (1 test) 65ms
 ✓ tests/lab-02/RequesterSelect.test.tsx (2 tests) 161ms
 ✓ tests/lab-01/App.test.tsx (3 tests) 160ms

 Test Files  11 passed (11)
      Tests  40 passed (40)
   Duration  2.21s
```

### 6.3. Playwright E2E Test Suite Output (`npm run test:e2e`)
```text
Running 7 tests using 1 worker

  ✓  1 [chromium] › e2e/lab-03/authentication.spec.ts:14:7 › E2E-01: Authentication & Authorization Lifecycle › TC-AUTH-01: Renders login screen and captures initial state (241ms)
  ✓  2 [chromium] › e2e/lab-03/authentication.spec.ts:21:7 › E2E-01: Authentication & Authorization Lifecycle › TC-AUTH-02: Rejects invalid credentials with error alert (348ms)
  ✓  3 [chromium] › e2e/lab-03/authentication.spec.ts:31:7 › E2E-01: Authentication & Authorization Lifecycle › TC-AUTH-03: Rejects inactive user login with lockout error (AC-05) (307ms)
  ✓  4 [chromium] › e2e/lab-03/authentication.spec.ts:42:7 › E2E-01: Authentication & Authorization Lifecycle › TC-AUTH-04: Enforces mandatory first-login password change and enters application (AC-02) (831ms)
  ✓  5 [chromium] › e2e/lab-03/authentication.spec.ts:70:7 › E2E-01: Authentication & Authorization Lifecycle › TC-AUTH-05: Verifies role-based navigation bar visibility (1.0s)
  ✓  6 [chromium] › e2e/lab-03/staff-ticket-flow.spec.ts:14:7 › E2E-02: IT Staff Ticket Lifecycle & Requester Privacy › Complete flow: Ticket creation, Staff queue triage, Operations, and Privacy verification (2.5s)
  ✓  7 [chromium] › e2e/lab-03/user-administration.spec.ts:13:7 › E2E-03: Administrator User Management & Safety Constraints › Complete Admin flow: User list, Create, Search, Edit safety guardrail, and Password reset (3.0s)

  7 passed (12.3s)
```

---

## 7. Captured Visual Evidence Screenshots

All 16 visual evidence screenshots are saved in `artifacts/lab-03/screenshots/`:

| Subsystem | Screenshot Path | Description & AC |
| :--- | :--- | :--- |
| **Authentication** | `artifacts/lab-03/screenshots/authentication/login-screen.png` | Zen Green initial login form |
| **Authentication** | `artifacts/lab-03/screenshots/authentication/login-error-inactive.png` | Lockout message for deactivated account (AC-05) |
| **Authentication** | `artifacts/lab-03/screenshots/authentication/password-change-mandatory.png` | Enforced first-login password change form (AC-02) |
| **Authentication** | `artifacts/lab-03/screenshots/authentication/password-change-success.png` | Success alert on password update completion |
| **Staff Queue** | `artifacts/lab-03/screenshots/staff-queue/queue-desktop.png` | Desktop view ($\ge 768\text{px}$) of IT Staff ticket triage table (AC-06) |
| **Staff Queue** | `artifacts/lab-03/screenshots/staff-queue/queue-filters.png` | Multi-criteria filter toolbar and KPI counter metrics |
| **Staff Queue** | `artifacts/lab-03/screenshots/staff-queue/queue-mobile.png` | Responsive mobile card layout ($< 768\text{px}$) |
| **Staff Ticket Detail** | `artifacts/lab-03/screenshots/staff-ticket-detail/detail-overview.png` | Ticket overview, assign staff dropdown, IT Priority (AC-08) |
| **Staff Ticket Detail** | `artifacts/lab-03/screenshots/staff-ticket-detail/detail-internal-notes.png` | Internal staff note with yellow privacy badge (AC-04) |
| **Staff Ticket Detail** | `artifacts/lab-03/screenshots/staff-ticket-detail/detail-resolution-modal.png` | Mandatory resolution summary modal dialog (AC-07) |
| **Staff Ticket Detail** | `artifacts/lab-03/screenshots/staff-ticket-detail/requester-view-isolation.png` | Requester regression view proving internal notes are hidden (AC-04) |
| **User Administration** | `artifacts/lab-03/screenshots/user-management/user-list-desktop.png` | Admin user table on desktop with search and filter toolbar (AC-09) |
| **User Administration** | `artifacts/lab-03/screenshots/user-management/user-list-mobile.png` | Responsive user management table on mobile ($< 768\text{px}$) |
| **User Administration** | `artifacts/lab-03/screenshots/user-management/create-user-modal.png` | Create New User Account modal with role & password (AC-11) |
| **User Administration** | `artifacts/lab-03/screenshots/user-management/edit-user-safety-guardrail.png` | Edit user modal showing self-deactivation prevented guardrail (AC-10) |
| **User Administration** | `artifacts/lab-03/screenshots/user-management/reset-password-modal.png` | Reset User Password modal with mandatory change requirement (AC-02) |

