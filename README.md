# TokTickIT — IT Service Desk

TokTickIT is a full-stack IT service desk application for managing internal requests across Account and Access, Hardware, Software, and Network categories.

---

## Technology Stack

* **Frontend:** React 18, TypeScript, Vite, Bootstrap 5, Zen Green Theme System
* **Backend:** Node.js, Express, TypeScript, Multer, JWT, bcrypt
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Testing:** Vitest, Supertest, React Testing Library, Playwright (End-to-End)
* **Workflow:** Git, GitHub Projects, Feature Branches, Peer-Reviewed Pull Requests

---

## Key Features & Capabilities (Lab 3)

### 1. Authentication & Session Management
- Secure JWT-based authentication (`POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`).
- Password hashing with `bcrypt` (10 salt rounds).
- Mandatory first-login password change flow (`mustChangePassword = true`) with real-time complexity validation (8+ chars, uppercase, lowercase, number, symbol).
- Inactive account lockout (`isActive = false`) prohibiting login attempts.

### 2. Role-Based Access Control (RBAC)
- Three distinct authorization roles:
  - **`REQUESTER`**: Submits tickets, views owned tickets, uploads/removes attachments, posts public comments, indicates resolution.
  - **`STAFF`**: Accesses global IT ticket queue across all requesters, claims/assigns tickets, updates IT priority, advances status lifecycle, records internal staff notes.
  - **`ADMIN`**: Inherits all staff operational capabilities plus full user management (create users, edit roles/status, reset passwords).

### 3. IT Staff Ticket Queue (`/staff/queue`)
- Cross-requester ticket triage table with KPI summary metrics (Open, In Progress, Critical/High count).
- Global search across ticket number, summary, description, and requester name.
- Multi-criteria filtering by Status, Category, Related System, Assignee, and Priority.
- Responsive design: multi-column data table on desktop ($\ge 768\text{px}$) and stacked Zen cards on mobile ($< 768\text{px}$).
- Server-side sorting and pagination.

