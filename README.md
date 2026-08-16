# TokTickIT — IT Service Desk

TokTickIT is a full-stack IT service desk application for managing internal requests across Account and Access, Hardware, Software, and Network categories.

## Technology Stack

* **Frontend:** React, TypeScript, Vite, Bootstrap 5
* **Backend:** Node.js, Express, TypeScript
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Testing:** Vitest, Supertest
* **Workflow:** Git, GitHub Projects, Feature Branches, Pull Requests

---

## Project Structure

```text
toktickit/
├── client/          # React + Vite + Bootstrap frontend
├── server/          # Express + Prisma + PostgreSQL backend
│   ├── prisma/      # Prisma schema and seed script
│   └── src/         # Express server source code
│       └── tests/   # API integration tests (Supertest + Vitest)
├── docs/            # Documentation and engineering records
│   └── lab-01/      # Lab 1 evidence (ai_use.md, reviewer.md, tests.md)
├── .gitignore       # Git ignore rules
└── README.md        # Project setup and usage guide
```

---

## Setup and Running Instructions

### 1. Prerequisites

* Node.js v18 or higher
* A running PostgreSQL instance

### 2. Environment Configuration

Copy the `.env.example` files into `.env` for both the client and server:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Then open `server/.env` and fill in your PostgreSQL connection details:

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<dbname>?schema=public"
PORT=3000
```

### 3. Install Dependencies

```bash
npm install --prefix client
npm install --prefix server
```

### 4. Database Setup

Apply migrations and load the starter seed data:

```bash
npm --prefix server run prisma:migrate
npm --prefix server run prisma:seed
```

### 5. Start in Development Mode

```bash
# Backend API - http://localhost:3000
npm --prefix server run dev

# Frontend - http://localhost:5173
npm --prefix client run dev
```

### 6. Run Tests

```bash
# Frontend UI tests
npm --prefix client run test

# Backend API tests
npm --prefix server run test
```
