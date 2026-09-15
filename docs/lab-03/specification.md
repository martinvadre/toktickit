# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal
Deliver the **Authentication, IT Staff Operations, and Administrator Management** increment of TokTickIT. This sprint replaces simulated requester switching with secure session-based/JWT authentication and a unified database user model (`User` with roles `REQUESTER`, `STAFF`, `ADMIN`). It introduces a dedicated **IT Staff Ticket Queue & Operations Dashboard** for triage, status progression, staff assignment, IT priority management, internal notes, and resolution tracking. It also provides an **Administrator User Management** portal for managing user accounts, roles, and access, while maintaining strict Role-Based Access Control (RBAC) and ensuring zero regression for Requester ticket workflows within the **Zen Green Theme** design system.

---

## 2. Stakeholder Request Interpretation
The IT Service Desk requires production-grade identity management, access control, and staff operational workflows. Requesters must log in securely with an email and password to view and manage only their own support tickets. Users with an initial temporary password must change it at first login before accessing application features. IT Staff members (`STAFF` and `ADMIN`) require central visibility across all submitted tickets with powerful filtering, searching, assignment, status tracking, internal collaboration notes, and resolution logging. Requesters can post public comments and indicate that a problem appears resolved, but IT Staff remain responsible for formally resolving or closing tickets. Administrators (`ADMIN`) require centralized user lifecycle management (user creation with one permitted role, profile editing, active/inactive toggles, and new initial password setup) while enforcing safety guardrails such as preventing self-deactivation and protecting the last active Administrator.

---

## 3. Scope

### 3.1. Included in Lab 3
- **Authentication & User Migration**:
  - Unified database model (`User`) supporting `REQUESTER`, `STAFF`, and `ADMIN` roles.
  - Seamless database migration from Lab 2 `RequesterUser` records into `User` with `role = REQUESTER`.
  - Password hashing with `bcrypt`.
  - REST authentication endpoints (`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/change-password`).
  - Mandatory first-login password change for accounts flagged with `mustChangePassword = true`.
  - JWT authentication with authorization headers (`Bearer <token>`).
  - Auth context provider and guarded frontend routing (Login page, Change Password page, Requester routes, Staff routes, Admin routes).
- **IT Staff Ticket Queue**:
  - Centralized queue listing ALL tickets submitted across the organization.
  - Multi-criteria filtering: Category, Related System, Status, Assigned Staff, Requested Priority, IT Priority.
  - Global search by Ticket Number (`TCK-YYYYMMDD-XXXX`), Summary, Description, and Requester Name/Email.
  - Sorting by Created Date, Updated Date, Status, Requested Priority, and IT Priority.
  - Responsive layout (multi-column data table on desktop, stacked card layout on mobile).
  - Pagination with configurable limits (5, 10, 20 items per page).
