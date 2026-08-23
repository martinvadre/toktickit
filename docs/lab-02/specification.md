# Lab 2 Sprint Engineering Specification

## 1. Sprint Goal
Deliver the **Requester Ticket Management** increment of TokTickIT, enabling authenticated testing requesters to select their development identity, submit new IT support tickets with rich classification and file attachments, view and filter their owned tickets with pagination and search, and inspect ticket details with full attachment lifecycle controls (upload, download, soft removal with mandatory reason), all built within the responsive **Zen Green Theme** design system and verified through comprehensive automated tests.

---

## 2. Stakeholder Request Interpretation
The IT Operations team requires a clean, accessible, and user-friendly interface for organization members (Requesters) to report IT incidents and requests. The system must eliminate duplicate or ambiguous submissions by capturing structured categories, affected related systems, descriptive summaries, priority assessments, and supporting diagnostic attachments (up to 5 MB per file, max 5 active). Requesters must be strictly isolated to viewing and managing only their own tickets and attachments. While full authentication and IT staff triage workflows are deferred to Lab 3, a development requester selector is required to test multi-user isolation and ownership enforcement reliably.

---

## 3. Scope

### 3.1. Included in Lab 2
- **Development Requester Context ("Simulated Login")**:
  - PostgreSQL-backed `RequesterUser` model with active/inactive flag.
  - Development Requester selection screen filtering out inactive users.
  - Application shell persistent header displaying the current requester and offering a "Change Requester" action.
  - Dynamic requester switching that reloads all requester-scoped data.
- **Ticket Creation (Create Mode)**:
  - Form capturing Category, Related System, Summary (title), Description, Requested Priority, and initial Attachments.
  - Server-generated official Ticket Number formatted as `TCK-YYYYMMDD-XXXX` (sequential per day or unique cryptographic suffix).
  - Client-side and server-side validation with field-level inline error messages and red asterisks on required fields.
  - Busy submission state and safe error state preserving entered values upon network/backend failure.
  - Creation success state clearly showing the newly assigned Ticket Number.
- **My Tickets Screen (List Mode)**:
  - Paginated, filterable, and sortable list displaying only tickets owned by the active Requester.
  - Keyword search across Summary and Description.
  - Filter by Category, Status (`NEW`, `ASSIGNED`, `IN_PROGRESS`, `PENDING_REQUESTER`, `RESOLVED`, `CLOSED`, `CANCELLED`), and Requested Priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - Sorting by Created Date, Priority, and Status (ascending/descending).
  - Responsive layout: multi-column table on desktop, stacked card view on mobile.
  - Clear loading, empty list, and no-results feedback states.
- **Requester Ticket Detail (View Mode) & Attachment Lifecycle**:
  - Read-only presentation of ticket header metadata and full description.
  - Status and Priority visual badges consistent with the Zen Green Theme.
  - Attachment list showing active attachments (file name, size, upload timestamp, download link).
  - New attachment upload on existing owned tickets (JPG/JPEG, PNG, WEBP, PDF; $\le 5\text{ MB}$; max 5 active attachments).
  - Soft removal of attachments requiring a mandatory user-provided removal reason.
  - Removed attachments retained as read-only audit metadata with blocked download/preview.
  - Backend ownership enforcement returning `403 Forbidden` or `404 Not Found` if a user attempts to view, upload, or download attachments for a ticket owned by another requester.
- **Zen Green Theme & Responsive Design**:
  - Consistent token-based styling across Desktop ($\ge 992\text{px}$), Tablet (\text{px} - 991\text{px}$), and Mobile ($< 768\text{px}$).

### 3.2. Explicitly Excluded from Lab 2
- Full production authentication: Passwords, password hashing, session cookies, JWT login/logout, and password recovery.
- IT Staff and Administrator workflows: Changing ticket status, setting IT Priority, assigning Ticket Owners, creating Service Actions, and viewing administrative audit logs.
- Public comments, internal staff notes, and resolution confirmation workflows.
- Cloud object storage (attachments stored locally on the server filesystem).

---

