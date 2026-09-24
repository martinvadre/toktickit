# AI Use & Prompt Log - Lab 4 (Sprint 4)

I used the **Antigravity** coding agent through my Google Cloud Platform account. The LLM utilized was **Gemini 3.8 Flash (High)** with reasoning and automated tool execution enabled for architecture planning, specification drafting, full-stack test-driven implementation, visual screenshot capture, and report generation.

---

## 1. Selected Key Prompts

| Prompt ID | Target Feature / Task | Actual Prompt Summary | My Reflection & Verification |
| :--- | :--- | :--- | :--- |
| **PROMPT-01** | **Sprint 4 Specification & Tests** (Issue 17 / #42) | Analyze Lab 4 handout requirements and generate formal Sprint 4 engineering contracts (`docs/lab-04/specification.md`), REST API specification (`api-spec.md`), UI specification (`ui-spec.md`), and test traceability matrix (`tests.md`). | Comprehensive markdown specifications created under `docs/lab-04/` detailing Actions Taken, parent-child relations, role matrices, status lifecycle transitions, resolution gate, dashboard metrics, concurrency conflict handling, and test matrices. |
| **PROMPT-02** | **Actions Taken Foundation** (Issue 18 / #43) | Add `ActionTaken` model and `ActionStatus` enum to Prisma schema, execute non-destructive database migration, update seed data with realistic multi-action tickets across different staff performers, build REST endpoints, and implement API test suite. | Verified database schema evolution in PostgreSQL. Inactive staff validation and mandatory follow-up notes enforced in backend API routes and verified with automated tests. |
| **PROMPT-03** | **Actions Taken UI & Role Enforcement** (Issue 19 / #44) | Build Actions Taken UI section in `StaffTicketDetail.tsx` (list/table, record modal, edit modal, status transitions) and read-only view in Requester `TicketDetail.tsx`. Implement RTL component tests in `client/tests/lab-04/ActionsTaken.test.tsx`. | Staff can log and edit actions taken with real-time validation. Requesters are verified to have read-only visibility with all mutating controls omitted. |
| **PROMPT-04** | **Ticket Workflow & Resolution Gate** (Issue 20 / #45) | Enforce authoritative status transition matrix, resolution summary requirement ($\ge 10$ chars) on resolve/close, advisory requester indication, and optimistic concurrency stale-update detection (409 Conflict). | Backend and UI tests confirm that bypass attempts fail safely and stale updates trigger conflict alerts. |
| **PROMPT-05** | **Role-Appropriate Dashboards** (Issue 21 / #46) | Implement backend KPI endpoints (`/api/requester/dashboard`, `/api/staff/dashboard`, `/api/admin/dashboard`), responsive frontend dashboard components (`RequesterDashboard.tsx`, `StaffDashboard.tsx`), Header navigation updates, and drill-down links. | Authoritative database calculations verify that Requester dashboard isolates user data, and Staff dashboard shows accurate queue metrics and urgent tickets. |
| **PROMPT-06** | **Lab 4 Hardening, E2E Tests & Evidence** (Issue 22 / #47) | Run Playwright E2E suites (`actions-taken-flow.spec.ts`, `ticket-resolution.spec.ts`, `dashboards.spec.ts`), capture desktop/tablet/mobile visual evidence screenshots, execute 100% regression verification across all labs, and generate final report PDF/DOCX. | Full regression verified across 100% of tests. Screenshots captured and consolidated into the official Answer Part 1–9 submission document. |

---

## 2. Reflection on AI Pair Programming

Using Antigravity with a plan-first and test-driven approach allowed us to:
1. Formulate complete contracts for Actions Taken, Workflow Lifecycle, and Operational Dashboards before touching application code.
2. Ensure strict separation of concerns between Ticket Coordination (primary assignee) and Action Execution (performer attribution per `BR-02`).
3. Guarantee that Requesters maintain complete visibility into work performed on their requests without exposing operational write controls.
4. Enforce concurrency safety so that concurrent updates to ticket status or actions taken do not result in silent data loss.
5. Provide a traceable, automated test suite spanning unit, API integration, React Testing Library, and Playwright E2E tests.
