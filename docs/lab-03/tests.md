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

| Requirement / Acceptance Criterion | Backend Test Cases | Frontend Test Cases | E2E Scenario | Planned Status |
| :--- | :--- | :--- | :--- | :--- |
| **AC-01 (Valid Login & Session Token)** | `API-01`, `API-04`, `API-05`, `API-08`, `API-09`, `API-10` | `UI-01`, `UI-02`, `UI-03` | `E2E-01` | Planned |
| **AC-02 (Mandatory Password Change)** | `API-06`, `API-07`, `API-34` | `UI-05`, `UI-06`, `UI-07`, `UI-18` | `E2E-01` | Planned |
| **AC-03 (Requester Ownership Protection)** | `API-11` | `UI-03` | `E2E-01`, `E2E-02` | Planned |
| **AC-04 (Internal Notes Isolation)** | `API-23`, `API-24`, `API-25` | `UI-14` | `E2E-02` | Planned |
| **AC-05 (Inactive Account Lockout)** | `API-02`, `API-03` | `UI-04` | `E2E-01` | Planned |
| **AC-06 (Staff Ticket Queue & Search)** | `API-12`, `API-13`, `API-14`, `API-15`, `API-16` | `UI-08`, `UI-09`, `UI-10` | `E2E-02` | Planned |
| **AC-07 (Status Progression & Resolution Summary)** | `API-18`, `API-19`, `API-20` | `UI-12` | `E2E-02` | Planned |
| **AC-08 (Staff Assignment & IT Priority)** | `API-17`, `API-21`, `API-22` | `UI-11`, `UI-13` | `E2E-02` | Planned |
| **AC-09 (Admin User Listing & Search)** | `API-28` | `UI-15` | `E2E-03` | Planned |
| **AC-10 (Admin Safety Guardrails)** | `API-31`, `API-32`, `API-33` | `UI-17` | `E2E-03` | Planned |
| **AC-11 (User Creation & Email Uniqueness)** | `API-29`, `API-30` | `UI-16` | `E2E-03` | Planned |
| **AC-12 (Requester Regression & Public Comments)** | `API-26`, `API-27` | `UI-11` | `E2E-02` | Planned |