## 4. Functional Requirements

- **FR-01: Development Requester Selection**: The system shall allow the user to select an active Development Requester before entering ticket screens. Inactive requesters must not appear in the selection list.
- **FR-02: Requester Identity Context**: The application shall display the current requester's name in the header and provide a "Change Requester" action that updates the active context without full page reloads.
- **FR-03: Reference Data Loading**: The ticket creation form shall load active Categories and active Related Systems from PostgreSQL.
- **FR-04: Ticket Creation**: The system shall allow an active Requester to submit a ticket with Category, Related System, Summary, Description, Requested Priority, and optional initial Attachments.
- **FR-05: Ticket Number Generation**: Upon ticket creation, the server shall generate and assign a unique official Ticket Number matching the pattern `TCK-YYYYMMDD-XXXX`.
- **FR-06: Initial Ticket State**: Newly created tickets shall default to `currentStatus = NEW` and `requestedPriority = MEDIUM` (if not explicitly chosen).
- **FR-07: Form Validation**: The client and server shall validate all mandatory fields (Summary, Description, Category, Related System, Requested Priority) and reject invalid inputs with field-specific error messages.
- **FR-08: Failure Recovery**: If ticket submission fails due to an API or network error, the form shall display a visible error banner while preserving all entered form values.
- **FR-09: Requester-Owned Ticket Listing**: The My Tickets screen shall query and display only tickets where `requesterId` matches the currently active Requester.
- **FR-10: Ticket Search**: The system shall filter tickets in real-time or on submit by matching keywords against the ticket Summary and Description.
- **FR-11: Ticket Filtering**: The system shall filter tickets by Category, Status, and Requested Priority.
- **FR-12: Ticket Sorting**: The system shall support sorting tickets by Created Date (`createdAt`), Last Updated (`updatedAt`), and Priority in both ascending and descending order.
- **FR-13: Ticket Pagination**: The system shall paginate ticket lists with configurable limits (e.g. 5, 10, 20 items per page) and provide intuitive previous/next/page navigation.
- **FR-14: Ticket Detail View**: The system shall display the full details of an owned ticket in a clean read-only view. Direct access to a ticket owned by another requester shall be rejected.
- **FR-15: Attachment Upload**: The system shall allow uploading attachments (JPG, PNG, WEBP, PDF; $\le 5\text{ MB}$) during creation and from the Ticket Detail view, enforcing a limit of at most 5 active attachments per ticket.
- **FR-16: Attachment Download**: The system shall allow downloading active attachments belonging to the requester's own tickets.
- **FR-17: Soft Removal of Attachments**: The system shall allow a requester to remove an attachment from their owned ticket by supplying a non-empty removal reason. The attachment status becomes removed, the file is made un-downloadable, but metadata remains visible for auditing.
- **FR-18: Responsive Layout**: All screens (Requester Selector, Create Ticket, My Tickets, Ticket Detail) shall be fully responsive across Desktop, Tablet, and Mobile viewport sizes without horizontal clipping or broken controls.

---

## 5. Business Rules

- **BR-01 (Ownership Isolation)**: A Requester may only list, view, create tickets for, attach files to, and soft-remove attachments from tickets where `requesterId` equals their active ID. Cross-requester access returns `403 Forbidden` or `404 Not Found`.
- **BR-02 (Ticket Number Invariant)**: Every ticket must have a globally unique, immutable, system-generated `ticketNumber` in the format `TCK-YYYYMMDD-XXXX` (e.g., `TCK-20260823-0001`).
- **BR-03 (Default Status)**: Newly created tickets are automatically assigned `currentStatus = 'NEW'`. Requesters cannot manually set or transition ticket status in Lab 2.
- **BR-04 (Field Validation Limits)**:
  - `summary`: Required, trimmed string, minimum 5 characters, maximum 150 characters.
  - `description`: Required, trimmed string, minimum 10 characters, maximum 3000 characters.
  - `categoryId`: Required integer referencing an active `Category`.
  - `relatedSystemId`: Required integer referencing an active `RelatedSystem`.
  - `requestedPriority`: Required enum value (`LOW`, `MEDIUM`, `HIGH`, `URGENT`). Default: `MEDIUM`.
