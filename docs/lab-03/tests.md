# Lab 3 Test Plan & Traceability Matrix

This document defines the test plan, test cases, and traceability matrix for TokTickIT Sprint 3 (Authentication, IT Staff Operations, and Admin User Management).

---

## 1. Test Strategy & Architecture

Automated testing for Lab 3 spans three complementary layers:

1. **Backend Integration & Unit Tests (`server/tests/lab-03/`)**:
   - Executed via Vitest + Supertest against an isolated PostgreSQL test database instance.
   - Tests REST endpoints (`/api/auth/*`, `/api/staff/tickets/*`, `/api/admin/users/*`), password hashing, JWT signing/verification, RBAC middleware, and database model constraints.

2. **Frontend Component & Interaction Tests (`client/tests/lab-03/`)**:
   - Executed via Vitest + React Testing Library (RTL).
   - Tests React component rendering, state transitions, AuthContext provider, form validation error handling, role-based navigation bar, staff queue filtering, and admin modal dialogs.

3. **End-to-End Integration Scenarios (`e2e/lab-03/`)**:
   - Comprehensive workflow verification of multi-user login, staff queue triage, status transitions with mandatory resolution summaries, internal note privacy verification, and admin user creation/management.

---

## 2. Server Test Suite (`server/tests/lab-03/`)

### 2.1. Auth & RBAC Middleware (`auth.test.ts`)
- **TEST-BE-01**: `POST /api/auth/login` succeeds with valid credentials and returns signed JWT token + user profile.
- **TEST-BE-02**: `POST /api/auth/login` fails with 401 Unauthorized for invalid password.
- **TEST-BE-03**: `POST /api/auth/login` fails with 401 Unauthorized for non-existent email.
- **TEST-BE-04**: `POST /api/auth/login` fails with 401 Unauthorized for inactive user (`isActive = false`).
- **TEST-BE-05**: `GET /api/auth/me` returns current user profile when valid token provided.
- **TEST-BE-06**: Protected endpoint returns 401 Unauthorized when authorization token is missing or malformed.
- **TEST-BE-07**: Endpoint requiring `STAFF` role returns 403 Forbidden when accessed with `REQUESTER` token.
- **TEST-BE-08**: Endpoint requiring `ADMIN` role returns 403 Forbidden when accessed with `STAFF` token.

### 2.2. IT Staff Queue & Search (`staffQueue.test.ts`)
- **TEST-BE-09**: `GET /api/staff/tickets` returns tickets across all requesters when accessed by Staff or Admin.
- **TEST-BE-10**: `GET /api/staff/tickets` correctly filters by Ticket Status (`NEW`, `IN_PROGRESS`, `RESOLVED`, etc.).
- **TEST-BE-11**: `GET /api/staff/tickets` correctly filters by Category, Related System, and Assigned Staff ID.
- **TEST-BE-12**: `GET /api/staff/tickets` matches keyword search against Ticket Number, Summary, Description, and Requester Name.
- **TEST-BE-13**: `GET /api/staff/tickets` handles pagination and sorting (`createdAt`, `requestedPriority`, `itPriority`).

