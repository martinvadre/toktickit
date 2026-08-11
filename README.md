# TokTickIT - IT Service Desk Application

TokTickIT is an IT service desk web application for Account and Access, Hardware, Software, and Network requests built as part of CPE 334 (Introduction to Software Engineering in the Age of AI Agents).

## 🚀 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Bootstrap 5
- **Backend:** Node.js + Express + TypeScript
- **Database & ORM:** PostgreSQL + Prisma ORM
- **Testing:** Vitest & Supertest

---

## 📁 Repository Structure

```text
toktickit/
 ├── client/               # React + Vite Frontend
 │   ├── src/             # Application Components & API Client
 │   └── tests/lab-01/    # Vitest UI Tests
 ├── server/               # Express + Prisma Backend
 │   ├── prisma/          # Prisma Schema & Database Seed
 │   ├── src/             # Express App & Server Entrypoint
 │   └── tests/lab-01/    # Supertest API Endpoint Tests
 ├── docs/lab-01/          # Lab 1 Documentation & Peer Review Logs
 ├── .gitignore
 └── README.md
```

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL database running locally or via Docker

### 2. Environment Configuration
Copy the `.env.example` files to `.env` in both client and server directories:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Set your `DATABASE_URL` in `server/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/toktickit?schema=public"
```

### 3. Install Dependencies & Setup Database

```bash
# Install Server Dependencies
cd server
npm install
npx prisma db push
npx prisma db seed

# Install Client Dependencies
cd ../client
npm install
```

### 4. Running the Application

```bash
# Start Backend Server (Port 3000)
cd server
npm run dev

# Start Frontend Dev Server (Port 5173)
cd client
npm run dev
```

### 5. Running Tests

```bash
# Run Server API Tests
cd server
npm test

# Run Client UI Tests
cd client
npm test

# Pull Request comparison trigger
```