- **IT Staff Ticket Operations**:
  - Detailed IT Staff Ticket View displaying requester identity, ticket metadata, active attachments, and ticket history.
  - Ticket Status transitions across required statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`).
  - Staff assignment & self-assignment workflow.
  - Independent IT Priority assignment (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), initially copied from Requested Priority.
  - Comment & Note lifecycle: Public comments (visible to Requester, Staff, and Admin) and Internal Staff Notes (visible ONLY to Staff and Admin). Both append-only.
  - Resolution workflow: Mandatory resolution summary when marking tickets as `RESOLVED` or `CLOSED`.
- **Administrator User Management**:
  - Admin dashboard displaying all system users.
  - User filtering by Role (`REQUESTER`, `STAFF`, `ADMIN`) and Status (`isActive`).
  - Search users by Name or Email.
  - User creation form with one permitted role assignment and initial password setup.
  - User editing (Update Name, Email, Role, Active Status).
  - Admin password reset functionality (issuing a new initial password that requires change on next login).
  - Safety guardrails: Prevent self-deactivation, prevent removing or deactivating the last active Administrator, enforce account deactivation instead of deletion.
- **Requester Experience & RBAC Security**:
  - Requester dashboard preserved with strict ownership filtering (`requesterId === authenticatedUserId`).
  - Requester can post Public Comments and indicate that their reported issue appears resolved (`requesterIndicatedResolved = true`).
  - Universal backend middleware verifying token validity and enforcing endpoint-level role permissions (`REQUESTER`, `STAFF`, `ADMIN`).
  - Zero regression for all Lab 2 Requester Ticket and Attachment capabilities.

### 3.2. Explicitly Excluded from Lab 3
- External email/SMS notification dispatch engines and password-reset emails.
- Third-party OAuth2 / SAML Single Sign-On (SSO) integrations and multi-factor authentication.
- Self-registration and Requester-created accounts.
- Actions Taken by IT Staff (deferred to Lab 4).
- Formal SLA calculation, escalation rules, and notification services.
- Multi-tenant organizations, departments, customer administration, and profile photos.
- User deletion, bulk user operations, user import/export, and account audit history.
- Multiple roles assigned to one user.

---

## 4. Functional Requirements

### Authentication & User Identity
- **FR-01: User Login**: The system shall allow users to authenticate with a valid email address and password, returning a signed JWT token and user identity with role.
- **FR-02: Authentication State**: The frontend shall store authentication tokens securely and attach authorization headers (`Authorization: Bearer <token>`) to all API requests.
- **FR-03: Session Verification**: The API shall provide `GET /api/auth/me` to return the authenticated user profile and permissions.
- **FR-04: User Logout**: The client shall provide a Logout action that invalidates the local session and redirects the user to the Login screen.
- **FR-05: Account Inactivation Lockout**: The system shall reject login attempts for inactive accounts (`isActive = false`) with an unambiguous error message.
- **FR-06: First-Login Password Change**: Users flagged with `mustChangePassword = true` shall be blocked from normal application screens until a valid new password is saved via `POST /api/auth/change-password`.

### IT Staff Queue & Search
- **FR-07: Global Staff Ticket Queue**: The system shall provide IT Staff and Administrators a centralized queue of all tickets submitted across the organization.
- **FR-08: Staff Queue Filtering**: Staff users shall be able to filter tickets by Category, Related System, Status, Assigned Staff, Requested Priority, and IT Priority.
- **FR-09: Staff Queue Search**: Staff users shall be able to search tickets in real time by Ticket Number, Summary, Description, and Requester Name/Email.
- **FR-10: Staff Queue Sorting & Pagination**: Staff users shall be able to sort the queue by `createdAt`, `updatedAt`, `currentStatus`, `requestedPriority`, and `itPriority`, with page navigation controls.

### IT Staff Ticket Operations
- **FR-11: IT Staff Ticket Detail**: Staff users shall be able to inspect complete ticket metadata, requester identity, active attachments, and full comment/note history.
- **FR-12: Ticket Status Management**: Staff users shall be able to update ticket status adhering strictly to legal transition rules.
- **FR-13: Staff Assignment**: Staff users shall be able to assign tickets to any active IT Staff user or self-assign.
- **FR-14: IT Priority Management**: Staff users shall be able to set an explicit `itPriority` independent of the requester's `requestedPriority`.
- **FR-15: Internal Staff Notes**: Staff users shall be able to post internal operational notes visible exclusively to IT Staff and Administrators.
- **FR-16: Public Ticket Comments**: Requesters, Staff, and Admins shall be able to post public comments on tickets.
- **FR-17: Requester Resolution Indication**: Requesters shall be able to indicate that their reported problem appears resolved on their owned ticket.
- **FR-18: Resolution Recording**: Transitioning a ticket to `RESOLVED` or `CLOSED` shall require a non-empty resolution summary statement.

### Administrator User Management
- **FR-19: Admin User Listing**: Administrators shall be able to view a user list showing Name, Email, Role, Status, and Edit actions.
- **FR-20: Admin User Filtering & Search**: Administrators shall be able to search users by Name or Email, and optionally filter by Role.
- **FR-21: User Account Creation**: Administrators shall be able to create new accounts with Name, Email, one permitted Role, initial password, and activation status.
- **FR-22: User Account Modification**: Administrators shall be able to edit user Name, Email, Role, and `isActive` flag.
- **FR-23: Admin Password Reset**: Administrators shall be able to assign a new initial password that requires a password change at next login.

### RBAC & Requester Regression
- **FR-24: Role-Based Routing**: Application navigation shall display only destinations permitted for the authenticated user's role.
- **FR-25: Requester Ownership Isolation**: Requesters shall remain strictly restricted to viewing, managing attachments, and commenting on only their owned tickets.
- **FR-26: Unauthorized API Access Protection**: Server endpoints shall return `401 Unauthorized` for missing/invalid tokens and `403 Forbidden` for role or ownership violations.
- **FR-27: Internal Note Privacy**: Server endpoints shall never expose internal notes (`isInternal = true`) to Requester users.

---

## 5. Business Rules

- **BR-01 (Active User Authentication)**: Only an active user (`isActive = true`) with valid credentials may authenticate.
- **BR-02 (Mandatory Password Change)**: A user marked as requiring a password change (`mustChangePassword = true`) cannot enter normal application screens until a new valid password meeting complexity rules is saved.
- **BR-03 (Server-Enforced Ownership)**: The authenticated user identity from the verified session/token, not a client-supplied identifier, strictly determines ownership of all Requester operations.
- **BR-04 (Public Comments vs. Internal Notes Visibility)**:
  - Public Comments are visible to Requester, IT Staff, and Administrator.
  - Internal Notes are visible only to IT Staff and Administrator. Requesters must never receive or view internal notes.
- **BR-05 (Requester Resolution Indication)**: A Requester may indicate that their reported problem appears resolved (`requesterIndicatedResolved = true`), but cannot formally set the Ticket status to `RESOLVED` or `CLOSED`. Formal resolution is reserved for IT Staff and Administrator.
- **BR-06 (Required Ticket Statuses & Lifecycle Transitions)**:
  - Required statuses: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
  - Permitted status transitions:
    - `NEW` $\rightarrow$ `OPEN`, `IN_PROGRESS`, `CANCELLED`
    - `OPEN` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
    - `IN_PROGRESS` $\rightarrow$ `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
    - `WAITING_FOR_REQUESTER` $\rightarrow$ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
    - `RESOLVED` $\rightarrow$ `CLOSED`, `REOPENED`
    - `REOPENED` $\rightarrow$ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
    - `CLOSED` $\rightarrow$ Terminal state (no further transitions permitted)
    - `CANCELLED` $\rightarrow$ Terminal state (no further transitions permitted)
  - Backward compatibility aliases: `ASSIGNED` maps to `OPEN`; `PENDING_REQUESTER` maps to `WAITING_FOR_REQUESTER`.
