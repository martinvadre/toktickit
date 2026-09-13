# Lab 3 Sprint Engineering Specification

## 1. Sprint Goal
Deliver the **Authentication, IT Staff Operations, and Administrator Management** increment of TokTickIT. This sprint replaces simulated requester switching with secure session-based/JWT authentication and a unified database user model (`User` with roles `REQUESTER`, `STAFF`, `ADMIN`). It introduces a dedicated **IT Staff Ticket Queue & Operations Dashboard** for triage, status progression, staff assignment, IT priority management, internal notes, and resolution tracking. It also provides an **Administrator User Management** portal for managing user accounts, roles, and access, while maintaining strict Role-Based Access Control (RBAC) and ensuring zero regression for Requester ticket workflows within the **Zen Green Theme** design system.

---

## 2. Stakeholder Request Interpretation
The IT Service Desk requires production-grade identity management, access control, and staff operational workflows. Requesters must log in securely to view and manage only their own support tickets. IT Staff members (`STAFF` and `ADMIN`) require central visibility across all submitted tickets with powerful filtering, searching, assignment, status tracking, internal collaboration notes, and resolution logging. Administrators (`ADMIN`) require centralized user lifecycle management (user creation, profile editing, role assignment, active/inactive toggles, and password resets) to maintain system governance.

---

## 3. Scope

### 3.1. Included in Lab 3
- **Authentication & User Migration**:
  - Unified database model (`User`) supporting `REQUESTER`, `STAFF`, and `ADMIN` roles.
  - Seamless database migration from Lab 2 `RequesterUser` records into `User` with `role = REQUESTER`.
  - Password hashing with `bcrypt` / `argon2`.
  - REST authentication endpoints (`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`).
  - JWT / session token authentication with authorization headers (`Bearer <token>`).
  - Auth context provider and guarded frontend routing (Login page, Requester routes, Staff routes, Admin routes).
- **IT Staff Ticket Queue**:
  - Centralized queue listing ALL tickets submitted across the organization.
  - Multi-criteria filtering: Category, Related System, Status, Assigned Staff, Requested Priority, IT Priority.
  - Global search by Ticket Number (`TCK-YYYYMMDD-XXXX`), Summary, Description, and Requester Name/Email.
  - Sorting by Created Date, Updated Date, Status, Requested Priority, and IT Priority.
  - Responsive layout (multi-column data table on desktop, stacked card layout on mobile).
  - Pagination with configurable limits (5, 10, 20 items per page).
