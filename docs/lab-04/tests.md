# Lab 4 Test Plan & Traceability Matrix: Actions Taken, Dashboards, and Regression

This document defines the test plan, automated test suites, and traceability matrix for TokTickIT Sprint 4.

---

## 1. Test Strategy & Architecture

Automated testing for Lab 4 spans three rigorous layers:

1. **Backend Integration & Unit Tests (`server/tests/lab-04/`)**:
   - Executed via Vitest + Supertest against the PostgreSQL test database.
   - Tests `ActionTaken` CRUD, authorization, inactive assignee rejection, follow-up note validation, status transitions, resolution summary gate, conflict detection (stale update 409), requester dashboard queries, staff dashboard queries, and admin metrics.

2. **Frontend Component & Interaction Tests (`client/tests/lab-04/`)**:
   - Executed via Vitest + React Testing Library (RTL).
   - Tests Actions Taken rendering on IT Staff Detail and Requester Detail, Record Action modal, form validation, follow-up conditional inputs, edit action flow, dynamic status transition controls, resolution dialog, and Requester/Staff Dashboard card metrics and drill-downs.

3. **End-to-End Integration Scenarios (`e2e/lab-04/`)**:
   - Executed via Playwright.
   - Full-system browser validation covering:
     - End-to-end Actions Taken creation, edit, and requester read-only verification.
     - Authoritative ticket resolution workflow and gate enforcement.
     - Requester and IT Staff dashboard loading, metric validation, and drill-down navigation.

---

## 2. Server Test Suite (`server/tests/lab-04/`)

### 2.1. Actions Taken API Tests (`server/tests/lab-04/actions-taken.api.test.ts`)
- **API-01 (AC-01)**: `POST /api/staff/tickets/:id/actions-taken` creates a valid action entry with auto-captured performer.
- **API-02 (AC-01)**: `POST /api/staff/tickets/:id/actions-taken` allows selecting another active IT Staff member as performer.
- **API-03 (AC-02)**: `POST /api/staff/tickets/:id/actions-taken` rejects creation with 400 Bad Request when `followUpRequired = true` but `followUpNote` is empty.
- **API-04 (AC-03)**: `POST /api/staff/tickets/:id/actions-taken` rejects creation with 400 Bad Request when `performedById` belongs to an inactive user or a requester.
- **API-05 (AC-04)**: `GET /api/tickets/:id/actions-taken` returns all actions taken for a ticket when requested by the owning Requester.
- **API-06 (AC-04)**: `GET /api/tickets/:id/actions-taken` returns 403 Forbidden when requested by a Requester who does NOT own the ticket.
- **API-07 (AC-05)**: `PATCH /api/staff/tickets/:id/actions-taken/:actionId` updates action taken fields and status (`COMPLETED`, `CANCELLED`).
- **API-08 (AC-03)**: `PATCH /api/staff/tickets/:id/actions-taken/:actionId` rejects updating performer to an inactive user.

### 2.2. Ticket Workflow API Tests (`server/tests/lab-04/ticket-workflow.api.test.ts`)
- **API-09 (AC-06)**: `PATCH /api/staff/tickets/:id/status` executes valid transition from `OPEN` to `IN_PROGRESS`.
- **API-10 (AC-07)**: `PATCH /api/staff/tickets/:id/status` rejects illegal transition (e.g. `NEW` $\rightarrow$ `RESOLVED`) with 400 Bad Request.
- **API-11 (AC-08)**: `PATCH /api/staff/tickets/:id/status` rejects transition to `RESOLVED` when `resolutionSummary` is missing or $< 10$ characters.
- **API-12 (AC-08)**: `PATCH /api/staff/tickets/:id/status` succeeds transitioning to `RESOLVED` when valid `resolutionSummary` ($\ge 10$ characters) is provided.
- **API-13 (AC-09)**: `PATCH /api/tickets/:id/indicate-resolved` sets `requesterIndicatedResolved = true` without altering `currentStatus`.
- **API-14 (AC-10)**: `PATCH /api/staff/tickets/:id/status` returns 409 Conflict (`STALE_UPDATE_CONFLICT`) when an outdated `expectedUpdatedAt` is provided.

### 2.3. Requester Dashboard API Tests (`server/tests/lab-04/requester-dashboard.api.test.ts`)
- **API-15 (AC-11)**: `GET /api/requester/dashboard` returns authoritative counts for Open, In Progress, Waiting, and Resolved tickets for the authenticated Requester.
- **API-16 (AC-11)**: `GET /api/requester/dashboard` returns strictly only tickets submitted by the authenticated user in recent tickets list.
- **API-17 (AC-11)**: `GET /api/requester/dashboard` returns 401 Unauthorized when unauthenticated and 403 Forbidden if accessed with non-requester role.