- **BR-05 (Attachment Constraints)**:
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
  - Max file size: Exactly 5,242,880 bytes (5 MB).
  - Max active attachments per ticket: 5. (Removed attachments do not count against the active limit).
  - Safe file storage: Files stored on disk using UUID/sanitized naming to prevent directory traversal and overwrite collisions.
- **BR-06 (Soft Removal Auditability)**: When an attachment is deleted, it is never hard-deleted from the database record. `isRemoved` is set to `true`, `removalReason` (minimum 3 characters, max 255 characters) and `removedAt` timestamp are recorded. Download and preview endpoints must return `410 Gone` or `404 Not Found` for removed attachments.
- **BR-07 (Idempotent Reference Data)**: Categories and Related Systems are reference lookup entities. Only active reference records (`isActive = true`) are selectable in creation forms.

---

## 6. UI Specification Summary
The user interface follows the **Zen Green Theme** defined in [`docs/lab-02/ui-spec.md`](ui-spec.md):
- **Colors**:
  - Primary Green: `#006B3C` (Header bar, Primary CTAs, active highlights)
  - Secondary Green: `#0B7A46` (Active tabs, focus outlines, secondary buttons)
  - Pale Green: `#EAF6EF` (Selected table rows, badge backgrounds, alert callouts)
  - Background: `#F5F7F6` (Neutral light page background)
  - Surface: `#FFFFFF` (Card surfaces with `#E5E7EB` borders)
  - Text: `#1F2937` (Primary body text), `#5B6573` (Muted labels)
  - Validation / Danger: `#B3261E` (Error messages, asterisks, destructive actions)
  - Warning: `#D97706` (High priority badges)
  - Success: `#2E7D32` (Success banners, resolved badges)
- **Component Behaviors**:
  - Labels always above form inputs with red asterisk `*` for required fields.
  - Field-level validation messages rendered directly underneath inputs.
  - Buttons have distinct primary, secondary, destructive, and busy (spinner + disabled) states.
  - Full keyboard accessibility and visible `:focus-visible` outline rings.
  - Desktop layout uses responsive CSS grid / flexbox; mobile switches tables to clean stacked cards.

---

## 7. Data Changes & Prisma Schema

### 7.1. Models & Relationships
1. **`RequesterUser`**: Represents the development requester identity.
   - `id`: Int (PK autoincrement)
   - `name`: String (e.g., "Somchai Prasert")
   - `email`: String (Unique)
   - `department`: String (Optional)
   - `isActive`: Boolean (Default: true)
   - `createdAt`: DateTime (Default: now)
   - `tickets`: Relation  ightarrow N$ `Ticket`
2. **`Category`**: Expanded from Lab 1 with `isActive`.
   - `id`: Int (PK autoincrement)
   - `name`: String (Unique)
   - `isActive`: Boolean (Default: true)
   - `createdAt`: DateTime (Default: now)
   - `tickets`: Relation  ightarrow N$ `Ticket`
3. **`RelatedSystem`**: System/device affected.
   - `id`: Int (PK autoincrement)
   - `name`: String (Unique)
   - `isActive`: Boolean (Default: true)
   - `createdAt`: DateTime (Default: now)
   - `tickets`: Relation  ightarrow N$ `Ticket`
