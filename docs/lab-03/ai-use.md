# AI Use & Prompt Log - Lab 3 (Sprint 3)

I used the **Antigravity** coding agent through my Google Cloud Platform account. The LLM utilized was **Gemini 3.6 Flash / Pro** with thinking enabled for architecture design, specification drafting, and test-driven implementation.

---

## 1. Selected Key Prompts

| Prompt ID | Target Feature / Task | Actual Prompt Summary | My Reflection & Verification |
| :--- | :--- | :--- | :--- |
| **PROMPT-01** | **Sprint 3 Specification & Tests** (Issue 11 / #29) | Analyze Lab 3 requirements and generate formal Sprint 3 engineering contracts (`docs/lab-03/specification.md`), REST API specification (`api-spec.md`), UI specification (`ui-spec.md`), and test plan matrix (`tests.md`). | Comprehensive markdown documentation created under `docs/lab-03/` detailing authentication, RBAC rules, unified user model migration, staff ticket queue, staff operations, internal notes privacy, admin management, and traceability matrix. |
| **PROMPT-02** | **Authentication Foundation & User Migration** (Issue 12 / #30) | Migrate database schema to unified `User` model (`REQUESTER`, `STAFF`, `ADMIN` roles), implement password hashing (`bcrypt`), JWT authentication endpoints (`/api/auth/*`), and auth context provider. | Verified user database migration and JWT token authentication. Replaced `x-requester-id` header with authenticated Bearer tokens. |
| **PROMPT-03** | **IT Staff Ticket Queue** (Issue 13 / #31) | Build `GET /api/staff/tickets` and `StaffQueue` UI component supporting global multi-requester ticket queue, multi-criteria filtering, search, sorting, and desktop table/mobile card responsive views. | Staff and Admin users can search and triage tickets across all requesters with server-side pagination and filters. |
| **PROMPT-04** | **IT Staff Ticket Operations & Requester Regression** (Issue 14 / #32) | Implement status transition rules, mandatory resolution summary on resolve/close, staff assignment, IT priority toggle, public comments, and internal staff notes with strict privacy enforcement. | Backend tests verify that internal notes (`isInternal = true`) are stripped out when requested by `REQUESTER` users. Requester ticket workflows verified regression-free. |
| **PROMPT-05** | **Administrator User Management** (Issue 15 / #33) | Build `/api/admin/users` REST endpoints and `AdminUsers` UI component for listing, creating, editing, toggling active status, resetting passwords, and enforcing the last admin protection guardrail. | Admin users can manage all system accounts. Guardrail tested: last active admin user cannot be deactivated or demoted. |
| **PROMPT-06** | **Lab 3 Release & Test Evidence** (Issue 16 / #34) | Execute full server, client, and E2E test suites, record evidence in `docs/lab-03/tests.md`, complete `reviewer.md` and `ai-use.md`, update `README.md`, and merge into `lab3-staging`. | All tests executed with 100% pass rate. Deliverables verified against all Sprint 3 requirements. |

---

## 2. Reflection on AI Pair Programming

Using Antigravity with a plan-first approach allowed us to:
1. Formulate complete contracts for Authentication, IT Staff Queue, Operations, and Admin Management prior to code modifications.
2. Establish unambiguous RBAC boundaries (`REQUESTER`, `STAFF`, `ADMIN`) across API endpoints and frontend route guards.
3. Guarantee that internal staff notes remain completely isolated from requester views.
4. Maintain a robust traceability matrix mapping all functional requirements to automated test cases.
