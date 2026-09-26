# Lab 4 Sprint Engineering Specification: Actions Taken, Dashboards, and Final Regression

## 1. Sprint Goal
Complete the core TokTickIT service-desk workflow by introducing **Actions Taken** by IT Staff under each Ticket, enforcing the authoritative **Ticket Status and Resolution Lifecycle**, delivering role-appropriate operational **Dashboards** for Requesters, IT Staff, and Administrators, and hardening the entire application built across Labs 1 through 3 with robust concurrency conflict handling, full regression verification, and responsive Zen Green design.

---

## 2. Stakeholder Request Interpretation
The IT Service Desk requires a reliable, accountable way to plan, track, and audit actual work performed on support tickets. While a Ticket retains a single primary Ticket Owner responsible for overall coordination, multiple IT Staff members can perform actions on the ticket and record detailed "Actions Taken" entries. Each action entry records the action date/time, action description, result, automated performer (the authenticated staff member or assigned staff), whether follow-up is required, a mandatory follow-up note if required, and optional attachment/reference notes. Furthermore, operational dashboards must provide concise, authoritative metrics and drill-down links for Requesters (tracking open and recently resolved requests) and IT Staff/Administrators (tracking unassigned tickets, queue workload by status/priority, and urgent tickets) without duplicating full list screens. Requesters may advise when an issue appears resolved, but only IT Staff can formally resolve tickets through a verified resolution gate.

---

## 3. Scope

### 3.1. Included in Lab 4
- **Actions Taken Foundation & Management**:
  - Relational database entity `ActionTaken` linked to `Ticket` (parent-child relationship) and `User` (staff performer).
  - Tracking: `actionDateTime`, `actionDescription`, `result`, `performedById` (auto-captured / assigned active staff), `status` (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), `followUpRequired`, `followUpNote`, and `attachmentNotes`.
  - Requesters have read-only visibility into all Actions Taken on their owned tickets.
  - IT Staff and Administrators can list, create, edit, assign, complete, and cancel Actions Taken.
  - Inactive staff assignment rejection.
  - Mandatory follow-up note validation when follow-up is required.
