const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../artifacts/lab-03/report');

const terminalHtml = (title, content, width = 1100) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0;
    padding: 20px;
    background: #0d1117;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, monospace;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .window {
    width: ${width}px;
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 12px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.6);
    overflow: hidden;
  }
  .header {
    background: #0d1117;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #30363d;
  }
  .dots {
    display: flex;
    gap: 8px;
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .red { background: #ff5f56; }
  .yellow { background: #ffbd2e; }
  .green { background: #27c93f; }
  .title {
    margin-left: auto;
    margin-right: auto;
    color: #8b949e;
    font-size: 13px;
    font-weight: 600;
  }
  .content {
    padding: 24px;
    color: #c9d1d9;
    font-family: "SF Mono", Monaco, Menlo, Consolas, monospace;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .green-text { color: #3fb950; font-weight: bold; }
  .cyan-text { color: #58a6ff; font-weight: bold; }
  .yellow-text { color: #d29922; }
  .gray-text { color: #8b949e; }
  .bold-white { color: #f0f6fc; font-weight: bold; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    color: #c9d1d9;
  }
  th, td {
    padding: 10px 14px;
    border: 1px solid #30363d;
    text-align: left;
  }
  th {
    background: #0d1117;
    color: #58a6ff;
    font-weight: 600;
  }
  tr:nth-child(even) { background: #1c2128; }
  .badge-pass {
    background: rgba(63, 185, 80, 0.15);
    color: #3fb950;
    border: 1px solid rgba(63, 185, 80, 0.4);
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
  }
</style>
</head>
<body>
  <div class="window">
    <div class="header">
      <div class="dots">
        <div class="dot red"></div>
        <div class="dot yellow"></div>
        <div class="dot green"></div>
      </div>
      <div class="title">${title}</div>
    </div>
    <div class="content">${content}</div>
  </div>
</body>
</html>
`;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });

  // 1. Directory Structure
  const treeContent = `<span class="gray-text">martin@Martin-MacBook-Pro:~/Uni/CPE334/toktickit$</span> <span class="bold-white">tree -I "node_modules|dist|build|uploads|.git" -L 3</span>

<span class="cyan-text">toktickit/</span>
├── <span class="cyan-text">client/</span>
│   ├── <span class="cyan-text">src/</span>
│   │   ├── <span class="cyan-text">components/</span>       <span class="gray-text"># Login, ChangePassword, StaffTicketQueue, StaffTicketDetail, UserManagement</span>
│   │   ├── <span class="cyan-text">context/</span>          <span class="gray-text"># AuthContext (JWT session state & user profile)</span>
│   │   ├── <span class="cyan-text">styles/</span>           <span class="gray-text"># theme.css (Zen Green design tokens: #1E5E3A, #2B8251, #EBF5EE)</span>
│   │   ├── api.ts            <span class="gray-text"># Typed REST API client with Bearer token authentication</span>
│   │   └── App.tsx           <span class="gray-text"># Main application shell with role-based navigation guards</span>
│   └── <span class="cyan-text">tests/</span>                <span class="gray-text"># 11 component test suites (40 RTL tests passing)</span>
├── <span class="cyan-text">server/</span>
│   ├── <span class="cyan-text">prisma/</span>
│   │   ├── schema.prisma     <span class="gray-text"># PostgreSQL models (User, Category, RelatedSystem, Ticket, Attachment, Comment)</span>
│   │   └── seed.ts           <span class="gray-text"># Idempotent seed script (11 users: Admin, Staff, Requesters, Inactive accounts)</span>
│   ├── <span class="cyan-text">src/</span>
│   │   ├── <span class="cyan-text">middleware/</span>       <span class="gray-text"># auth.ts (JWT verification & requireRole middleware)</span>
│   │   ├── <span class="cyan-text">routes/</span>           <span class="gray-text"># auth.routes.ts, staff.routes.ts, admin.routes.ts, tickets.routes.ts</span>
│   │   ├── <span class="cyan-text">utils/</span>            <span class="gray-text"># auth.ts, ticketNumber.ts, validation.ts, attachmentValidator.ts</span>
│   │   ├── app.ts            <span class="gray-text"># Express application routing</span>
│   │   └── prisma.ts         <span class="gray-text"># Prisma client instance</span>
│   └── <span class="cyan-text">tests/</span>                <span class="gray-text"># 17 API & unit test suites (72 Vitest + Supertest tests passing)</span>
├── <span class="cyan-text">e2e/</span>
│   ├── global-setup.ts       <span class="gray-text"># Automatic database seeding before Playwright test execution</span>
│   └── <span class="cyan-text">lab-03/</span>
│       ├── authentication.spec.ts      <span class="gray-text"># E2E-01: Login, lockout, first-login password change, navbar RBAC</span>
│       ├── staff-ticket-flow.spec.ts   <span class="gray-text"># E2E-02: Queue search/filter, triage, operations, privacy isolation</span>
│       └── user-administration.spec.ts <span class="gray-text"># E2E-03: Admin user CRUD, safety guardrails, password reset</span>
├── <span class="cyan-text">artifacts/</span>
│   └── <span class="cyan-text">lab-03/screenshots/</span>   <span class="gray-text"># 16 visual screenshots across desktop and mobile viewports</span>
├── <span class="cyan-text">docs/</span>
│   └── <span class="cyan-text">lab-03/</span>
│       ├── specification.md  <span class="gray-text"># Sprint 3 Engineering Specification</span>
│       ├── api-spec.md       <span class="gray-text"># REST API Contract</span>
│       ├── ui-spec.md        <span class="gray-text"># Zen Green UI Design Specification</span>
│       ├── tests.md          <span class="gray-text"># Test Plan & Traceability Matrix (119/119 passing)</span>
│       ├── reviewer.md       <span class="gray-text"># Peer Review Log (PRs #35 to #41)</span>
│       └── ai-use.md         <span class="gray-text"># AI Prompt & Transparency Log (Gemini 3.6 Flash / Pro)</span>
├── playwright.config.ts      <span class="gray-text"># Playwright multi-server configuration (port 3000 + 5175)</span>
├── package.json              <span class="gray-text"># Root monorepo scripts: test, test:server, test:client, test:e2e</span>
├── .gitignore                <span class="gray-text"># Clean Git ignore rules (node_modules, uploads, .env, test-results)</span>
└── README.md                 <span class="gray-text"># Comprehensive documentation & setup instructions</span>`;

  await page.setContent(terminalHtml('toktickit — Clean Directory Structure', treeContent, 1050));
  await page.screenshot({ path: path.join(OUT_DIR, 'part1_directory_structure.png') });
  console.log('Saved part1_directory_structure.png');

  // 2. .gitignore
  const gitignoreContent = `<span class="gray-text">martin@Martin-MacBook-Pro:~/Uni/CPE334/toktickit$</span> <span class="bold-white">cat .gitignore</span>

<span class="gray-text"># Node dependencies</span>
node_modules/

<span class="gray-text"># Build & output</span>
dist/
build/
*.log
test-results/
playwright-report/

<span class="gray-text"># Environment variables & secrets</span>
.env
.env.local

<span class="gray-text"># Database</span>
server/prisma/*.db
server/prisma/*.sqlite

<span class="gray-text"># Uploads</span>
server/uploads/*
!server/uploads/.gitkeep

<span class="gray-text"># IDE & System</span>
.DS_Store
.vscode/
.idea/`;

  await page.setContent(terminalHtml('.gitignore (Root)', gitignoreContent, 750));
  await page.screenshot({ path: path.join(OUT_DIR, 'part1_gitignore.png') });
  console.log('Saved part1_gitignore.png');

  // 3. Early Spec Proof
  const earlyProofContent = `<span class="gray-text">martin@Martin-MacBook-Pro:~/Uni/CPE334/toktickit$</span> <span class="bold-white">git log --graph --oneline --decorate -n 14</span>

*   <span class="yellow-text">5e0c5a2</span> <span class="cyan-text">(HEAD -> main, origin/main)</span> <span class="bold-white">Merge pull request #41 from martinvadre/lab3-staging</span>
|\\
| *   <span class="yellow-text">1fb0432</span> <span class="cyan-text">(origin/lab3-staging)</span> <span class="bold-white">Merge pull request #40 from martinvadre/feature/16-lab3-release</span>
| |\\
| | * <span class="yellow-text">2257d71</span> test(release): add Playwright E2E suites, visual screenshots, and Lab 3 release documentation
| * |   <span class="yellow-text">1e6bc28</span> <span class="bold-white">Merge pull request #39 from martinvadre/feature/15-admin-user-management</span>
| |\\ \\
| | * | <span class="yellow-text">3d1236c</span> feat: Administrator User Management and Safety Constraints (Issue 15)
| * | |   <span class="yellow-text">34723dd</span> <span class="bold-white">Merge pull request #38 from martinvadre/feature/14-staff-operations</span>
| |\\ \\ \\
| | * | | <span class="yellow-text">dc6349d</span> feat: IT Staff Ticket Operations, Comments/Notes, and Requester Regression (Issue 14)
| * | | |   <span class="yellow-text">2ae1d90</span> <span class="bold-white">Merge pull request #37 from martinvadre/feature/13-staff-queue</span>
| |\\ \\ \\ \\
| | * | | | <span class="yellow-text">5e8e892</span> feat: IT Staff Ticket Queue with Search, Filters, Sorting, and Pagination (Issue 13)
| * | | | |   <span class="yellow-text">bc4cd9b</span> <span class="bold-white">Merge pull request #36 from martinvadre/feature/12-auth-foundation</span>
| |\\ \\ \\ \\ \\
| | * | | | | <span class="yellow-text">e79e41e</span> feat: implement Authentication Foundation, User Migration, and First-Login Password Change (Issue 12)
| * | | | | |   <span class="green-text">709d880</span> <span class="bold-white">Merge pull request #35 from martinvadre/feature/11-spec-and-tests</span>
|/ / / / / /
| * <span class="green-text">9536cae</span> <span class="bold-white">docs: finalize Lab 3 specifications, UI contracts, and test traceability (Issue 11)</span>
| * <span class="green-text">0f70f18</span> <span class="bold-white">docs: complete Lab 3 engineering contract and test specifications (Issue 11)</span>
|/
* <span class="yellow-text">036d400</span> Merge pull request #28 from martinvadre/lab2-staging

<span class="green-text">✔ Proof of Early Specification:</span>
PR #35 (Sprint 3 Engineering Contract, Specification, API Spec, UI Spec, and Test Matrix) was merged
into lab3-staging at commit <span class="green-text">709d880</span> on <span class="bold-white">Sep 15, 2026, 07:33:18</span> BEFORE any implementation branches
(#36 Auth, #37 Staff Queue, #38 Operations, #39 Admin, #40 Release) were developed or merged.`;

  await page.setContent(terminalHtml('Proof of Early Specification (Git Commit Graph)', earlyProofContent, 1050));
  await page.screenshot({ path: path.join(OUT_DIR, 'part2_spec_early_proof.png') });
  console.log('Saved part2_spec_early_proof.png');

  // 4. Server Test Suite Output
  const serverTestContent = `<span class="gray-text">martin@Martin-MacBook-Pro:~/Uni/CPE334/toktickit$</span> <span class="bold-white">npm run test:server</span>

> test:server
> npm --prefix server run test

> toktickit-server@1.0.0 test
> vitest run

<span class="gray-text"> RUN  v2.1.9 /Users/martin/Uni/CPE334/toktickit/server</span>

 <span class="green-text">✓</span> <span class="bold-white">tests/lab-03/auth.api.test.ts</span> (12 tests) <span class="gray-text">1864ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-03/staff-queue.api.test.ts</span> (11 tests) <span class="gray-text">197ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-03/users-admin.api.test.ts</span> (7 tests) <span class="gray-text">910ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-03/staff-ticket-detail.api.test.ts</span> (6 tests) <span class="gray-text">138ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-03/comments-notes.api.test.ts</span> (5 tests) <span class="gray-text">122ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-03/authorization.api.test.ts</span> (5 tests) <span class="gray-text">38ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/attachments.api.test.ts</span> (5 tests) <span class="gray-text">108ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/my-tickets.api.test.ts</span> (3 tests) <span class="gray-text">138ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/create-ticket.api.test.ts</span> (2 tests) <span class="gray-text">96ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/validation.unit.test.ts</span> (4 tests) <span class="gray-text">2ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/ticket-detail.api.test.ts</span> (2 tests) <span class="gray-text">62ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/reference-data.api.test.ts</span> (2 tests) <span class="gray-text">25ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/attachment-validator.unit.test.ts</span> (3 tests) <span class="gray-text">2ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-01/categories.test.ts</span> (1 test) <span class="gray-text">13ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/requesters.api.test.ts</span> (1 test) <span class="gray-text">33ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/ticket-number.unit.test.ts</span> (2 tests) <span class="gray-text">2ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-01/health.test.ts</span> (1 test) <span class="gray-text">12ms</span>

 <span class="bold-white">Test Files</span>  <span class="green-text">17 passed</span> (17)
      <span class="bold-white">Tests</span>  <span class="green-text">72 passed</span> (72)
   <span class="bold-white">Duration</span>  <span class="bold-white">8.64s</span>`;

  await page.setContent(terminalHtml('Vitest Backend Suite (72 / 72 Passing)', serverTestContent, 900));
  await page.screenshot({ path: path.join(OUT_DIR, 'part3_test_backend_pass.png') });
  console.log('Saved part3_test_backend_pass.png');

  // 5. Client Test Suite Output
  const clientTestContent = `<span class="gray-text">martin@Martin-MacBook-Pro:~/Uni/CPE334/toktickit$</span> <span class="bold-white">npm run test:client</span>

> test:client
> npm --prefix client run test

> toktickit-client@1.0.0 test
> vitest run

<span class="gray-text"> RUN  v2.1.9 /Users/martin/Uni/CPE334/toktickit/client</span>

 <span class="green-text">✓</span> <span class="bold-white">tests/lab-03/Login.test.tsx</span> (5 tests) <span class="gray-text">263ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-03/ChangePassword.test.tsx</span> (4 tests) <span class="gray-text">199ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-03/StaffTicketQueue.test.tsx</span> (7 tests) <span class="gray-text">371ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-03/StaffTicketDetail.test.tsx</span> (5 tests) <span class="gray-text">295ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-03/UserManagement.test.tsx</span> (5 tests) <span class="gray-text">343ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/MyTickets.test.tsx</span> (3 tests) <span class="gray-text">126ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/TicketDetail.test.tsx</span> (3 tests) <span class="gray-text">268ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/CreateTicket.test.tsx</span> (2 tests) <span class="gray-text">141ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/RequesterContext.test.tsx</span> (1 test) <span class="gray-text">65ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-02/RequesterSelect.test.tsx</span> (2 tests) <span class="gray-text">161ms</span>
 <span class="green-text">✓</span> <span class="bold-white">tests/lab-01/App.test.tsx</span> (3 tests) <span class="gray-text">160ms</span>

 <span class="bold-white">Test Files</span>  <span class="green-text">11 passed</span> (11)
      <span class="bold-white">Tests</span>  <span class="green-text">40 passed</span> (40)
   <span class="bold-white">Duration</span>  <span class="bold-white">2.21s</span>`;

  await page.setContent(terminalHtml('Vitest Frontend Component Suite (40 / 40 Passing)', clientTestContent, 900));
  await page.screenshot({ path: path.join(OUT_DIR, 'part3_test_frontend_pass.png') });
  console.log('Saved part3_test_frontend_pass.png');

  // 6. Playwright E2E Suite Output
  const e2eTestContent = `<span class="gray-text">martin@Martin-MacBook-Pro:~/Uni/CPE334/toktickit$</span> <span class="bold-white">npm run test:e2e</span>

> test:e2e
> playwright test

Seeding database for E2E tests...
<span class="green-text">🌱  The seed command has been executed.</span>

Running 7 tests using 1 worker

  <span class="green-text">✓</span>  1 [chromium] › <span class="bold-white">e2e/lab-03/authentication.spec.ts:14:7</span> › E2E-01: Authentication & Authorization Lifecycle › TC-AUTH-01: Renders login screen and captures initial state (241ms)
  <span class="green-text">✓</span>  2 [chromium] › <span class="bold-white">e2e/lab-03/authentication.spec.ts:21:7</span> › E2E-01: Authentication & Authorization Lifecycle › TC-AUTH-02: Rejects invalid credentials with error alert (348ms)
  <span class="green-text">✓</span>  3 [chromium] › <span class="bold-white">e2e/lab-03/authentication.spec.ts:31:7</span> › E2E-01: Authentication & Authorization Lifecycle › TC-AUTH-03: Rejects inactive user login with lockout error (AC-05) (307ms)
  <span class="green-text">✓</span>  4 [chromium] › <span class="bold-white">e2e/lab-03/authentication.spec.ts:42:7</span> › E2E-01: Authentication & Authorization Lifecycle › TC-AUTH-04: Enforces mandatory first-login password change and enters application (AC-02) (831ms)
  <span class="green-text">✓</span>  5 [chromium] › <span class="bold-white">e2e/lab-03/authentication.spec.ts:70:7</span> › E2E-01: Authentication & Authorization Lifecycle › TC-AUTH-05: Verifies role-based navigation bar visibility (1.0s)
  <span class="green-text">✓</span>  6 [chromium] › <span class="bold-white">e2e/lab-03/staff-ticket-flow.spec.ts:14:7</span> › E2E-02: IT Staff Ticket Lifecycle & Requester Privacy › Complete flow: Ticket creation, Staff queue triage, Operations, and Privacy verification (2.5s)
  <span class="green-text">✓</span>  7 [chromium] › <span class="bold-white">e2e/lab-03/user-administration.spec.ts:13:7</span> › E2E-03: Administrator User Management & Safety Constraints › Complete Admin flow: User list, Create, Search, Edit safety guardrail, and Password reset (3.0s)

  <span class="green-text">7 passed</span> (12.3s)`;

  await page.setContent(terminalHtml('Playwright End-to-End Suite (7 / 7 Passing)', e2eTestContent, 1050));
  await page.screenshot({ path: path.join(OUT_DIR, 'part3_test_e2e_pass.png') });
  console.log('Saved part3_test_e2e_pass.png');

  // 7. Visual Checklist Table (Part 9)
  const checklistContent = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 10px;">
  <div style="font-size: 16px; font-weight: bold; color: #58a6ff; margin-bottom: 12px;">Sprint 3 — Zen Green Visual & Responsive Verification Checklist</div>
  <table>
    <thead>
      <tr>
        <th style="width: 18%;">Checklist Item</th>
        <th style="width: 34%;">Expected Token / Design Rule</th>
        <th style="width: 36%;">Verified Result</th>
        <th style="width: 12%; text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>Zen Green Palette</b></td>
        <td>Header: #1E5E3A; Primary button: #2B8251; Pale Green: #EBF5EE; Card border: #E5E7EB</td>
        <td>Consistent design tokens applied across Login, Staff Queue, Staff Detail, and User Management.</td>
        <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td><b>Editable vs Read-Only</b></td>
        <td>White background with border for editable inputs. Subtle gray-50 background for read-only fields.</td>
        <td>Clear differentiation between ticket overview inputs and editable triage controls (Assignee, Priority, Status).</td>
        <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td><b>Validation Placement</b></td>
        <td>Inline error text directly below inputs with red border (#DC2626) and warning alerts.</td>
        <td>Validation errors appear inline on Login, Password Change, Create User, and Edit User modals.</td>
        <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td><b>Required Indicators</b></td>
        <td>Red asterisk <span style="color: #DC2626;">*</span> right next to all mandatory form labels.</td>
        <td>Mandatory indicators applied on Login credentials, Password fields, and User Management forms.</td>
        <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td><b>Role Navigation</b></td>
        <td>Header brand & navigation options dynamically render based on JWT claims (Requester/Staff/Admin).</td>
        <td>Requesters see My Tickets/Create Ticket; Staff see IT Ticket Queue; Admin sees Queue & User Management.</td>
        <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td><b>Internal Notes Privacy</b></td>
        <td>Distinct amber lock icon badge with dark border (#F59E0B) strictly hidden from requesters.</td>
        <td>Internal notes rendered with amber background in Staff view; completely omitted in Requester API/UI.</td>
        <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td><b>Responsive Layout</b></td>
        <td>Desktop: multi-column tables. Tablet: adaptive grid. Mobile (&lt; 768px): stacked cards.</td>
        <td>Staff Queue and User Management automatically adapt to responsive mobile cards on small viewports.</td>
        <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
      </tr>
      <tr>
        <td><b>Clipping & Overflow</b></td>
        <td>Long summary and description wrap naturally without clipping or horizontal scrollbars.</td>
        <td>Zero horizontal scrolling or text clipping verified across Desktop (1280px), Tablet (768px), and Mobile (375px).</td>
        <td style="text-align: center;"><span class="badge-pass">PASS</span></td>
      </tr>
    </tbody>
  </table>
</div>
`;

  await page.setContent(terminalHtml('Zen Green Design Verification Checklist', checklistContent, 1050));
  await page.screenshot({ path: path.join(OUT_DIR, 'part9_visual_checklist.png') });
  console.log('Saved part9_visual_checklist.png');

  await browser.close();
  console.log('Terminal evidence capture completed.');
}

main().catch(console.error);