4. **`Ticket`**: Main ticket entity.
   - `id`: Int (PK autoincrement)
   - `ticketNumber`: String (Unique, Indexed)
   - `requesterId`: Int (FK $ightarrow$ `RequesterUser.id`)
   - `categoryId`: Int (FK $ightarrow$ `Category.id`)
   - `relatedSystemId`: Int (FK $ightarrow$ `RelatedSystem.id`)
   - `summary`: String (Length 5-150)
   - `description`: String (Text)
   - `requestedPriority`: Enum `Priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
   - `currentStatus`: Enum `TicketStatus` (`NEW`, `ASSIGNED`, `IN_PROGRESS`, `PENDING_REQUESTER`, `RESOLVED`, `CLOSED`, `CANCELLED`, Default: `NEW`)
   - `createdAt`: DateTime (Default: now)
   - `updatedAt`: DateTime (Updated on change)
   - `attachments`: Relation  ightarrow N$ `Attachment`
5. **`Attachment`**: File metadata & soft removal.
   - `id`: Int (PK autoincrement)
   - `ticketId`: Int (FK $ightarrow$ `Ticket.id`)
   - `fileName`: String (Original uploaded name)
   - `storedFileName`: String (Unique stored name on disk)
   - `fileSize`: Int (Bytes)
   - `mimeType`: String (MIME type)
   - `isRemoved`: Boolean (Default: false)
   - `removalReason`: String? (Optional, populated on delete)
   - `removedAt`: DateTime? (Optional, populated on delete)
   - `createdAt`: DateTime (Default: now)

### 7.2. Seed Data
- **Categories (4)**: `Account and Access`, `Hardware`, `Software`, `Network`.
- **Related Systems (7)**: `Email System`, `Campus Wi-Fi`, `VPN Access`, `LEB2 Learning Platform`, `Grade Submission Portal`, `Network Printer`, `Corporate Laptop`.
- **Requesters (5)**:
  - 4 Active: `Somchai Prasert` (`somchai.pra@kmutt.ac.th`), `Apinya Sukcharoen` (`apinya.suk@kmutt.ac.th`), `Kittisak Rattana` (`kittisak.rat@kmutt.ac.th`), `Nattaporn Chaidee` (`nattaporn.cha@kmutt.ac.th`).
  - 1 Inactive: `Wandee InactiveUser` (`wandee.old@kmutt.ac.th`, `isActive: false`).

---

## 8. API Contract Summary
All endpoints return JSON responses adhering to the standard envelope defined in [`docs/lab-02/api-spec.md`](api-spec.md):
- `GET /api/requesters`: List active development requesters.
- `GET /api/categories`: List active ticket categories.
- `GET /api/related-systems`: List active related systems.
- `POST /api/tickets`: Create a new ticket (validates inputs, generates ticket number, returns 201 Created).
- `GET /api/tickets`: Retrieve requester's tickets with search, filtering, sorting, and pagination.
- `GET /api/tickets/:id`: Retrieve single owned ticket detail with attachments.
- `POST /api/tickets/:id/attachments`: Upload attachment to an owned ticket.
- `GET /api/attachments/:id/download`: Download an active attachment file.
- `DELETE /api/attachments/:id`: Soft-remove an attachment with a mandatory reason.

---

## 9. Acceptance Criteria

- **AC-01 (Requester Selector)**:
  - *Given* PostgreSQL contains active and inactive requesters,
  - *When* a user opens the Development Requester selection screen,
  - *Then* only active requesters are shown in the dropdown, and selecting one stores the active context and navigates to My Tickets.
- **AC-02 (Valid Ticket Submission)**:
  - *Given* an active requester is selected and valid Category, Related System, Summary, Description, and Priority are entered,
  - *When* the user clicks Submit,
  - *Then* the button enters a busy state, the server creates the ticket with status `NEW`, assigns an official `TCK-YYYYMMDD-XXXX` ticket number, and displays a success confirmation.
- **AC-03 (Field Validation & Error Placement)**:
  - *Given* required fields are empty or exceed length limits,
  - *When* the user attempts submission,
  - *Then* client-side validation prevents submission, highlights the invalid fields with red borders, and displays clear error messages directly beneath them.
- **AC-04 (API Error Recovery)**:
  - *Given* the server is unreachable or returns a 500 error during submission,
  - *When* submission fails,
  - *Then* the form displays an alert banner explaining the failure, and all user-entered inputs are preserved without clearing.
- **AC-05 (Attachment Upload Constraints)**:
  - *Given* a user selects a file $> 5\text{ MB}$ or of type `.exe`,
  - *When* selecting or uploading the attachment,
  - *Then* the system rejects the file immediately with a clear explanation (`File size exceeds 5MB` or `Unsupported file type`).
- **AC-06 (My Tickets Ownership & Requester Switch)**:
  - *Given* Requester A has 3 tickets and Requester B has 2 tickets,
  - *When* Requester A is selected,
  - *Then* only Requester A's 3 tickets are displayed in the list.
  - *When* the user switches to Requester B via "Change Requester",
  - *Then* Requester A's tickets disappear and Requester B's 2 tickets are displayed.
- **AC-07 (Search & Filtering)**:
  - *Given* a list of tickets,
  - *When* the user types a keyword into the search bar or selects a category/status filter,
  - *Then* the ticket table updates to show only matching tickets, or displays a "No matching tickets found" empty state if none match.
- **AC-08 (Sorting & Pagination)**:
  - *Given* more tickets than the current page size limit,
  - *When* the user toggles sorting headers or navigates pages,
  - *Then* the correct subset of ordered tickets is fetched and displayed with accurate pagination metadata (`Page X of Y`).
- **AC-09 (Ticket Detail Access Control)**:
  - *Given* Ticket #101 belongs to Requester A,
  - *When* Requester B attempts to fetch or view Ticket #101,
  - *Then* the server returns `403 Forbidden` / `404 Not Found`, and the UI displays an unauthorized access notice.
- **AC-10 (Attachment Soft Removal)**:
  - *Given* an active attachment on an owned ticket,
  - *When* the requester clicks Remove and submits a valid reason ("Uploaded wrong screenshot"),
  - *Then* the attachment metadata displays a "Removed" badge with the recorded reason, and download links/endpoints are permanently disabled.
- **AC-11 (Responsive & Accessibility Standards)**:
  - *Given* any screen at Desktop (1200px), Tablet (768px), and Mobile (375px),
  - *When* viewed and operated via mouse or keyboard,
  - *Then* there is no horizontal scroll, no clipped text, interactive controls are touch-friendly ($\ge 44\text{px}$), and keyboard focus rings are visible.

---

## 10. Definition of Done (DoD)

### Part 1: Product Completion
1. All 5 database models (`RequesterUser`, `Category`, `RelatedSystem`, `Ticket`, `Attachment`) and idempotent seeds are applied via Prisma migrations.
2. All 8 REST API endpoints are implemented with input validation, ownership checks, and standard error envelopes.
3. Development Requester Selector, Create Ticket, My Tickets, and Ticket Detail screens are fully functional and adhere to the Zen Green Theme.
4. Attachment lifecycle (upload, download, max 5 active, $\le 5\text{ MB}$, soft removal with reason) is fully enforced.
5. All planned automated unit, API integration, UI component, and Playwright E2E tests pass cleanly from the documented commands on `main`.
6. No tests are skipped, commented out, or flaky.
7. Responsive layouts verified at Desktop ($\ge 992\text{px}$), Tablet (\text{px}-991\text{px}$), and Mobile ($<768\text{px}$) with no visual bugs.

### Part 2: Course Delivery Requirements
1. Feature implemented across dedicated GitHub Issues using the required Kanban board.
2. Feature branches merged into `lab2-staging` via peer-reviewed Pull Requests with documented approvals in `docs/lab-02/reviewer.md`.
3. Single Release Pull Request from `lab2-staging` merged into `main`.
4. AI prompt log with reflections recorded in `docs/lab-02/ai-use.md`.
5. Final PDF compiled containing Answers to Parts 1 through 9 with readable screenshots and active hyperlinks.

---

## 11. Assumptions and Decisions
- **D-01 (Storage Strategy)**: Local disk storage under `server/uploads/` is used for file attachments in Lab 2, referenced by unique generated disk filenames to avoid naming collisions.
- **D-02 (Requester Header Identification)**: In the absence of session tokens in Lab 2, API requests transmit the selected requester ID via the `x-requester-id` HTTP header.
- **D-03 (Soft Removal Storage Policy)**: Files soft-removed by users remain on disk or flagged in storage for course auditability, but access is blocked by the API layer.
