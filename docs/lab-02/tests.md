# Lab 2 Test Plan and Traceability

This document defines the comprehensive test strategy, planned test suite, acceptance criterion traceability matrix, and verification commands for TokTickIT Sprint 2.

---

## 1. Test Strategy & Levels

| Test Level | Framework / Tool | Scope & Boundary | Target Execution Time |
| :--- | :--- | :--- | :--- |
| **Unit Tests** | Vitest | Business rule validators, Ticket Number generator format, MIME type checks, input sanitization | $< 1\text{s}$ |
| **API Integration Tests** | Vitest + Supertest | REST endpoints, Prisma queries, ownership isolation, validation errors, attachment upload/removal | $< 10\text{s}$ |
| **UI Component Tests** | Vitest + React Testing Library | Form validation states, button states, modal behavior, requester context switching | $< 5\text{s}$ |
| **End-to-End (E2E)** | Playwright | Full browser user flows (Requester select $\rightarrow$ Create ticket $\rightarrow$ View in My Tickets $\rightarrow$ Detail & Attachments) | $< 30\text{s}$ |
| **Responsive & Visual** | Playwright Screenshots | Desktop (1200px), Tablet (768px), and Mobile (375px) viewport layouts | Visual audit |

---

## 2. Planned-Test Table

| Test ID | Type | Target AC / Requirement | What It Tests | Expected Result | Automated Test File Path | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UNIT-01** | Unit | BR-02 | Ticket number generator format | Returns string matching `^TCK-\d{8}-\d{4}$` | `server/tests/lab-02/ticket-number.unit.test.ts` | Planned |
| **UNIT-02** | Unit | BR-04 | Ticket validation helper limits | Rejects summary $< 5$ or $> 150$ chars; description $< 10$ chars | `server/tests/lab-02/validation.unit.test.ts` | Planned |
| **UNIT-03** | Unit | BR-05 | Attachment validation rules | Rejects file $> 5\text{MB}$ or forbidden MIME types | `server/tests/lab-02/attachment-validator.unit.test.ts` | Planned |
| **API-01** | API | AC-01 | `GET /api/requesters` | Returns 200 with active requesters only; inactive excluded | `server/tests/lab-02/requesters.api.test.ts` | Planned |
| **API-02** | API | FR-03 | `GET /api/categories` & `GET /api/related-systems` | Returns 200 with seeded active categories and systems | `server/tests/lab-02/reference-data.api.test.ts` | Planned |
| **API-03** | API | AC-02, BR-02, BR-03 | `POST /api/tickets` with valid payload | Returns 201 Created with status `NEW` and official `ticketNumber` | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| **API-04** | API | AC-03 | `POST /api/tickets` with invalid input | Returns 400 Bad Request with field-level validation errors | `server/tests/lab-02/create-ticket.api.test.ts` | Planned |
| **API-05** | API | AC-06, BR-01 | `GET /api/tickets` ownership isolation | Returns only tickets belonging to the `x-requester-id` | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| **API-06** | API | AC-07, AC-08 | `GET /api/tickets` search, filters & pagination | Returns filtered/paginated subset with accurate pagination metadata | `server/tests/lab-02/my-tickets.api.test.ts` | Planned |
| **API-07** | API | AC-09 | `GET /api/tickets/:id` cross-requester access | Returns 403 Forbidden when accessing another requester's ticket | `server/tests/lab-02/ticket-detail.api.test.ts` | Planned |
| **API-08** | API | AC-05, BR-05 | `POST /api/tickets/:id/attachments` upload | Returns 201 Created with metadata; rejects $> 5\text{MB}$ with 413 | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **API-09** | API | BR-05 | Attachment max count constraint | Rejects 6th active upload with 400 Bad Request | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **API-10** | API | AC-10, BR-06 | `DELETE /api/attachments/:id` soft removal | Returns 200; flags `isRemoved = true` and saves reason | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **API-11** | API | BR-06 | `GET /api/attachments/:id/download` on removed file | Returns 410 Gone; download permanently blocked | `server/tests/lab-02/attachments.api.test.ts` | Planned |
| **UI-01** | UI | AC-01 | Development Requester Selector Component | Renders active requesters dropdown, continues to app on submit | `client/tests/lab-02/RequesterSelect.test.tsx` | Planned |
| **UI-02** | UI | AC-03 | Create Ticket inline validation | Shows red field borders and inline error messages on empty submit | `client/tests/lab-02/CreateTicket.test.tsx` | Planned |
| **UI-03** | UI | AC-04 | Create Ticket API failure state | Displays error banner while preserving input field values | `client/tests/lab-02/CreateTicket.test.tsx` | Planned |
| **UI-04** | UI | AC-06 | Requester context switching | Switching requester updates header display and triggers list reload | `client/tests/lab-02/RequesterContext.test.tsx` | Planned |
| **UI-05** | UI | AC-07 | My Tickets search & filtering controls | Typing in search filters table rows; empty message if no match | `client/tests/lab-02/MyTickets.test.tsx` | Planned |
| **UI-06** | UI | AC-10 | Attachment soft removal modal | Requires non-empty reason; updates UI badge to "Removed" | `client/tests/lab-02/AttachmentSection.test.tsx` | Planned |
| **E2E-01** | E2E | AC-01, AC-02, AC-06 | Complete Requester Ticket Lifecycle | Select requester $\rightarrow$ Create ticket $\rightarrow$ View in My Tickets $\rightarrow$ View Detail | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| **E2E-02** | E2E | AC-06 | Cross-requester ticket list isolation | Requester A tickets do not appear when switched to Requester B | `e2e/lab-02/multi-requester-isolation.spec.ts` | Planned |
| **E2E-03** | E2E | AC-10 | Attachment upload and soft removal flow | Upload file $\rightarrow$ Download file $\rightarrow$ Soft remove with reason $\rightarrow$ Verify blocked | `e2e/lab-02/attachment-lifecycle.spec.ts` | Planned |

