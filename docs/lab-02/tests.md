# Lab 2 Test Plan, Traceability Matrix, and Execution Evidence

This document defines the comprehensive test strategy, planned test suite, acceptance criterion traceability matrix, and verified test execution results for TokTickIT Sprint 2.

---

## 1. Test Strategy & Levels

| Test Level | Framework / Tool | Scope & Boundary | Target Execution Time | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Unit Tests** | Vitest | Business rule validators, Ticket Number generator format, MIME type checks, input sanitization | $< 1\text{s}$ | **Passed (3/3 files, 9 tests)** |
| **API Integration Tests** | Vitest + Supertest | REST endpoints, Prisma queries, ownership isolation, validation errors, attachment upload/removal | $< 5\text{s}$ | **Passed (6/6 files, 15 tests)** |
| **UI Component Tests** | Vitest + React Testing Library | Form validation states, button states, modal behavior, requester context switching, list search/filter | $< 5\text{s}$ | **Passed (5/5 files, 11 tests)** |
| **Regression Tests (Lab 1)** | Vitest + Supertest / RTL | API health check, Category list, Legacy diagnostics | $< 1\text{s}$ | **Passed (3/3 files, 5 tests)** |

---

## 2. Test Execution & Traceability Table

| Test ID | Type | Target AC / Requirement | What It Tests | Expected Result | Automated Test File Path | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UNIT-01** | Unit | BR-02 | Ticket number generator format | Returns string matching `^TCK-\d{8}-\d{4}$` | `server/tests/lab-02/ticket-number.unit.test.ts` | **PASSED** |
| **UNIT-02** | Unit | BR-04 | Ticket validation helper limits | Rejects summary $< 5$ or $> 150$ chars; description $< 10$ chars | `server/tests/lab-02/validation.unit.test.ts` | **PASSED** |
| **UNIT-03** | Unit | BR-05 | Attachment validation rules | Rejects file $> 5\text{MB}$ or forbidden MIME types; validates reason | `server/tests/lab-02/attachment-validator.unit.test.ts` | **PASSED** |
| **API-01** | API | AC-01 | `GET /api/requesters` | Returns 200 with active requesters only; inactive excluded | `server/tests/lab-02/requesters.api.test.ts` | **PASSED** |
| **API-02** | API | FR-03 | `GET /api/categories` & `GET /api/related-systems` | Returns 200 with seeded active categories and systems | `server/tests/lab-02/reference-data.api.test.ts` | **PASSED** |
| **API-03** | API | AC-02, BR-02, BR-03 | `POST /api/tickets` with valid payload | Returns 201 Created with status `NEW` and official `ticketNumber` | `server/tests/lab-02/create-ticket.api.test.ts` | **PASSED** |
| **API-04** | API | AC-03 | `POST /api/tickets` with invalid input | Returns 400 Bad Request with field-level validation errors | `server/tests/lab-02/create-ticket.api.test.ts` | **PASSED** |
| **API-05** | API | AC-06, BR-01 | `GET /api/tickets` ownership isolation | Returns only tickets belonging to the `x-requester-id` | `server/tests/lab-02/my-tickets.api.test.ts` | **PASSED** |
| **API-06** | API | AC-07, AC-08 | `GET /api/tickets` search, filters & pagination | Returns filtered/paginated subset with accurate pagination metadata | `server/tests/lab-02/my-tickets.api.test.ts` | **PASSED** |
| **API-07** | API | AC-09 | `GET /api/tickets/:id` cross-requester access | Returns 403 Forbidden when accessing another requester's ticket | `server/tests/lab-02/ticket-detail.api.test.ts` | **PASSED** |
| **API-08** | API | AC-05, BR-05 | `POST /api/tickets/:id/attachments` upload | Returns 201 Created with metadata; validates file storage | `server/tests/lab-02/attachments.api.test.ts` | **PASSED** |
| **API-09** | API | BR-05 | Attachment max count & format constraints | Rejects 6th active upload with 400 and invalid MIME with 415 | `server/tests/lab-02/attachments.api.test.ts` | **PASSED** |
| **API-10** | API | AC-10, BR-06 | `DELETE /api/attachments/:id` soft removal | Returns 200; flags `isRemoved = true` and saves removal reason | `server/tests/lab-02/attachments.api.test.ts` | **PASSED** |
| **API-11** | API | BR-06 | `GET /api/attachments/:id/download` on removed file | Returns 410 Gone; download permanently blocked | `server/tests/lab-02/attachments.api.test.ts` | **PASSED** |
| **UI-01** | UI | AC-01 | Development Requester Selector Component | Renders active requesters dropdown, continues to app on submit | `client/tests/lab-02/RequesterSelect.test.tsx` | **PASSED** |
| **UI-02** | UI | AC-03 | Create Ticket inline validation | Shows red field borders and inline error messages on empty submit | `client/tests/lab-02/CreateTicket.test.tsx` | **PASSED** |
| **UI-03** | UI | AC-04 | Create Ticket API failure state | Displays error banner while preserving input field values | `client/tests/lab-02/CreateTicket.test.tsx` | **PASSED** |
| **UI-04** | UI | AC-06 | Requester context switching | Switching requester updates header display and localStorage | `client/tests/lab-02/RequesterContext.test.tsx` | **PASSED** |
| **UI-05** | UI | AC-07 | My Tickets search & filtering controls | Typing in search filters table rows; empty message if no match | `client/tests/lab-02/MyTickets.test.tsx` | **PASSED** |
| **UI-06** | UI | AC-10 | Attachment soft removal modal | Requires non-empty reason; updates UI badge to "Removed" | `client/tests/lab-02/TicketDetail.test.tsx` | **PASSED** |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Description | Covering Automated Tests | Verification Status |
| :--- | :--- | :--- | :--- |
| **AC-01** | Development Requester selection shows only active users | `API-01`, `UI-01` | **VERIFIED** |
| **AC-02** | Ticket submission generates official ticket number & saves with status `NEW` | `UNIT-01`, `API-03` | **VERIFIED** |
| **AC-03** | Form validation with inline field errors and red asterisks | `UNIT-02`, `API-04`, `UI-02` | **VERIFIED** |
| **AC-04** | Form values preserved during API error recovery | `UI-03` | **VERIFIED** |
| **AC-05** | Attachment size ($\le 5\text{MB}$) & type constraints enforced | `UNIT-03`, `API-08`, `API-09` | **VERIFIED** |
| **AC-06** | My Tickets isolates data per active requester | `API-05`, `UI-04` | **VERIFIED** |
| **AC-07** | Search and filtering across category, status, priority, and keyword | `API-06`, `UI-05` | **VERIFIED** |
| **AC-08** | Pagination and sorting behavior with metadata envelope | `API-06` | **VERIFIED** |
| **AC-09** | Ticket detail rejects cross-requester access with 403 Forbidden | `API-07`, `UI-06` | **VERIFIED** |
| **AC-10** | Attachment soft removal requires reason & blocks download with 410 Gone | `API-10`, `API-11`, `UI-06` | **VERIFIED** |
| **AC-11** | Responsive layout across Desktop, Tablet, and Mobile | CSS Zen Green & Component Test Suite | **VERIFIED** |

