# TokTickIT — IT Service Desk

TokTickIT is a full-stack IT service desk application for managing internal requests across Account and Access, Hardware, Software, and Network categories.

---

## Technology Stack

* **Frontend:** React 18, TypeScript, Vite, Bootstrap 5, Zen Green Theme System
* **Backend:** Node.js, Express, TypeScript, Multer
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Testing:** Vitest, Supertest, React Testing Library
* **Workflow:** Git, GitHub Projects, Feature Branches, Peer-Reviewed Pull Requests

---

## Lab 2 (Sprint 2) Features & Capabilities

1. **Development Requester Context (`RequesterSelect`)**:
   - Dynamic requester selection from active database records (`isActive = true`).
   - Context persistence in `localStorage` with header identity badge and switcher.
2. **Ticket Creation (`CreateTicket`)**:
   - Pre-populated read-only requester identity.
   - Dynamic Category & Related System selection loaded from PostgreSQL.
   - Requested Priority selector (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
   - Strict input validation (Summary 5–150 chars, Description 10–3000 chars) with inline field errors and red asterisks `*`.
   - Sequential official ticket number generation in format `TCK-YYYYMMDD-XXXX`.
   - Initial supporting attachments selection with type & size validation.
   - Input-preserving safe API failure recovery and success confirmation view.
3. **My Tickets View (`MyTickets`)**:
   - Requester ownership isolation (`x-requester-id` header).
   - Real-time keyword search across summary, description, and ticket number.
   - Multi-field filtering by Category, Status, and Priority.
   - Responsive multi-column data table on desktop ($\ge 768\text{px}$) and stacked cards on mobile ($< 768\text{px}$).
   - Configurable pagination (5, 10, 20 items per page) with metadata envelope.
4. **Ticket Detail & Attachment Lifecycle (`TicketDetail`)**:
   - Read-only overview grid with formatted timestamps and status/priority badges.
   - Cross-requester access rejection (`403 Forbidden`).
   - Attachment upload with Multer (permitted: JPG, PNG, WEBP, PDF $\le 5\text{ MB}$, max 5 active).
   - Direct file download for active attachments.
   - Soft-removal workflow with mandatory justification reason modal (3–255 chars).
   - Permanent download blocking (`410 Gone`) on soft-removed attachments.

---

## Project Structure

```text
toktickit/
├── client/                      # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/          # CreateTicket, MyTickets, TicketDetail, RequesterSelect, Header
│   │   ├── context/             # RequesterContext (active requester state)
│   │   ├── styles/              # theme.css (Zen Green design tokens)
│   │   ├── api.ts               # Typed REST API client
│   │   └── App.tsx              # Main application shell and view router
│   └── tests/                   # UI component tests (Vitest + RTL)
├── server/                      # Express + TypeScript + Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma        # PostgreSQL models (Requester, Category, System, Ticket, Attachment)
│   │   └── seed.ts              # Idempotent database seed script
│   ├── src/
│   │   ├── utils/               # ticketNumber.ts, validation.ts, attachmentValidator.ts
│   │   ├── app.ts               # Express REST API routes
│   │   ├── prisma.ts            # Prisma client instance
│   │   └── index.ts             # HTTP server entrypoint
│   ├── uploads/                 # Local storage directory for uploaded attachments
│   └── tests/                   # Unit & API integration tests (Vitest + Supertest)
├── docs/                        # Engineering specifications & evidence
│   ├── lab-01/                  # Lab 1 sprint records
│   └── lab-02/                  # Lab 2 sprint records
│       ├── specification.md     # Sprint Engineering Specification
│       ├── api-spec.md          # REST API Contract
│       ├── ui-spec.md           # Zen Green UI Design Specification
│       ├── tests.md             # Test Plan & Traceability Matrix (40/40 passing)
│       ├── reviewer.md          # Peer Review Log
│       └── ai_use.md            # AI Prompt & Transparency Log
├── .gitignore                   # Git ignore rules (including uploads/*)
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
```

### 3. Install Dependencies

```bash
npm install --prefix client
npm install --prefix server
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

### Backend Tests (Unit & API Integration)
```bash
npm --prefix server run test
```
*Result: 11 test files, 26 tests passed (100%)*

### Frontend Tests (Component & Interaction)
```bash
npm --prefix client run test
```
*Result: 6 test files, 14 tests passed (100%)*