- **BR-07 (Staff Assignment Rules)**: Each Ticket may have zero or one primary Ticket Owner. Assignment can only be granted to an active user (`isActive = true`) holding role `STAFF` or `ADMIN`.
- **BR-08 (IT Priority Rules)**: Requested Priority remains the immutable value submitted by the Requester. IT Priority initially defaults to Requested Priority and may later be modified only by IT Staff or Administrator.
- **BR-09 (Mandatory Resolution Summary)**: Transitioning a ticket to `RESOLVED` or `CLOSED` requires a non-empty `resolutionSummary` string (10 to 1,000 characters).
- **BR-10 (Append-Only Comments and Notes)**: Both Public Comments and Internal Notes are strictly append-only (editing and deletion are excluded). Empty or whitespace-only content is rejected (1 to 2,000 characters). Each entry permanently records author identity and creation timestamp from the backend.
- **BR-11 (Administrator Safety Guardrails)**:
  - An Administrator cannot deactivate (`isActive = false`) their own account.
  - The system strictly prohibits removing, deactivating, or demoting the last active Administrator account.
  - Deactivation is used instead of user deletion to preserve referential integrity and audit trails.
  - Each user account has exactly one permitted role (`REQUESTER`, `STAFF`, or `ADMIN`).
- **BR-12 (Email Uniqueness & Normalization)**: Every user account must possess a unique email address. Email addresses are trimmed and converted to lowercase prior to comparison and storage.

---