### 4. IT Staff Ticket Detail & Operations (`/staff/tickets/:id`)
- Permitted status lifecycle transition enforcement (`NEW` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` $\rightarrow$ `CLOSED` or `CANCELLED`).
- Mandatory Resolution Summary modal dialog ($\ge 10$ chars) when resolving or closing a ticket.
- Assignee selection and independent IT Priority toggle (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).

### 5. Comments & Internal Notes with Privacy Isolation
- Staff and Admin can record **Internal Staff Notes** (`isInternal = true`) with amber lock privacy badges.
- **Strict Privacy Isolation**: Requester endpoints (`GET /api/tickets/:id`) completely strip internal notes, guaranteeing requester views never leak internal discussions.
- Public comments accessible to both requesters and IT staff.

### 6. Administrator User Management (`/admin/users`)
- Comprehensive user list with keyword search and role/status filtering.
- Create user modal with email uniqueness validation and role assignment.
- Edit user modal with profile update and active status toggle.
- Admin password reset modal generating a secure password and enforcing `mustChangePassword = true`.
- **Safety Guardrails**:
  - `SELF_DEACTIVATION_PROHIBITED`: An administrator cannot deactivate their own account.
  - `LAST_ADMIN_PROTECTION`: Deactivating or demoting the last active administrator is strictly blocked.

---

## Seed Accounts & Credentials

The seed script (`npm --prefix server run prisma:seed`) initializes the database with default accounts (default password: `Password123!`):

| Role | Name | Email | Initial State |
| :--- | :--- | :--- | :--- |
| **Administrator** | Admin System | `admin@kmutt.ac.th` | Active, Standard Login |
| **IT Staff** | Supachai Techavichit | `staff.supachai@kmutt.ac.th` | Active, Standard Login |
| **IT Staff** | Manee Kerdphon | `staff.manee@kmutt.ac.th` | Active, Standard Login |
| **IT Staff (Inactive)** | Niran InactiveStaff | `staff.inactive@kmutt.ac.th` | Inactive (Lockout test) |
| **Requester** | Somchai Prasert | `somchai.pra@kmutt.ac.th` | Active, Standard Login |
| **Requester** | Apinya Sukcharoen | `apinya.suk@kmutt.ac.th` | Active, Standard Login |
| **Requester (First Login)** | First Login User | `firstlogin@kmutt.ac.th` | Active, `mustChangePassword = true` |
| **Requester (Inactive)** | Wandee InactiveUser | `wandee.old@kmutt.ac.th` | Inactive (Lockout test) |

---

## Project Structure

```text
toktickit/
├── client/                      # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/          # Login, ChangePassword, StaffTicketQueue, StaffTicketDetail, UserManagement, CreateTicket, MyTickets
│   │   ├── context/             # AuthContext (JWT session state & user profile)
│   │   ├── styles/              # theme.css (Zen Green design tokens)
│   │   ├── api.ts               # Typed REST API client with Bearer token authentication
│   │   └── App.tsx              # Main application shell and role-based view routing
│   └── tests/                   # UI component tests (Vitest + RTL - 40 tests)
├── server/                      # Express + TypeScript + Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL models (User, Category, System, Ticket, Attachment, Comment)
│   │   └── seed.ts              # Idempotent database seed script
│   ├── src/
│   │   ├── middleware/          # auth.ts (JWT verification & requireRole middleware)
│   │   ├── utils/               # ticketNumber.ts, validation.ts, attachmentValidator.ts
│   │   ├── app.ts               # Express REST API routes (/api/auth, /api/staff, /api/admin, /api/tickets)
│   │   ├── prisma.ts            # Prisma client instance
│   │   └── index.ts             # HTTP server entrypoint
│   ├── uploads/                 # Local storage directory for uploaded attachments
│   └── tests/                   # Unit & API integration tests (Vitest + Supertest - 72 tests)
├── e2e/                         # Playwright End-to-End test suites (7 tests)
│   ├── global-setup.ts          # Automatic database seed before E2E runs
│   └── lab-03/
│       ├── authentication.spec.ts     # E2E-01: Login, lockout, first-login password change, RBAC nav
│       ├── staff-ticket-flow.spec.ts  # E2E-02: Ticket creation, staff queue triage, operations, privacy
│       └── user-administration.spec.ts# E2E-03: Admin user CRUD, safety guardrails, password reset
├── artifacts/                   # Evidence artifacts
│   └── lab-03/screenshots/      # 16 visual screenshots across desktop and mobile
├── docs/                        # Engineering specifications & evidence
│   ├── lab-01/                  # Lab 1 sprint records
│   ├── lab-02/                  # Lab 2 sprint records
│   └── lab-03/                  # Lab 3 sprint records
│       ├── specification.md     # Sprint Engineering Specification
│       ├── api-spec.md          # REST API Contract
│       ├── ui-spec.md           # Zen Green UI Design Specification
│       ├── tests.md             # Test Plan & Traceability Matrix (119/119 passing)
│       ├── reviewer.md          # Peer Review Log
│       └── ai-use.md            # AI Prompt & Transparency Log
├── playwright.config.ts         # Playwright test runner configuration
├── package.json                 # Monorepo root scripts (test, test:server, test:client, test:e2e)
├── .gitignore                   # Git ignore rules
└── README.md                    # Project documentation
```

---

## Setup and Running Instructions

### 1. Prerequisites

* Node.js v18 or higher
* PostgreSQL (Local service or Docker container)

### 2. Environment Configuration

Ensure `.env` files exist in both `client` and `server`:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

`server/.env`:
```env
DATABASE_URL="postgresql://toktickit:toktickit123@localhost:5432/toktickit?schema=public"
PORT=3000
JWT_SECRET="toktickit-secret-jwt-key-2026-cpe334"
```

### 3. Install Dependencies

```bash
npm install                     # Install root dependencies (Playwright)
npm install --prefix client     # Install client dependencies
npm install --prefix server     # Install server dependencies
```

### 4. Database Setup & Seed

Apply migrations and populate reference/seed data:

```bash
npm --prefix server run prisma:migrate
npm --prefix server run prisma:seed
```

### 5. Start Development Servers

```bash
# Backend REST API (http://localhost:3000)
npm --prefix server run dev

# Frontend Web App (http://localhost:5173)
npm --prefix client run dev
```

---

## Running Automated Tests

A unified test suite covering **119 automated tests** across all testing layers:

### Run Entire Test Suite (Server + Client + Playwright E2E)
```bash
npm test
```
*Executes all 72 server tests, 40 client tests, and 7 Playwright E2E tests.*

### Run Specific Test Suites
```bash
# Server Integration & Unit Tests (Vitest + Supertest)
npm run test:server
# Result: 17 test files, 72 tests passed (100%)

# Client Component & RTL Tests (Vitest + Testing Library)
npm run test:client
# Result: 11 test files, 40 tests passed (100%)

# End-to-End Tests (Playwright Chromium)
npm run test:e2e
# Result: 3 test files, 7 tests passed (100%)
```