---

## 3. Acceptance-Criterion Traceability Matrix

| Acceptance Criterion | Description | Covering Automated Tests |
| :--- | :--- | :--- |
| **AC-01** | Development Requester selection shows only active users | `API-01`, `UI-01`, `E2E-01` |
| **AC-02** | Ticket submission generates official ticket number & saves | `UNIT-01`, `API-03`, `E2E-01` |
| **AC-03** | Form validation with inline field errors and red asterisks | `UNIT-02`, `API-04`, `UI-02` |
| **AC-04** | Form values preserved during API error recovery | `UI-03` |
| **AC-05** | Attachment size ($\le 5\text{MB}$) & type constraints enforced | `UNIT-03`, `API-08`, `API-09` |
| **AC-06** | My Tickets isolates data per active requester | `API-05`, `UI-04`, `E2E-02` |
| **AC-07** | Search and filtering across category, status, and keyword | `API-06`, `UI-05` |
| **AC-08** | Pagination and sorting behavior | `API-06` |
| **AC-09** | Ticket detail rejects cross-requester access | `API-07`, `E2E-02` |
| **AC-10** | Attachment soft removal requires reason & blocks download | `API-10`, `API-11`, `UI-06`, `E2E-03` |
| **AC-11** | Responsive layout across Desktop, Tablet, and Mobile | Responsive Visual Checklist & E2E Viewport Suite |

---

## 4. Responsive & Visual Verification Checklist

| Viewport | Target Resolution | Verification Points | Status |
| :--- | :--- | :--- | :--- |
| **Desktop** |  \times 800\text{px}$ | Multi-column forms, full My Tickets table, no horizontal scrolling | Pending |
| **Tablet** |  \times 1024\text{px}$ | 2-column forms, compact table layout, touch navigation | Pending |
| **Mobile** |  \times 812\text{px}$ | Single column stacked fields, My Tickets card view, touch targets $\ge 44\text{px}$ | Pending |

---

## 5. Automated Test Execution Commands

### Run Backend Unit & API Tests
```bash
cd server && npm run test
```

### Run Frontend Component Tests
```bash
cd client && npm run test
```

### Run Playwright E2E Tests
```bash
npx playwright test
```

---

## 6. Final Results Summary
*(This section will be populated with actual command terminal outputs upon implementation completion).*

- Total Tests Planned: 23
- Total Tests Executed: Pending
- Pass Rate: Pending (Target: 100%)

---

## 7. Known Limitations or Deferred Tests
- Production authentication workflows (login sessions, JWTs, password resets) are deferred to Lab 3.
- IT Staff ticket assignment, status progression, and service actions are deferred to later labs.
