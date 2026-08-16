# Lab 1 — Test Plan and Evidence

All test files live under `server/tests/lab-01/` and `client/tests/lab-01/`.

| # | Tool | Test | Result |
|---|---|---|---|
| 1 | Supertest | GET /api/health returns 200, status=ok | pass |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | pass |
| 3 | Vitest | Heading renders | pass |
| 4 | Vitest | Success state shows Online + category list | pass |
| 5 | Vitest | Error state shows Offline + message | pass |

Paste your passing terminal output / screenshot below.

## Test Execution Summary

* **Backend API tests:** `server/tests/lab-01/health.test.ts`, `server/tests/lab-01/categories.test.ts` (All 2 Passed)
* **Frontend UI tests:** `client/tests/lab-01/App.test.tsx` (All 3 Passed)
* **Total tests passing:** 5/5