### 2.4. Staff & Admin Dashboard API Tests (`server/tests/lab-04/staff-dashboard.api.test.ts`)
- **API-18 (AC-12)**: `GET /api/staff/dashboard` returns correct counts for Unassigned, My Assigned, and Status breakdowns.
- **API-19 (AC-12)**: `GET /api/staff/dashboard` returns urgent and recent tickets list.
- **API-20 (AC-13)**: `GET /api/admin/dashboard` returns staff metrics plus user account summary (total, active staff, active requesters, active admins).

---

## 3. Client Component Test Suite (`client/tests/lab-04/`)

### 3.1. Actions Taken Component Tests (`client/tests/lab-04/ActionsTaken.test.tsx`)
- **UI-01 (AC-01)**: Renders list of Actions Taken with Date, Performer, Description, and Result.
- **UI-02 (AC-02)**: Displays validation error when attempting to submit Record Action with follow-up required but no note.
- **UI-03 (AC-04)**: Renders read-only Actions Taken on Requester view with create/edit buttons omitted.
- **UI-04 (AC-05)**: Allows IT Staff to edit an existing action and change its status.

### 3.2. Ticket Workflow Component Tests (`client/tests/lab-04/TicketWorkflow.test.tsx`)
- **UI-05 (AC-06)**: Displays only permitted status transition options based on current ticket status.
- **UI-06 (AC-08)**: Opens resolution modal when selecting `RESOLVED`, enforcing minimum 10-character input.
- **UI-07 (AC-10)**: Displays conflict alert banner if API returns 409 Conflict.

### 3.3. Requester Dashboard Component Tests (`client/tests/lab-04/RequesterDashboard.test.tsx`)
- **UI-08 (AC-11)**: Renders Requester metric cards with correct values.
- **UI-09 (AC-11)**: Clicking metric card triggers drill-down to My Tickets with appropriate filter.
- **UI-10 (AC-11)**: Renders recent tickets list and quick action buttons.

### 3.4. Staff Dashboard Component Tests (`client/tests/lab-04/StaffDashboard.test.tsx`)
- **UI-11 (AC-12)**: Renders IT Staff operational metric cards (Unassigned, My Assigned, In Progress, etc.).
- **UI-12 (AC-12)**: Clicking Unassigned card navigates to `/staff/queue` with unassigned filter.
- **UI-13 (AC-13)**: When user is Admin, renders User Management Summary card.

---

## 4. End-to-End Test Suite (`e2e/lab-04/`)

- **E2E-01 (AC-01, AC-04)**: `e2e/lab-04/actions-taken-flow.spec.ts`: Staff records action taken -> Requester logs in and views action in read-only mode.
- **E2E-02 (AC-06, AC-08)**: `e2e/lab-04/ticket-resolution.spec.ts`: Requester indicates problem resolved -> Staff opens ticket and formally resolves with resolution summary.
- **E2E-03 (AC-11, AC-12, AC-13)**: `e2e/lab-04/dashboards.spec.ts`: Requester dashboard metrics drill-down -> Staff dashboard metrics drill-down -> Admin dashboard user counts.

---

## 5. Traceability Matrix

| Requirement / AC | Test ID | Type | Automated Test File | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **AC-01** (Create Action Taken) | API-01, API-02, UI-01, E2E-01 | API / UI / E2E | `server/tests/lab-04/actions-taken.api.test.ts`, `client/tests/lab-04/ActionsTaken.test.tsx`, `e2e/lab-04/actions-taken-flow.spec.ts` | Pass |
| **AC-02** (Follow-Up Note Validation) | API-03, UI-02 | API / UI | `server/tests/lab-04/actions-taken.api.test.ts`, `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **AC-03** (Inactive Assignee Rejection) | API-04, API-08 | API | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| **AC-04** (Requester Read-Only Access) | API-05, API-06, UI-03, E2E-01 | API / UI / E2E | `server/tests/lab-04/actions-taken.api.test.ts`, `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **AC-05** (Action Taken Status Transition) | API-07, UI-04 | API / UI | `server/tests/lab-04/actions-taken.api.test.ts`, `client/tests/lab-04/ActionsTaken.test.tsx` | Pass |
| **AC-06** (Permitted Ticket Transitions) | API-09, UI-05, E2E-02 | API / UI / E2E | `server/tests/lab-04/ticket-workflow.api.test.ts`, `client/tests/lab-04/TicketWorkflow.test.tsx`, `e2e/lab-04/ticket-resolution.spec.ts` | Pass |
| **AC-07** (Illegal Ticket Transition) | API-10 | API | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **AC-08** (Resolution Gate Enforcement) | API-11, API-12, UI-06, E2E-02 | API / UI / E2E | `server/tests/lab-04/ticket-workflow.api.test.ts`, `client/tests/lab-04/TicketWorkflow.test.tsx`, `e2e/lab-04/ticket-resolution.spec.ts` | Pass |
| **AC-09** (Advisory Requester Indication) | API-13 | API | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pass |
| **AC-10** (Stale Update Conflict) | API-14, UI-07 | API / UI | `server/tests/lab-04/ticket-workflow.api.test.ts`, `client/tests/lab-04/TicketWorkflow.test.tsx` | Pass |
| **AC-11** (Requester Dashboard Isolation) | API-15, API-16, API-17, UI-08, UI-09, UI-10, E2E-03 | API / UI / E2E | `server/tests/lab-04/requester-dashboard.api.test.ts`, `client/tests/lab-04/RequesterDashboard.test.tsx`, `e2e/lab-04/dashboards.spec.ts` | Pass |
| **AC-12** (Staff Dashboard Accuracy) | API-18, API-19, UI-11, UI-12, E2E-03 | API / UI / E2E | `server/tests/lab-04/staff-dashboard.api.test.ts`, `client/tests/lab-04/StaffDashboard.test.tsx`, `e2e/lab-04/dashboards.spec.ts` | Pass |
| **AC-13** (Admin Dashboard Extension) | API-20, UI-13, E2E-03 | API / UI / E2E | `server/tests/lab-04/staff-dashboard.api.test.ts`, `client/tests/lab-04/StaffDashboard.test.tsx`, `e2e/lab-04/dashboards.spec.ts` | Pass |

