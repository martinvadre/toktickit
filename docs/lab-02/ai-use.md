# AI Use & Prompt Log - Lab 2 (Sprint 2)

I used the **Antigravity** coding agent through my Google Cloud Platform account. The LLM utilized was **Gemini 3.5 Pro / Flash** with thinking enabled for planning, architecture design, and test-driven implementation.

---

## 1. Selected Key Prompts

| Prompt ID | Target Feature / Task | Actual Prompt Summary | My Reflection & Verification |
| :--- | :--- | :--- | :--- |
| **PROMPT-01** | **Sprint 2 Specification & Tests** (Issue 5) | Analyze the Lab 2 requirements and create formal engineering specifications, REST API contracts, Zen Green UI specifications, and test plan traceability matrix under `docs/lab-02/`. | The agent produced detailed Markdown specifications covering all functional requirements (FR-01 to FR-17), business rules (BR-01 to BR-07), and acceptance criteria (AC-01 to AC-11) before code implementation started. |
| **PROMPT-02** | **Requester Context & Database Schema** (Issue 6) | Update `schema.prisma` with `RequesterUser`, `RelatedSystem`, `Category`, `Ticket`, and `Attachment` models. Add idempotent seeds with 4 active and 1 inactive requesters. Implement `GET /api/requesters` filtering `isActive = true`, and build the Zen Green `RequesterSelect` UI. | Schema pushed cleanly to PostgreSQL Docker container. Inactive user filtering verified via automated API tests (`API-01`). |
| **PROMPT-03** | **Ticket Creation & Ticket Number Generator** (Issue 7) | Implement ticket number generator format `TCK-YYYYMMDD-XXXX`, field validation helpers, `POST /api/tickets` endpoint, and responsive `CreateTicket` component with inline field errors, busy state, and safe error recovery preserving entered values. | All limits (Summary 5–150, Description 10–3000) and error recovery preserving input values verified via unit and component tests (`UNIT-01`, `UNIT-02`, `API-03`, `API-04`, `UI-02`, `UI-03`). |
| **PROMPT-04** | **My Tickets Screen & Isolation** (Issue 8) | Implement `GET /api/tickets` with strict requester ownership isolation (`x-requester-id`), case-insensitive search, multi-faceted filtering, sorting, pagination, and desktop table/mobile card UI in `MyTickets.tsx`. | Backend tests confirmed cross-requester tickets are never leaked (`API-05`). Search and pagination controls verified in UI tests (`UI-05`). |
| **PROMPT-05** | **Ticket Detail & Attachment Lifecycle** (Issue 9) | Implement `GET /api/tickets/:id` rejecting non-owners with 403 Forbidden. Implement attachment upload with Multer (<= 5MB, JPG/PNG/WEBP/PDF, max 5 active), download with 410 Gone blocking on removed files, and soft-removal requiring mandatory reason modal. | Complete lifecycle tested: 403 rejection, format whitelist, 410 download block, and removal modal verified in `API-07` through `API-11` and `UI-06`. |
| **PROMPT-06** | **Test Evidence & Release Documentation** (Issue 10) | Run all backend and frontend test suites, record terminal evidence in `docs/lab-02/tests.md`, complete `reviewer.md` and `ai_use.md`, update `README.md`, and prepare the release PR from `lab2-staging` into `main`. | 40/40 tests executed with 100% pass rate. Documentation is consistent with all course rubrics. |

---

## 2. Reflection on AI Pair Programming

Using Antigravity with a plan-first approach allowed us to:
1. Specify exact database relations, API error payloads, and Zen Green styling guidelines prior to code authoring.
2. Maintain high test coverage (40 automated tests across unit, integration, and UI component levels).
3. Ensure strict multi-tenant boundary isolation between development requesters.