- **IT Staff Ticket Operations**:
  - Detailed IT Staff Ticket View displaying requester identity, ticket metadata, active attachments, and ticket history.
  - Ticket Status transitions (`NEW`, `ASSIGNED`, `IN_PROGRESS`, `PENDING_REQUESTER`, `RESOLVED`, `CLOSED`, `CANCELLED`).
  - Staff assignment & self-assignment workflow.
  - Independent IT Priority assignment (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - Comment & Note lifecycle: Public comments (visible to Requester and Staff) and Internal Staff Notes (visible ONLY to Staff and Admin).
  - Resolution workflow: Mandatory resolution summary when marking tickets as `RESOLVED` or `CLOSED`.
- **Administrator User Management**:
  - Admin dashboard displaying all system users.
  - User filtering by Role (`REQUESTER`, `STAFF`, `ADMIN`) and Status (`isActive`).
  - Search users by Name, Email, or Department.
  - User creation form with full role assignment and initial password setup.
  - User editing (Update Name, Department, Role, Active Status).
  - Admin password reset functionality.
- **Requester Experience & RBAC Security**:
  - Requester dashboard preserved with strict ownership filtering (`requesterId === authenticatedUserId`).
  - Public ticket comments viewable by Requesters on their owned tickets.
  - Universal backend middleware verifying token validity and enforcing endpoint-level role permissions (`REQUESTER`, `STAFF`, `ADMIN`).

### 3.2. Explicitly Excluded from Lab 3
- External email/SMS notification dispatch engines.
- Third-party OAuth2 / SAML Single Sign-On (SSO) integrations.
- Multi-tenant cloud object storage for file attachments (local storage retained).
- Automated SLA breach escalation timers.

---

## 4. Functional Requirements

### Authentication & User Identity
- **FR-01: User Login**: The system shall allow users to log in using valid email and password credentials, returning a signed authentication token.
- **FR-02: Authentication State**: The frontend shall store authentication tokens securely and automatically attach authorization headers to API requests.
- **FR-03: Session Verification**: The API shall provide a `GET /api/auth/me` endpoint to return the profile and role of the currently authenticated user.
- **FR-04: User Logout**: The client shall provide a Logout action that invalidates the local session and redirects the user to the Login screen.
- **FR-05: Account Inactivation Lockout**: The system shall reject login attempts for users with `isActive = false` with a clear account disabled message.

### IT Staff Queue & Search
- **FR-06: Global Staff Ticket Queue**: The system shall allow IT Staff (`STAFF`, `ADMIN`) to view all submitted tickets across all requesters.
- **FR-07: Staff Queue Filtering**: Staff users shall be able to filter tickets by Category, Related System, Status, Assigned Staff, Requested Priority, and IT Priority.
- **FR-08: Staff Queue Search**: Staff users shall be able to search tickets in real time or on submit by matching keywords against Ticket Number, Summary, Description, and Requester Name/Email.
- **FR-09: Staff Queue Sorting & Pagination**: Staff users shall be able to sort the queue by `createdAt`, `updatedAt`, `currentStatus`, `requestedPriority`, and `itPriority`, with page navigation controls.

### IT Staff Ticket Operations
- **FR-10: IT Staff Ticket Detail**: Staff users shall be able to inspect the complete ticket details, requester profile info, initial attachments, and audit timestamps.
- **FR-11: Ticket Status Management**: Staff users shall be able to update the ticket status following legal status transition rules.
- **FR-12: Staff Assignment**: Staff users shall be able to assign a ticket to any active IT Staff user or self-assign the ticket.
- **FR-13: IT Priority Management**: Staff users shall be able to set an explicit `itPriority` independent of the requester's `requestedPriority`.
- **FR-14: Internal Staff Notes**: Staff users shall be able to post internal notes on a ticket that are visible only to users with `STAFF` or `ADMIN` roles.
- **FR-15: Public Ticket Comments**: Staff and Requester users shall be able to post public comments on tickets.
- **FR-16: Resolution Recording**: When transitioning a ticket to `RESOLVED` or `CLOSED`, the system shall require and record a resolution summary statement.

### Administrator User Management
- **FR-17: Admin User Listing**: Administrators (`ADMIN`) shall be able to view a paginated list of all registered users with role and status badges.
- **FR-18: Admin User Filtering & Search**: Administrators shall be able to filter users by Role (`REQUESTER`, `STAFF`, `ADMIN`) and Status (`isActive`), and search by Name, Email, or Department.
- **FR-19: User Account Creation**: Administrators shall be able to create new user accounts specifying Name, Email, Department, Role, and Initial Password.
- **FR-20: User Account Modification**: Administrators shall be able to edit user details including Name, Department, Role, and `isActive` flag.
- **FR-21: Admin Password Reset**: Administrators shall be able to set a new password for any user account.

### RBAC & Requester Regression
- **FR-22: Role-Based Routing**: The application header and client router shall dynamically show navigation items and allow access strictly based on the user's role.
- **FR-23: Requester Ownership Isolation**: Requesters shall remain strictly restricted to viewing, commenting on, and managing attachments for only their owned tickets.
- **FR-24: Unauthorized API Access Protection**: Server endpoints shall return `401 Unauthorized` for missing/invalid tokens and `403 Forbidden` for role permission violations.
- **FR-25: Public Comment Visibility**: Requesters shall be able to view public comments posted by IT Staff on their owned tickets, but must never receive internal notes.

---

## 5. Business Rules

- **BR-01 (Role-Based Access Control)**:
  - `REQUESTER`: Access to login, logout, create ticket, view owned tickets, view owned ticket details, upload/remove attachments on owned tickets, and add/view public comments on owned tickets.
  - `STAFF`: All `REQUESTER` permissions plus access to global IT Staff ticket queue, staff ticket detail, status transitions, staff assignment, IT priority management, public comments, and internal notes.
  - `ADMIN`: All `STAFF` permissions plus access to user list, user creation, user editing, active/inactive toggles, user role management, and password resets.
- **BR-02 (Authentication Token Requirement)**: Every protected API request must include a valid HTTP header `Authorization: Bearer <token>`.
- **BR-03 (Password Security)**: User passwords must be at least 8 characters long, stored in PostgreSQL as cryptographically salted hashes (`bcrypt`/`argon2`). Plain text passwords must never be stored or logged.
- **BR-04 (User Migration Integrity)**: All existing `RequesterUser` records from Lab 2 must be migrated to the unified `User` model with `role = 'REQUESTER'`. Foreign key references (`requesterId`) in `Ticket` must point to `User.id`.
- **BR-05 (Ticket Status Lifecycle Rules)**:
  - Legal status transitions:
    - `NEW` $\rightarrow$ `ASSIGNED`, `IN_PROGRESS`, `CANCELLED`
    - `ASSIGNED` $\rightarrow$ `IN_PROGRESS`, `PENDING_REQUESTER`, `RESOLVED`, `CANCELLED`
    - `IN_PROGRESS` $\rightarrow$ `PENDING_REQUESTER`, `RESOLVED`, `CANCELLED`
    - `PENDING_REQUESTER` $\rightarrow$ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
    - `RESOLVED` $\rightarrow$ `CLOSED`, `IN_PROGRESS` (reopened)
    - `CLOSED` $\rightarrow$ No further transitions allowed (final state).
    - `CANCELLED` $\rightarrow$ No further transitions allowed (final state).
- **BR-06 (Staff Assignment)**: Tickets can only be assigned to active users (`isActive = true`) with role `STAFF` or `ADMIN`.
- **BR-07 (Resolution Requirement)**: Marking a ticket status as `RESOLVED` or `CLOSED` requires a non-empty `resolutionSummary` (minimum 10 characters, max 1000 characters).
- **BR-08 (Internal Note Isolation)**: Comments flagged as `isInternal = true` must NEVER be returned in API responses to users with the `REQUESTER` role.
- **BR-09 (Admin Guardrail)**: The system must reject any attempt to deactivate (`isActive = false`) or demote the last active `ADMIN` user in the system.
- **BR-10 (Email Uniqueness)**: Every user account must have a unique email address (`email` field is unique, trimmed, and converted to lowercase).

---

## 6. Data Model Specification

```prisma
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
  ASSIGNED
  IN_PROGRESS
  PENDING_REQUESTER
  RESOLVED
  CLOSED
  CANCELLED
}

model User {
  id           Int       @id @default(autoincrement())
  name         String
  email        String    @unique
  passwordHash String
  department   String?
  role         Role      @default(REQUESTER)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  submittedTickets Ticket[]        @relation("SubmittedTickets")
  assignedTickets  Ticket[]        @relation("AssignedTickets")
  comments         TicketComment[]
}

model Ticket {
  id                Int             @id @default(autoincrement())
  ticketNumber      String          @unique
  requesterId       Int
  assignedStaffId   Int?
  categoryId        Int
  relatedSystemId   Int
  summary           String
  description       String
  requestedPriority Priority        @default(MEDIUM)
  itPriority        Priority?
  currentStatus     TicketStatus    @default(NEW)
  resolutionSummary String?
  resolvedAt        DateTime?
  closedAt          DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  requester         User            @relation("SubmittedTickets", fields: [requesterId], references: [id])
  assignedStaff     User?           @relation("AssignedTickets", fields: [assignedStaffId], references: [id])
  category          Category        @relation(fields: [categoryId], references: [id])
  relatedSystem     RelatedSystem   @relation(fields: [relatedSystemId], references: [id])
  attachments       Attachment[]
  comments          TicketComment[]

  @@index([ticketNumber])
  @@index([requesterId])
  @@index([assignedStaffId])
  @@index([categoryId])
  @@index([relatedSystemId])
  @@index([currentStatus])
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
}
```

---

## 7. UI & Theme Extensions Summary
The user interface extends the **Zen Green Theme** defined in [`docs/lab-02/ui-spec.md`](../lab-02/ui-spec.md):
- **Role Badges**:
  - Requester: `#2B6CB0` (Subtle Blue)
  - Staff: `#006B3C` (Zen Green)
  - Admin: `#742A2A` (Deep Burgundy / Crimson)
- **IT Priority Badges**:
  - Low: `#2D3748`
  - Medium: `#D69E2E`
  - High: `#DD6B20`
  - Urgent: `#E53E3E`
- **Navigation Shell**: Dynamic navbar presenting items tailored to the user's role (My Tickets for Requester; Staff Queue & My Tickets for Staff; Staff Queue, Admin Users, My Tickets for Admin).