### 2.3. IT Staff Operations & Notes (`staffOperations.test.ts`)
- **TEST-BE-14**: `PATCH /api/staff/tickets/:id/status` executes valid status transitions (e.g. `NEW` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_PROGRESS`).
- **TEST-BE-15**: `PATCH /api/staff/tickets/:id/status` rejects illegal transitions (e.g. `CLOSED` $\rightarrow$ `NEW`) with 400 Bad Request.
- **TEST-BE-16**: `PATCH /api/staff/tickets/:id/status` requires non-empty `resolutionSummary` when transitioning to `RESOLVED` or `CLOSED`.
- **TEST-BE-17**: `PATCH /api/staff/tickets/:id/assign` assigns ticket to an active Staff/Admin user.
- **TEST-BE-18**: `PATCH /api/staff/tickets/:id/assign` rejects assignment to inactive users or users with `REQUESTER` role.
- **TEST-BE-19**: `PATCH /api/staff/tickets/:id/priority` updates `itPriority`.
- **TEST-BE-20**: `POST /api/staff/tickets/:id/comments` creates internal staff note (`isInternal = true`).
- **TEST-BE-21**: `GET /api/tickets/:id` for Requester user strips out internal staff notes (`isInternal = true` omitted from response).
- **TEST-BE-22**: `GET /api/staff/tickets/:id` for Staff/Admin user includes all internal staff notes.

### 2.4. Admin User Management (`adminUsers.test.ts`)
- **TEST-BE-23**: `GET /api/admin/users` returns paginated user list with role and status filtering for Admin users.
- **TEST-BE-24**: `POST /api/admin/users` creates a new user with hashed password and assigned role (`REQUESTER`, `STAFF`, `ADMIN`).
- **TEST-BE-25**: `POST /api/admin/users` rejects duplicate email registration with 409 Conflict.
- **TEST-BE-26**: `PATCH /api/admin/users/:id` updates user profile, department, role, and `isActive` flag.
- **TEST-BE-27**: `PATCH /api/admin/users/:id` rejects deactivating (`isActive = false`) the last active Admin in the database.
- **TEST-BE-28**: `POST /api/admin/users/:id/reset-password` updates user password hash securely.

---

## 3. Client Test Suite (`client/tests/lab-03/`)

### 3.1. Authentication Components (`Login.test.tsx`)
- **TEST-FE-01**: Renders Login form with email/password inputs and sign-in button.
- **TEST-FE-02**: Displays inline validation errors when submitting empty or malformed inputs.
- **TEST-FE-03**: Submits login request, sets auth token, and redirects based on user role.
- **TEST-FE-04**: Displays server authentication error banner upon invalid credentials.

### 3.2. Role-Aware Header & Shell (`Navbar.test.tsx`)
- **TEST-FE-05**: Displays active user name and `REQUESTER` badge for Requester logins.
- **TEST-FE-06**: Displays `STAFF` badge and IT Staff Queue link for Staff logins.
- **TEST-FE-07**: Displays `ADMIN` badge, IT Staff Queue link, and User Management link for Admin logins.
- **TEST-FE-08**: Triggers Logout action, clears auth storage, and navigates to Login page.

### 3.3. Staff Queue Component (`StaffQueue.test.tsx`)
- **TEST-FE-09**: Fetches and renders all ticket rows with Status and IT Priority badges.
- **TEST-FE-10**: Filters table items dynamically when search terms or filter dropdown values change.
- **TEST-FE-11**: Renders pagination controls and responds to page change clicks.

### 3.4. Staff Ticket Operations Component (`StaffTicketDetail.test.tsx`)
- **TEST-FE-12**: Renders ticket details, requester info, attachments, and comment timeline.
- **TEST-FE-13**: Updates status via status selector and prompts for mandatory resolution summary on resolve.
- **TEST-FE-14**: Assigns staff member via assignee selector.
- **TEST-FE-15**: Renders internal staff notes with distinct lock icon banner.

### 3.5. Admin User Management Component (`AdminUsers.test.tsx`)
- **TEST-FE-16**: Renders user table with search and role filter dropdowns.
- **TEST-FE-17**: Opens Add User modal, validates inputs, and submits new user account.
- **TEST-FE-18**: Opens Edit User modal and updates active status toggle.
- **TEST-FE-19**: Opens Reset Password modal and submits password update.

---

## 4. Requirement Traceability Matrix

| Requirement / Business Rule | Backend Test Cases | Frontend Test Cases | E2E Scenario | Status |
| :--- | :--- | :--- | :--- | :--- |
| **FR-01, FR-02 (User Login & Auth State)** | `TEST-BE-01`, `TEST-BE-02`, `TEST-BE-03` | `TEST-FE-01`, `TEST-FE-03` | `E2E-01` | Pending Execution |
| **FR-03, FR-04 (Session & Logout)** | `TEST-BE-05` | `TEST-FE-04`, `TEST-FE-08` | `E2E-01` | Pending Execution |
| **FR-05 (Inactive Account Lockout)** | `TEST-BE-04` | `TEST-FE-04` | `E2E-01` | Pending Execution |
| **FR-06, FR-07, FR-08 (Staff Queue List & Search)** | `TEST-BE-09`, `TEST-BE-10`, `TEST-BE-11`, `TEST-BE-12` | `TEST-FE-09`, `TEST-FE-10` | `E2E-02` | Pending Execution |
| **FR-09 (Staff Queue Pagination & Sorting)** | `TEST-BE-13` | `TEST-FE-11` | `E2E-02` | Pending Execution |
| **FR-10, FR-11 (Staff Ticket Detail & Status)** | `TEST-BE-14`, `TEST-BE-15` | `TEST-FE-12`, `TEST-FE-13` | `E2E-03` | Pending Execution |
| **FR-12, FR-13 (Staff Assignment & IT Priority)** | `TEST-BE-17`, `TEST-BE-18`, `TEST-BE-19` | `TEST-FE-14` | `E2E-03` | Pending Execution |
| **FR-14, FR-15 (Internal Notes & Public Comments)** | `TEST-BE-20`, `TEST-BE-21`, `TEST-BE-22` | `TEST-FE-15` | `E2E-03` | Pending Execution |
| **FR-16 (Resolution Requirement)** | `TEST-BE-16` | `TEST-FE-13` | `E2E-03` | Pending Execution |
| **FR-17, FR-18 (Admin User List & Search)** | `TEST-BE-23` | `TEST-FE-16` | `E2E-04` | Pending Execution |
| **FR-19, FR-20, FR-21 (Admin User Create/Edit/Reset)** | `TEST-BE-24`, `TEST-BE-25`, `TEST-BE-26`, `TEST-BE-28` | `TEST-FE-17`, `TEST-FE-18`, `TEST-FE-19` | `E2E-04` | Pending Execution |
| **FR-22, FR-24 (RBAC Routing & Unauthorized Access)** | `TEST-BE-06`, `TEST-BE-07`, `TEST-BE-08` | `TEST-FE-05`, `TEST-FE-06`, `TEST-FE-07` | `E2E-01` | Pending Execution |
| **FR-23, FR-25 (Requester Privacy & Internal Isolation)** | `TEST-BE-21` | `TEST-FE-15` | `E2E-03` | Pending Execution |
| **BR-05 (Status Transition Rules)** | `TEST-BE-14`, `TEST-BE-15` | `TEST-FE-13` | `E2E-03` | Pending Execution |
| **BR-09 (Last Admin Protection)** | `TEST-BE-27` | `TEST-FE-18` | `E2E-04` | Pending Execution |