---

## 6. Execution Evidence & Verification Summary

Across all layers of the testing pyramid, **167 automated tests** run and pass with 0 failures:

| Test Suite Layer | Runner / Tool | Test Files | Total Tests | Passed | Failed | Execution Time |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Server Integration & Unit** | Vitest + Supertest | 21 | 92 | 92 | 0 | ~10.4s |
| **Client Component & RTL** | Vitest + Testing Library | 15 | 53 | 53 | 0 | ~2.8s |
| **End-to-End User Workflows** | Playwright (Chromium) | 3 | 5 | 5 | 0 | ~10.4s |
| **TOTAL** | | **39** | **167** | **167** | **0** | **100% PASS** |

### 6.1. Server Test Suite Output (`npm run test:server`)
```text
 RUN  v2.1.9 /Users/martin/Uni/CPE334/toktickit/server

 ✓ tests/lab-04/actions-taken.api.test.ts (8 tests) ~800ms
 ✓ tests/lab-04/ticket-workflow.api.test.ts (6 tests) ~400ms
 ✓ tests/lab-04/requester-dashboard.api.test.ts (3 tests) ~250ms
 ✓ tests/lab-04/staff-dashboard.api.test.ts (3 tests) ~200ms
 ✓ tests/lab-03/auth.api.test.ts (12 tests) 1864ms
 ✓ tests/lab-03/staff-queue.api.test.ts (11 tests) 197ms
 ✓ tests/lab-03/users-admin.api.test.ts (7 tests) 910ms
 ✓ tests/lab-03/staff-ticket-detail.api.test.ts (6 tests) 138ms
 ✓ tests/lab-03/comments-notes.api.test.ts (5 tests) 122ms
 ✓ tests/lab-03/authorization.api.test.ts (5 tests) 38ms
 ✓ tests/lab-02/attachments.api.test.ts (5 tests) 108ms
 ✓ tests/lab-02/my-tickets.api.test.ts (3 tests) 138ms
 ✓ tests/lab-02/create-ticket.api.test.ts (2 tests) 96ms
 ✓ tests/lab-02/ticket-detail.api.test.ts (2 tests) 62ms
 ✓ tests/lab-02/reference-data.api.test.ts (2 tests) 25ms
 ✓ tests/lab-02/validation.unit.test.ts (4 tests) 2ms
 ✓ tests/lab-02/attachment-validator.unit.test.ts (3 tests) 2ms
 ✓ tests/lab-01/categories.test.ts (1 test) 13ms
 ✓ tests/lab-02/requesters.api.test.ts (1 test) 33ms
 ✓ tests/lab-02/ticket-number.unit.test.ts (2 tests) 2ms
 ✓ tests/lab-01/health.test.ts (1 test) 12ms

 Test Files  21 passed (21)
      Tests  92 passed (92)
   Duration  10.43s
```