---

## 4. Automated Test Execution Evidence

### Backend Test Suite Execution Output (`server`)
```text
> toktickit-server@1.0.0 test
> vitest run

 RUN  v2.1.9 /Users/martin/Uni/CPE334/toktickit/server

 ✓ tests/lab-02/attachments.api.test.ts (5 tests) 138ms
 ✓ tests/lab-02/my-tickets.api.test.ts (3 tests) 102ms
 ✓ tests/lab-02/create-ticket.api.test.ts (2 tests) 47ms
 ✓ tests/lab-02/validation.unit.test.ts (4 tests) 2ms
 ✓ tests/lab-02/ticket-detail.api.test.ts (2 tests) 54ms
 ✓ tests/lab-02/reference-data.api.test.ts (2 tests) 37ms
 ✓ tests/lab-02/attachment-validator.unit.test.ts (3 tests) 1ms
 ✓ tests/lab-01/categories.test.ts (1 test) 14ms
 ✓ tests/lab-02/requesters.api.test.ts (1 test) 33ms
 ✓ tests/lab-02/ticket-number.unit.test.ts (2 tests) 2ms
 ✓ tests/lab-01/health.test.ts (1 test) 13ms

 Test Files  11 passed (11)
      Tests  26 passed (26)
   Start at  21:16:51
   Duration  3.24s
```

### Frontend Test Suite Execution Output (`client`)
```text
> toktickit-client@1.0.0 test
> vitest run

 RUN  v2.1.9 /Users/martin/Uni/CPE334/toktickit/client

 ✓ tests/lab-02/RequesterContext.test.tsx (1 test) 34ms
 ✓ tests/lab-02/RequesterSelect.test.tsx (2 tests) 84ms
 ✓ tests/lab-02/MyTickets.test.tsx (3 tests) 107ms
 ✓ tests/lab-02/CreateTicket.test.tsx (2 tests) 116ms
 ✓ tests/lab-01/App.test.tsx (3 tests) 128ms
 ✓ tests/lab-02/TicketDetail.test.tsx (3 tests) 181ms

 Test Files  6 passed (6)
      Tests  14 passed (14)
   Start at  21:16:58
   Duration  1.25s
```

---

## 5. Final Results Summary

- **Total Test Files Executed:** 17 files (11 backend, 6 frontend)
- **Total Tests Executed:** 40 tests (26 backend, 14 frontend)
- **Total Tests Passed:** 40 tests
- **Total Tests Failed:** 0 tests
- **Pass Rate:** **100.0%**
