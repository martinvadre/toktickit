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

## 6. Full Regression Execution Results

```text
================================================================================
TOKTICKIT FULL TEST EXECUTION REPORT (SPRINT 4 FINAL RELEASE)
================================================================================
1. SERVER TEST SUITE (Vitest + Supertest):
   Test Files  21 passed (21)
   Tests       92 passed (92)
   Duration    10.06s
   Status      PASSED (100% Pass Rate)

2. CLIENT TEST SUITE (Vitest + React Testing Library):
   Test Files  15 passed (15)
   Tests       53 passed (53)
   Duration    2.48s
   Status      PASSED (100% Pass Rate)

3. END-TO-END SUITE (Playwright Browser Tests):
   Test Files   4 passed (4)
   Tests        6 passed (6)
   Duration    12.0s
   Status      PASSED (100% Pass Rate)
   - actions-taken-flow.spec.ts: PASSED (917ms)
   - dashboards.spec.ts:         PASSED (1.5s)
   - responsive-evidence.spec.ts: PASSED (3.1s)
   - ticket-resolution.spec.ts:   PASSED (992ms)

TOTAL AUTOMATED TESTS: 151 / 151 PASSED (0 FAILURES, 0 REGRESSIONS)
VISUAL EVIDENCE ARTIFACTS: 9 Full-Page Viewport Screenshots Captured
================================================================================
```