## 6. UI Specification Summary
The user interface extends the **Zen Green Theme** established in Lab 2:
- **Design Tokens**:
  - Primary Green: `#006B3C`, Primary Hover: `#004D2B`, Pale Green: `#E6F4EA`
  - Background: `#F8FAFC`, Container Surface: `#FFFFFF`, Border: `#E2E8F0`
- **Role Badges**:
  - Requester: `#2B6CB0` (Subtle Blue)
  - IT Staff: `#006B3C` (Zen Green)
  - Administrator: `#C53030` (Burgundy / Crimson)
- **Ticket Status Badges**:
  - `NEW`: Blue badge
  - `OPEN` / `ASSIGNED`: Purple badge
  - `IN_PROGRESS`: Amber badge
  - `WAITING_FOR_REQUESTER`: Orange badge
  - `RESOLVED`: Emerald badge
  - `CLOSED`: Slate badge
  - `REOPENED`: Indigo badge
  - `CANCELLED`: Red badge
- **IT Priority Badges**:
  - `LOW`: Slate (`#4A5568`)
  - `MEDIUM`: Amber (`#D69E2E`)
  - `HIGH`: Orange (`#DD6B20`)
  - `URGENT`: Red (`#E53E3E`) with pulse indicator
- **Screen Inventory**:
  1. `/login`: Clean, centered Zen Green card with validation feedback and development demo quick-fill helper buttons.
  2. `/change-password`: Dedicated first-login screen blocking app entry until password complexity rules are satisfied.
  3. Header & Navigation: Role-aware navbar displaying user name, email, role badge, logout button, and role-permitted links.
  4. `/staff/queue`: Searchable, filterable, sortable, paginated ticket queue with desktop table and mobile card views.
  5. `/staff/tickets/:id`: Operations view for status transitions, staff assignment, IT priority, resolution entry, and separated Public Comments vs. Internal Notes feeds.
  6. `/admin/users`: User management list, search by name/email, role filter, create user dialog, edit user dialog, and reset password action.
  7. Requester views: My Tickets and Ticket Detail maintained from Lab 2 with added Public Comments and "Problem Appears Resolved" toggle.
- Detailed visual specifications, breakpoint rules, and accessibility checklists are maintained in [`docs/lab-03/ui-spec.md`](ui-spec.md).

---

## 7. Data Changes & Schema Models

### 7.1. Prisma Schema Evolution

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  REQUESTER
  STAFF
  ADMIN
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketStatus {
  NEW
  OPEN
  ASSIGNED
  IN_PROGRESS
  WAITING_FOR_REQUESTER
  PENDING_REQUESTER
  RESOLVED
  CLOSED
  REOPENED
  CANCELLED
}