### 6.2. Client Test Suite Output (`npm run test:client`)
```text
 RUN  v2.1.9 /Users/martin/Uni/CPE334/toktickit/client

 ✓ tests/lab-04/ActionsTaken.test.tsx (4 tests) ~300ms
 ✓ tests/lab-04/TicketWorkflow.test.tsx (3 tests) ~250ms
 ✓ tests/lab-04/RequesterDashboard.test.tsx (3 tests) ~200ms
 ✓ tests/lab-04/StaffDashboard.test.tsx (3 tests) ~200ms
 ✓ tests/lab-03/ChangePassword.test.tsx (4 tests) 199ms
 ✓ tests/lab-03/Login.test.tsx (5 tests) 263ms
 ✓ tests/lab-03/StaffTicketDetail.test.tsx (5 tests) 295ms
 ✓ tests/lab-03/UserManagement.test.tsx (5 tests) 343ms
 ✓ tests/lab-03/StaffTicketQueue.test.tsx (7 tests) 371ms
 ✓ tests/lab-02/MyTickets.test.tsx (3 tests) 126ms
 ✓ tests/lab-02/TicketDetail.test.tsx (3 tests) 268ms
 ✓ tests/lab-02/CreateTicket.test.tsx (2 tests) 141ms
 ✓ tests/lab-02/RequesterContext.test.tsx (1 test) 65ms
 ✓ tests/lab-02/RequesterSelect.test.tsx (2 tests) 161ms
 ✓ tests/lab-01/App.test.tsx (3 tests) 160ms

 Test Files  15 passed (15)
      Tests  53 passed (53)
   Duration  2.78s
```

### 6.3. Playwright E2E Test Suite Output (`npm run test:e2e`)
```text
Running 5 tests using 1 worker

  ✓  1 [chromium] › e2e/lab-04/actions-taken-flow.spec.ts › E2E-01 › TC-AT-01: IT Staff records an Action Taken; Requester views it in read-only mode (1.4s)
  ✓  2 [chromium] › e2e/lab-04/dashboards.spec.ts › E2E-03 › TC-DASH-01: Requester dashboard displays metrics and drill-down links (AC-11) (1.1s)
  ✓  3 [chromium] › e2e/lab-04/dashboards.spec.ts › E2E-03 › TC-DASH-02: IT Staff dashboard displays operational metrics and drill-down (AC-12) (832ms)
  ✓  4 [chromium] › e2e/lab-04/dashboards.spec.ts › E2E-03 › TC-DASH-03: Admin dashboard shows staff metrics PLUS user account summary (AC-13) (610ms)
  ✓  5 [chromium] › e2e/lab-04/ticket-resolution.spec.ts › E2E-02 › TC-RES-01: Requester indicates resolved; Staff formally resolves with mandatory summary (1.1s)

  5 passed (10.4s)
```

---

## 7. Captured Visual Evidence Screenshots

All 9 visual evidence screenshots are saved in `artifacts/lab-04/screenshots/`:

| Subsystem | Screenshot Path | Description & AC |
| :--- | :--- | :--- |
| **Actions Taken** | `artifacts/lab-04/screenshots/actions-taken/actions-staff-overview.png` | IT Staff ticket detail with Actions Taken table (AC-01) |
| **Actions Taken** | `artifacts/lab-04/screenshots/actions-taken/actions-create-modal.png` | Record Action Taken modal with follow-up required (AC-02) |
| **Actions Taken** | `artifacts/lab-04/screenshots/actions-taken/actions-saved.png` | Actions table after new entry saved (AC-01) |
| **Actions Taken** | `artifacts/lab-04/screenshots/actions-taken/actions-requester-readonly.png` | Requester view — read-only actions, no Record button (AC-04) |
| **Ticket Resolution** | `artifacts/lab-04/screenshots/ticket-resolution/staff-view-new-ticket.png` | Staff opens ticket; status remains NEW after requester indication (AC-09) |
| **Ticket Resolution** | `artifacts/lab-04/screenshots/ticket-resolution/resolution-modal-gate.png` | Resolution Summary Required modal gate (AC-08) |
| **Ticket Resolution** | `artifacts/lab-04/screenshots/ticket-resolution/ticket-resolved.png` | Ticket status updated to RESOLVED with summary (AC-06, AC-08) |
| **Dashboards** | `artifacts/lab-04/screenshots/dashboards/requester-dashboard.png` | Requester KPI metric cards (AC-11) |
| **Dashboards** | `artifacts/lab-04/screenshots/dashboards/staff-dashboard.png` | IT Staff operational dashboard metric cards (AC-12) |
| **Dashboards** | `artifacts/lab-04/screenshots/dashboards/admin-dashboard.png` | Administrator dashboard with user account summary card (AC-13) |
| **Dashboards** | `artifacts/lab-04/screenshots/dashboards/admin-dashboard-mobile.png` | Admin dashboard responsive mobile layout |
| **Dashboards** | `artifacts/lab-04/screenshots/dashboards/staff-queue-drilldown.png` | Staff queue after Unassigned drill-down (AC-12) |
| **Dashboards** | `artifacts/lab-04/screenshots/dashboards/admin-user-management-nav.png` | Admin navigates from dashboard to User Management (AC-13) |