- **Authoritative Ticket Lifecycle & Resolution Gate**:
  - Status progression across `NEW`, `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, and `CANCELLED`.
  - Resolution gate: Transition to `RESOLVED` or `CLOSED` requires an IT Staff resolution summary of at least 10 characters.
  - Requester "indicate-resolved" remains purely advisory and does not automatically transition status to `RESOLVED`.
  - Concurrency control: Stale update detection via ticket `updatedAt` / `version` returning `409 Conflict`.
- **Role-Appropriate Dashboards**:
  - **Requester Dashboard**: Total open tickets, tickets waiting for requester, recently updated tickets, recently resolved tickets, recent ticket list, quick action buttons, drill-down to My Tickets with applied filter parameters.
  - **IT Staff Dashboard**: Unassigned tickets, tickets owned by current user (My Assigned), tickets categorized by status and IT priority, recently updated tickets, urgent tickets list, quick action shortcuts, drill-down to Staff Queue.
  - **Administrator Dashboard**: IT Staff operational metrics plus concise user account counters (total users, active staff, active requesters, active admins).
- **Final Hardening & Regression**:
  - 100% preservation of authentication, authorization, categories, systems, attachments, public comments, internal notes, and user administration from Labs 1–3.
  - Zen Green theme consistency, responsive layouts (desktop, tablet, mobile), keyboard focus, accessibility compliance (semantic HTML, ARIA, high contrast).
  - Safe error handling, optimistic concurrency protection, and input retention on recoverable errors.

### 3.2. Explicitly Excluded from Lab 4
- Automatic SLA clocks, escalation engines, on-call scheduling, and breach notifications.
- Email, SMS, LINE, push, or external notification webhooks.
- Inventory consumption, spare-parts management, purchasing, or service cost accounting.
- Time-sheet billing, payroll integration, or labor-cost calculations.
- Multi-level approval workflows and cryptographic electronic signatures.
- Advanced business intelligence tools, custom report builders, or external data warehouses.
- Multi-tenant enterprise organizations and production cloud infrastructure orchestration.

---

## 4. Functional Requirements

### Actions Taken
- **FR-01 (Actions Taken Persistence)**: The system shall store multiple Action Taken records under a single Ticket with timestamp, description, result, performer, status, follow-up flag, follow-up note, and attachment notes.
- **FR-02 (Staff Action Creation)**: IT Staff and Administrators shall be able to record a new Action Taken on any accessible Ticket.
- **FR-03 (Auto-Performer & Assignee)**: The system shall automatically default the Action Taken performer to the authenticated IT Staff user while allowing assignment to any active IT Staff member.
- **FR-04 (Inactive Staff Rejection)**: The backend shall reject creating or assigning an Action Taken to an inactive or non-staff user with `400 Bad Request`.
- **FR-05 (Follow-Up Note Validation)**: When `followUpRequired` is true, the system shall require a non-empty `followUpNote` of at least 5 characters.
- **FR-06 (Action Taken Modification)**: IT Staff and Administrators shall be able to edit an Action Taken's description, result, status, assignee, and follow-up notes.
- **FR-07 (Action Status Transitions)**: IT Staff shall be able to transition Action Taken status between `PENDING`, `IN_PROGRESS`, `COMPLETED`, and `CANCELLED`.
- **FR-08 (Requester Read-Only Access)**: Requesters shall be able to view all Action Taken records on their owned tickets, but shall have no ability to create, edit, or delete them.

### Ticket Status Workflow & Resolution Gate
- **FR-09 (Permitted Status Transitions)**: The backend shall strictly enforce valid status transitions per the lifecycle matrix, rejecting illegal transitions with `400 Bad Request`.
- **FR-10 (Resolution Summary Gate)**: Transitioning a ticket to `RESOLVED` or `CLOSED` shall mandate a resolution summary of at least 10 characters.
- **FR-11 (Advisory Requester Indication)**: Requester indication that an issue appears resolved shall update `requesterIndicatedResolved = true` without modifying `currentStatus`.
- **FR-12 (Concurrency Conflict Detection)**: The API shall detect stale update attempts by evaluating ticket version/timestamp, returning `409 Conflict` if the record has been modified by another actor.

### Operational Dashboards
- **FR-13 (Requester Dashboard Metrics)**: The API shall calculate authoritative requester metrics: Total Open Tickets, Tickets Waiting for Requester, Recently Updated Tickets, and Recently Resolved Tickets.
- **FR-14 (Requester Dashboard Drill-Down)**: The Requester Dashboard shall provide drill-down links to `/my-tickets` with corresponding query filters.
- **FR-15 (Staff Dashboard Metrics)**: The API shall calculate authoritative IT staff metrics: Unassigned Tickets, My Assigned Tickets, Tickets by Status/Priority, and Recently Updated Tickets.
- **FR-16 (Staff Dashboard Drill-Down)**: The IT Staff Dashboard shall provide drill-down links to `/staff/queue` with status and assignment filters.
- **FR-17 (Admin User Summary)**: The Administrator Dashboard shall provide user account metrics including total users, active staff, active requesters, and active admins.

---

## 5. Business Rules

- **BR-01 (Ticket Ownership of Action Taken)**: An Action Taken belongs to exactly one Ticket. Actions Taken cannot exist independently or be transferred across tickets.
- **BR-02 (Separation of Ticket Coordination and Action Performer)**: The primary Ticket Owner coordinates the overall ticket, but any active IT Staff member may perform an action and record an Action Taken entry.
- **BR-03 (Action Performer Validity)**: An Action Taken must be attributed to an active user with role `STAFF` or `ADMIN`. Assigning an inactive user or a user with role `REQUESTER` is strictly prohibited.
- **BR-04 (Follow-up Completeness)**: If `followUpRequired` is marked true, `followUpNote` is mandatory and must contain actionable guidance. If `followUpRequired` is false, `followUpNote` is optional or null.
- **BR-05 (Action Taken Append & Audit Ordering)**: Actions Taken records are returned in deterministic chronological order (`actionDateTime` ascending or `createdAt` ascending).
- **BR-06 (Permitted Ticket Status Matrix)**:
  - `NEW` $\rightarrow$ `OPEN`, `ASSIGNED`, `IN_PROGRESS`, `CANCELLED`
  - `OPEN` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `ASSIGNED` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `IN_PROGRESS` $\rightarrow$ `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `WAITING_FOR_REQUESTER` $\rightarrow$ `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
  - `RESOLVED` $\rightarrow$ `CLOSED`, `REOPENED`
  - `CLOSED` $\rightarrow$ `REOPENED`
  - `REOPENED` $\rightarrow$ `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
  - `CANCELLED` $\rightarrow$ Terminal (reopen allowed if explicitly permitted)