model User {
  id                 Int       @id @default(autoincrement())
  name               String
  email              String    @unique
  passwordHash       String
  department         String?
  role               Role      @default(REQUESTER)
  isActive           Boolean   @default(true)
  mustChangePassword Boolean   @default(false)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  submittedTickets   Ticket[]        @relation("SubmittedTickets")
  assignedTickets    Ticket[]        @relation("AssignedTickets")
  comments           TicketComment[]

  @@index([email])
  @@index([role])
  @@index([isActive])
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model RelatedSystem {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model Ticket {
  id                         Int          @id @default(autoincrement())
  ticketNumber               String       @unique
  requesterId                Int
  assignedStaffId            Int?
  categoryId                 Int
  relatedSystemId            Int
  summary                    String
  description                String
  requestedPriority          Priority     @default(MEDIUM)
  itPriority                 Priority?
  currentStatus              TicketStatus @default(NEW)
  resolutionSummary          String?
  requesterIndicatedResolved Boolean      @default(false)
  resolvedAt                 DateTime?
  closedAt                   DateTime?
  createdAt                  DateTime     @default(now())
  updatedAt                  DateTime     @updatedAt

  requester                  User          @relation("SubmittedTickets", fields: [requesterId], references: [id])
  assignedStaff              User?         @relation("AssignedTickets", fields: [assignedStaffId], references: [id])
  category                   Category      @relation(fields: [categoryId], references: [id])
  relatedSystem              RelatedSystem @relation(fields: [relatedSystemId], references: [id])
  attachments                Attachment[]
  comments                   TicketComment[]

  @@index([ticketNumber])
  @@index([requesterId])
  @@index([assignedStaffId])
  @@index([categoryId])
  @@index([relatedSystemId])
  @@index([currentStatus])
}

model Attachment {
  id             Int       @id @default(autoincrement())
  ticketId       Int
  fileName       String
  storedFileName String
  fileSize       Int
  mimeType       String
  isRemoved      Boolean   @default(false)
  removalReason  String?
  removedAt      DateTime?
  createdAt      DateTime  @default(now())

  ticket         Ticket    @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@index([ticketId])
}

model TicketComment {
  id         Int      @id @default(autoincrement())
  ticketId   Int
  authorId   Int
  content    String
  isInternal Boolean  @default(false)
  createdAt  DateTime @default(now())

  ticket     Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  author     User     @relation(fields: [authorId], references: [id])

  @@index([ticketId])
  @@index([authorId])
  @@index([isInternal])
}
```

### 7.2. Migration & Seed Decisions
- **Migration Strategy**: Existing `RequesterUser` records are migrated into the unified `User` table with `role = REQUESTER`, default password hash (`Password123!`), and `mustChangePassword = false`. Ticket foreign keys are mapped to the new `User.id`.
- **Seed Data**:
  - Requesters: $\ge 4$ active accounts, 1 inactive account.
  - IT Staff: $\ge 3$ active accounts, 1 inactive account.
  - Administrator: $\ge 1$ active account.
  - Distributed tickets covering statuses, priorities, assigned/unassigned states, attachments, public comments, and internal notes.

---

## 8. REST API Contract Summary
The complete REST API specification is documented in [`docs/lab-03/api-spec.md`](api-spec.md). Endpoints include:
- **Authentication**:
  - `POST /api/auth/login`: Authenticate email/password, return JWT token and user profile.
  - `POST /api/auth/logout`: Invalidate local user session.
  - `GET /api/auth/me`: Return authenticated user details and role.
  - `POST /api/auth/change-password`: Complete mandatory first-login or voluntary password change.
- **IT Staff Queue & Detail**:
  - `GET /api/staff/tickets`: Multi-criteria queue retrieval with search, filter, sort, pagination.
  - `GET /api/staff/tickets/:id`: Full operational ticket detail for Staff/Admin.
  - `PATCH /api/staff/tickets/:id/status`: Legal status transition with resolution validation.
  - `PATCH /api/staff/tickets/:id/assign`: Staff assignment / self-assignment.
  - `PATCH /api/staff/tickets/:id/priority`: Explicit IT Priority update.
- **Comments & Notes**:
  - `POST /api/staff/tickets/:id/comments`: Create Public Comment or Internal Staff Note.
  - `POST /api/tickets/:id/comments`: Requester public comment creation.
  - `PATCH /api/tickets/:id/indicate-resolved`: Requester indication of resolution.
- **Administrator User Management**:
  - `GET /api/admin/users`: User listing with name/email search and role filter.
  - `POST /api/admin/users`: User creation with initial password.
  - `PATCH /api/admin/users/:id`: User account modification.
  - `POST /api/admin/users/:id/reset-password`: Set new initial password requiring change at next login.

---

## 9. Acceptance Criteria

- **AC-01**: Given an active user with valid credentials, when the user logs in, then the backend establishes authenticated access, returns the JWT token, and provides the permitted user identity and role.
- **AC-02**: Given a user flagged with `mustChangePassword = true`, when login succeeds, then normal application screens remain unavailable until a valid new password is saved.
- **AC-03**: Given an authenticated Requester, when the client attempts to supply another `requesterId`, then the backend applies the authenticated identity and does not return or modify another Requester's data.
- **AC-04**: Given a Requester account, when an Internal Note endpoint is requested or a ticket detail is fetched, then internal note content is rejected or omitted from the response.
- **AC-05**: Given an inactive user account (`isActive = false`), when login is attempted, then authentication is rejected with a safe error without revealing unnecessary account metadata.
- **AC-06**: Given an IT Staff or Administrator user, when accessing `/staff/queue`, then all organization tickets are returned with working search, filtering, sorting, and pagination.
- **AC-07**: Given a ticket in `IN_PROGRESS` or `WAITING_FOR_REQUESTER`, when IT Staff transitions it to `RESOLVED` or `CLOSED`, then a non-empty resolution summary of at least 10 characters is strictly required.
- **AC-08**: Given an IT Staff user, when viewing ticket operations, then the user can claim (self-assign) or assign the ticket to any active Staff/Admin user, and set independent IT Priority.
- **AC-09**: Given an Administrator user, when accessing `/admin/users`, then the user list can be filtered by role and searched by name or email.
- **AC-10**: Given an Administrator attempting to deactivate their own account or the last active Administrator in the system, then the backend rejects the operation with a 400 Bad Request guardrail error.
- **AC-11**: Given a user creation or edit request with an email address already registered, then the backend rejects the request with a 409 Conflict error.
- **AC-12**: Given an authenticated Requester, when using existing Lab 2 Create Ticket, My Tickets, and Attachment operations, then all functions operate flawlessly without the development selector.

---

## 10. Definition of Done

### Part 1: Product Completion Checklist
- [x] Unified `User` model implemented with `REQUESTER`, `STAFF`, and `ADMIN` roles.
- [x] Lab 2 `RequesterUser` records migrated to `User` preserving ticket ownership.
- [x] Passwords stored as salted `bcrypt` hashes; plaintext passwords never saved or logged.
- [x] Mandatory first-login password change enforced for accounts with `mustChangePassword = true`.
- [x] Global IT Staff Ticket Queue implemented with search, multi-select filters, sorting, and pagination.
- [x] IT Staff Ticket Operations implemented: status lifecycle transitions, staff assignment, IT priority, resolution summary, and internal notes.
- [x] Public Comments visible to Requester and Staff; Internal Notes visible strictly to Staff and Admin.
- [x] Requester resolution indication implemented without permitting direct status alteration.
- [x] Administrator User Management implemented: user listing, search, creation, editing, active toggle, and password reset.
- [x] Administrator safety guardrails enforced (no self-deactivation, last active admin protection).
- [x] Zero regression across all Lab 2 Requester workflows.
- [x] Zen Green theme design system maintained across all new screens.

### Part 2: Course Delivery Checklist
- [x] Engineering Specification (`docs/lab-03/specification.md`) complete with numbered FRs, BRs, data models, and ACs.
- [x] REST API Specification (`docs/lab-03/api-spec.md`) complete with all endpoints, schemas, and error contracts.
- [x] UI Specification (`docs/lab-03/ui-spec.md`) complete with Zen Green tokens, screen layouts, and responsive rules.
- [x] Test Plan & Traceability Matrix (`docs/lab-03/tests.md`) mapping every AC to automated test paths.
- [x] Peer Reviewer Log (`docs/lab-03/reviewer.md`) and AI Prompt Log (`docs/lab-03/ai-use.md`) maintained.
- [x] Feature branch workflow (`feature/11-spec-and-tests` $\rightarrow$ `lab3-staging` $\rightarrow$ `main`) followed.

---

## 11. Assumptions and Decisions

- **D-01 (Authentication Token Architecture)**: JWT (JSON Web Token) with HS256 algorithm was selected for stateless, cross-boundary API authorization. Tokens contain `userId`, `email`, and `role`, expiring in 24 hours.
- **D-02 (Password Hashing Algorithm)**: `bcrypt` with a minimum work factor of 10 was selected for robust protection against brute-force and dictionary attacks.
- **D-03 (Resolution Summary Storage)**: `resolutionSummary` is stored as an optional text field on `Ticket`, populated when status transitions to `RESOLVED` or `CLOSED` and rendered in ticket details.
- **D-04 (Internal Note Flagging)**: A single `TicketComment` table with `isInternal: Boolean` was chosen over separate tables, simplifying timeline queries while strictly stripping internal notes in the service layer when accessed by Requesters.
- **D-05 (User Inactivation vs. Deletion)**: Soft deactivation (`isActive: Boolean`) is strictly enforced instead of physical deletion to prevent cascading foreign key deletions and maintain ticket audit history.