- **BR-07 (Formal Resolution Gate)**: Only IT Staff and Administrators may transition a ticket to `RESOLVED` or `CLOSED`. A Requester's "problem appears resolved" indicator is advisory and does not alter ticket status.
- **BR-08 (Mandatory Resolution Summary)**: Setting status to `RESOLVED` or `CLOSED` requires an explicit, meaningful `resolutionSummary` ($\ge 10$ characters).
- **BR-09 (Stale Update Detection)**: Ticket updates must specify the expected current `updatedAt` or version. If another user updated the ticket concurrently, the operation must fail safely with HTTP `409 Conflict`.
- **BR-10 (Requester Dashboard Isolation)**: Requester dashboard queries must strictly query only tickets where `requesterId === authenticatedUserId`. No cross-requester operational metrics shall be exposed.
- **BR-11 (Authoritative Dashboard Calculation)**: All dashboard metrics must be calculated in the backend database using authoritative queries, never derived from unpaged client-side collections.

---

## 6. UI Specification Summary
- **Theme & Design System**: Zen Green (#006B3C primary, #E6F4EA surface, #2D3748 slate text) across all screens.
- **Navigation Shell**:
  - Global `Header` includes a **Dashboard** navigation tab for all authenticated users.
  - Active tab highlighting with visible pill/underline cues.
  - Role-specific menus: Requesters see Dashboard, My Tickets, Create Ticket; IT Staff see Dashboard, IT Staff Queue, Create Ticket; Administrators see Dashboard, IT Staff Queue, User Management, Create Ticket.
- **IT Staff Dashboard Screen**:
  - Top greeting banner with operational date/time and quick refresh action.
  - Metric Cards: Unassigned (amber), Open/Assigned (blue), In Progress (primary green), Waiting for Requester (purple), My Assigned (teal).
  - Recent / Urgent Tickets table with one-click navigation to Staff Ticket Detail.
  - Quick Action cards: Create Ticket, Search Tickets, View My Queue.
  - Admin variant: User account overview card showing Total Users, Active Staff, and Active Requesters.
- **Requester Dashboard Screen**:
  - Personal greeting banner and quick summary.
  - Metric Cards: My Open Tickets, In Progress, Waiting for Me, Resolved.
  - Recent Tickets list with status badges and direct click to Ticket Detail.
  - Quick Action shortcuts: Create New Ticket, View All My Tickets.
- **Actions Taken on Ticket Detail**:
  - IT Staff Ticket Detail: Dedicated "Actions Taken" card/table showing Date/Time, Description, Result, Performed By badge, Status badge (`COMPLETED`, `PENDING`, `CANCELLED`), Follow-Up tag, and Actions menu (Edit, Complete, Cancel).
  - "Record Action Taken" button opening modal/inline form with real-time validation.
  - Requester Ticket Detail: Read-only Actions Taken list clearly formatted without editing controls.
- **Responsive Behavior**:
  - Desktop (>1024px): Multi-column grids and data tables.
  - Tablet (768px–1024px): 2-column metric cards, responsive tables with horizontal scroll wrap.
  - Mobile (<768px): Single-column stacked cards, full-width touch-friendly buttons ($\ge 44$px touch targets).

---

## 7. Data Changes & Justifications

### 7.1. Database Model Evolution (`schema.prisma`)
```prisma
enum ActionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model ActionTaken {
  id                Int          @id @default(autoincrement())
  ticketId          Int
  actionDateTime    DateTime     @default(now())
  actionDescription String
  result            String
  performedById     Int
  status            ActionStatus @default(COMPLETED)
  followUpRequired  Boolean      @default(false)
  followUpNote      String?
  attachmentNotes   String?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  ticket            Ticket       @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  performedBy       User         @relation("ActionsPerformed", fields: [performedById], references: [id])

  @@index([ticketId])
  @@index([performedById])
  @@index([status])
}
```

### 7.2. Ticket Concurrency & Relationship Enhancements
- In `Ticket`:
  - `actionsTaken ActionTaken[]` relation.
  - Concurrency validation on `updatedAt` for optimistic conflict prevention.
- In `User`:
  - `actionsPerformed ActionTaken[] @relation("ActionsPerformed")`

### 7.3. Database Design Justifications
1. **Separation of `ActionTaken` from `TicketComment`**: While comments and notes represent textual discussion and internal observations, Actions Taken represent formal units of technical labor with structured outcome data (`result`), completion status, follow-up flags, and attachment references. Retaining them as a distinct first-class model ensures clean parent-child foreign keys, efficient indexing for dashboard queries, and auditability without polluting freeform comment threads.
2. **Nullable `followUpNote` with conditional validation**: Storing `followUpNote` as a nullable field avoids storing arbitrary placeholder text when follow-up is not required, while the application layer strictly enforces that `followUpRequired === true` requires a non-empty `followUpNote`.
3. **Compound indexes on `ticketId` and `status`**: Optimizes retrieval of actions for a given ticket and facilitates dashboard queries filtering for active follow-up actions.

### 7.4. Migration & Backfill Strategy
- All existing tickets from Labs 1–3 remain completely valid without modification. Legacy tickets simply have zero `ActionTaken` rows.
- The migration is non-destructive and backward-compatible.

---

## 8. REST API Contract Summary

| Method | Endpoint | Authorized Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets/:id/actions-taken` | `REQUESTER`, `STAFF`, `ADMIN` | Fetch all actions taken for a ticket (Requesters must own ticket) |
| `POST` | `/api/staff/tickets/:id/actions-taken` | `STAFF`, `ADMIN` | Create and record a new Action Taken |
| `PATCH` | `/api/staff/tickets/:id/actions-taken/:actionId` | `STAFF`, `ADMIN` | Update an existing Action Taken |
| `PATCH` | `/api/staff/tickets/:id/status` | `STAFF`, `ADMIN` | Status transition with resolution gate and conflict detection |
| `GET` | `/api/requester/dashboard` | `REQUESTER` | Fetch authenticated Requester dashboard metrics and recent tickets |
| `GET` | `/api/staff/dashboard` | `STAFF`, `ADMIN` | Fetch IT Staff operational dashboard metrics and urgent tickets |
| `GET` | `/api/admin/dashboard` | `ADMIN` | Fetch Staff dashboard metrics + Administrator user summary metrics |

---

## 9. Acceptance Criteria

- **AC-01 (Create Action Taken)**: Given an authenticated IT Staff user, when posting valid action data to `/api/staff/tickets/:id/actions-taken`, then the Action Taken is created under the specified ticket with authenticated user as creator and active staff as performer.
- **AC-02 (Follow-Up Note Validation)**: Given an Action Taken creation request with `followUpRequired = true` and an empty `followUpNote`, when submitted, then the API returns `400 Bad Request` with an explanatory error.
- **AC-03 (Inactive Assignee Rejection)**: Given an Action Taken creation or edit request targeting a deactivated staff member, when submitted, then the API rejects the request with `400 Bad Request`.
- **AC-04 (Requester Read-Only Visibility)**: Given an authenticated Requester viewing an owned ticket, when requesting actions taken, all recorded actions are returned, but write operations are rejected with `403 Forbidden`.
- **AC-05 (Action Taken Status Transition)**: Given an existing Action Taken, when IT Staff updates its status to `COMPLETED` or `CANCELLED`, then the updated status is persisted and returned.
- **AC-06 (Permitted Ticket Transitions)**: Given a ticket in `OPEN` status, when IT Staff transitions to `IN_PROGRESS` or `WAITING_FOR_REQUESTER`, then the status is successfully updated.
- **AC-07 (Illegal Ticket Transition)**: Given a ticket in `NEW` status, when a transition directly to `RESOLVED` is attempted, then the API rejects the transition with `400 Bad Request`.
- **AC-08 (Resolution Gate Enforcement)**: Given a ticket transitioning to `RESOLVED` or `CLOSED`, when `resolutionSummary` is missing or under 10 characters, then the API rejects the request with `400 Bad Request`.
- **AC-09 (Advisory Requester Resolution)**: Given a requester marking `indicate-resolved`, the ticket property `requesterIndicatedResolved` becomes true, but `currentStatus` does not change to `RESOLVED`.
- **AC-10 (Stale Update Conflict)**: Given an outdated ticket version/timestamp in a status update request, when the ticket has already been updated in the database, then the API returns `409 Conflict`.
- **AC-11 (Requester Dashboard Isolation)**: Given an authenticated Requester calling `GET /api/requester/dashboard`, the returned metrics reflect exclusively tickets submitted by that Requester.
- **AC-12 (Staff Dashboard Accuracy)**: Given an authenticated Staff member calling `GET /api/staff/dashboard`, the returned counts for unassigned, my assigned, and status groups match actual database queries.
- **AC-13 (Admin Dashboard Extension)**: Given an authenticated Administrator calling `GET /api/admin/dashboard`, the response includes valid operational metrics plus user account counts.

---

## 10. Definition of Done
1. [x] Sprint 4 specification, UI specification, API contract, and test matrix documented in `docs/lab-04/`.
2. [x] Prisma schema updated with `ActionTaken` model and `ActionStatus` enum, migrated and seeded with realistic multi-action tickets.
3. [x] Actions Taken REST endpoints implemented with role authorization, inactive staff rejection, and follow-up validation.
4. [x] Actions Taken UI implemented in IT Staff Ticket Detail (list, create, edit, complete, cancel) and Requester Ticket Detail (read-only).
5. [x] Authoritative Ticket Status transition matrix and resolution gate enforced in backend and frontend.
6. [x] Requester, IT Staff, and Administrator operational dashboards implemented with accurate backend queries and drill-down links.
7. [x] Automated test suites implemented across unit, API, component, and E2E suites with 100% pass rate.
8. [x] Zero regression in authentication, requester ticket management, attachments, public comments, internal notes, and admin user management.
9. [x] Peer review completed and recorded in `reviewer.md`.
10. [x] AI transparency log completed in `ai-use.md`.
11. [x] Final concise report PDF and DOCX generated adhering to Answer Parts 1–9.

---

## 11. Assumptions and Decisions
- **Action Date/Time Default**: `actionDateTime` defaults to the current UTC timestamp if omitted, but may be specified by the user to record work completed earlier in the day.
- **Action Taken Status**: Actions Taken include four distinct lifecycle states: `PENDING` (planned work), `IN_PROGRESS` (ongoing investigation), `COMPLETED` (work performed), and `CANCELLED` (abandoned task).
- **Concurrency Strategy**: Status updates accept an optional `expectedUpdatedAt` timestamp. If provided and mismatched with the database record, `409 Conflict` is returned. If omitted, the update succeeds normally for backward compatibility.
- **Dashboard Refresh**: Dashboards calculate metrics dynamically on request, ensuring zero stale caching without needing complex WebSockets or polling infrastructure.
