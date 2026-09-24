# Lab 4 UI Design Specification: Actions Taken, Dashboards, and Zen Green Polish

This document defines the UI/UX specification and design system extensions for TokTickIT Sprint 4.

---

## 1. Design System & Theme Token Extensions

### 1.1. Color Tokens (Zen Green Extensions)
- **Primary Accent**: `#006B3C` (Zen Green Primary)
- **Primary Hover / Focus**: `#004D2B` (Zen Green Dark)
- **Primary Pale Background**: `#E6F4EA` (Soft Green Surface)
- **Background Canvas**: `#F8FAFC` (Slate Canvas Background)
- **Card / Surface**: `#FFFFFF` (Pure White Container)
- **Border Default**: `#E2E8F0` (Subtle Slate Gray)
- **Text Primary**: `#1F2937` (Charcoal / Slate 800)
- **Text Secondary / Muted**: `#4B5563` (Slate 600)
- **Danger / Destructive**: `#C53030` (Crimson Red)
- **Warning / Alert**: `#D69E2E` (Amber Gold)
- **Info / Blue**: `#2B6CB0` (Ocean Blue)

### 1.2. Action Taken Status Badge Tokens
- **COMPLETED**:
  - Background: `#E6F4EA` (Soft Green)
  - Text: `#006B3C` (Dark Green)
  - Border: `1px solid #A3E0BF`
  - Icon: `✓ Completed`
- **IN_PROGRESS**:
  - Background: `#FEFCBF` (Soft Amber)
  - Text: `#B7791F` (Dark Amber)
  - Border: `1px solid #F6E05E`
  - Icon: `⚙ In Progress`
- **PENDING**:
  - Background: `#EBF8FF` (Soft Blue)
  - Text: `#2B6CB0` (Ocean Blue)
  - Border: `1px solid #BEE3F8`
  - Icon: `⏳ Pending`
- **CANCELLED**:
  - Background: `#FFF5F5` (Soft Red)
  - Text: `#C53030` (Dark Red)
  - Border: `1px solid #FEB2B2`
  - Icon: `✕ Cancelled`

### 1.3. Follow-up Badges
- **Follow-up Required**:
  - Badge: `#FEEBC8` background, `#C05621` text (`⚠️ Follow-up Required`)
- **No Follow-up**:
  - Subtle label: `#EDF2F7` background, `#718096` text (`None`)

---

## 2. Screen Component Specifications

### 2.1. IT Staff Dashboard Screen (`/staff/dashboard`)
- **Header / Greeting Area**:
  - Title: "Welcome back, {User Name}!"
  - Subtitle: "Here's what's happening with your queue today."
  - Action: Refresh button (`🔄 Refresh`) with loading spinner.
- **Metric Cards (Row 1)**:
  - **Unassigned Tickets**: Number card with amber highlight (`#D69E2E`), clickable drill-down to `/staff/queue?assignedStaffId=unassigned`.
  - **My Assigned**: Number card with teal highlight (`#006B3C`), clickable drill-down to `/staff/queue?assignedStaffId={userId}`.
  - **In Progress**: Number card with orange highlight (`#DD6B20`), clickable drill-down to `/staff/queue?status=IN_PROGRESS`.
  - **Waiting for Requester**: Number card with purple highlight (`#6B46C1`), clickable drill-down to `/staff/queue?status=WAITING_FOR_REQUESTER`.
  - **Recently Resolved**: Number card with emerald highlight (`#38A169`), clickable drill-down to `/staff/queue?status=RESOLVED`.
- **Content Grid (Row 2)**:
  - **Left Column (Urgent & Recent Tickets)**:
    - Card header with "Urgent Tickets" and "View All" link to `/staff/queue`.
    - Compact table showing Ticket Number, Summary, Status badge, Priority badge, and Created date.
    - Clickable rows navigate directly to Staff Ticket Detail.
  - **Right Column (Quick Actions & Shortcuts)**:
    - "Create Ticket" card with green plus button.
    - "Search Tickets" card with search icon.
    - "My Queue" card linking to user's assigned tickets.
- **Administrator Extension**:
  - Displays a clean "User Management Summary" card with Total Users, Active IT Staff, Active Requesters, and Active Admins with link to `/admin/users`.

---

### 2.2. Requester Dashboard Screen (`/requester/dashboard`)
- **Header / Greeting Area**:
  - Title: "Welcome, {User Name}!"
  - Subtitle: "Here's the latest on your requests."
- **Metric Cards (Row 1)**:
  - **My Open Tickets**: Count of active non-resolved tickets. Drill-down to My Tickets.
  - **In Progress**: Count of tickets actively being investigated.
  - **Resolved**: Count of tickets marked resolved by IT Staff.
  - **Closed**: Count of finalized tickets.
- **Content Grid (Row 2)**:
  - **My Recent Tickets**:
    - List of 5 most recent tickets submitted by the requester.
    - Displays Ticket Number, Summary, Status badge, and Updated timestamp.
    - "View all" link leading to `/my-tickets`.
  - **Quick Actions**:
    - "+ Create Ticket" button leading to Create Ticket form.
    - "📂 View My Tickets" button.

---

### 2.3. Actions Taken on IT Staff Ticket Detail
- **Location**: Prominently placed on `StaffTicketDetail.tsx` right below Ticket Summary/Description and above Comments.
- **Card Container**:
  - Header: "Actions Taken ({count})" with "+ Record Action" primary button.
  - Empty State: "No actions taken recorded yet. Click 'Record Action' to log work performed on this ticket."
- **Actions List / Table**:
  - Columns:
    - **Date & Time**: Formatted local timestamp (`MMM D, YYYY h:mm A`).
    - **Performer**: User name with role pill badge (`IT Staff` / `Admin`).
    - **Description**: Action details.
    - **Result**: Technical outcome of the action.
    - **Status**: Status badge (`COMPLETED`, `IN_PROGRESS`, `PENDING`, `CANCELLED`).
    - **Follow-up**: Flag indicator with follow-up note in tooltip or nested box.
    - **Attachments**: Notes on files/logs if present.
    - **Actions**: "Edit", "Mark Completed", "Cancel Action".
- **Record Action Taken Modal / Form**:
  - Inputs:
    - `Action Date/Time`: Defaults to current datetime (editable datetime-local).
    - `Assignee / Performer`: Dropdown of active IT Staff and Admin members (defaults to current logged-in user).
    - `Action Description`: Textarea (required, min 5 characters).
    - `Result`: Textarea (required, min 3 characters).
    - `Status`: Dropdown (`COMPLETED`, `IN_PROGRESS`, `PENDING`).
    - `Follow-up Required?`: Checkbox.
    - `Follow-up Note`: Textarea, visible and required when `Follow-up Required` is checked.
    - `Attachment / Evidence Notes`: Optional text input.
  - Buttons: "Save Action Taken" (primary green), "Cancel" (secondary outline).
  - Validation: Inline field errors on missing fields; banner error if server rejects.

---

### 2.4. Actions Taken on Requester Ticket Detail
- **Location**: On `TicketDetail.tsx`.
- **Display**:
  - Clean, read-only table/list showing Date/Time, Performer Name, Description, Result, and Follow-up notes.
  - No "Record Action", "Edit", or "Delete" controls are rendered.
  - Explanatory footnote: "Actions Taken are logged by IT Staff to document technical work on your request."

---

### 2.5. Ticket Workflow Status Transitions & Resolution Dialog
- **Dynamic Transition Buttons**:
  - In `StaffTicketDetail.tsx`, status transition controls only render permitted transitions based on current status.
- **Resolution Summary Modal**:
  - Triggered when clicking "Mark as Resolved" or "Close Ticket".
  - Requires minimum 10-character resolution statement.
  - Includes character counter and real-time validation.
- **Conflict Feedback**:
  - If a stale update is detected (HTTP 409), display an amber warning alert:
    "⚠️ This ticket was modified by another user while you were viewing it. Please reload the page to see the latest changes."

---

## 3. Responsive Layout & Accessibility Rules

### 3.1. Breakpoints
- **Mobile (< 768px)**:
  - Metric cards collapse into single column or 2-column grid.
  - Tables convert into card-based list items.
  - Action buttons expand to full width (`w-100`) for easy thumb taps.
- **Tablet (768px - 1024px)**:
  - 2-column or 3-column metric cards.
  - Horizontal scroll container for data tables with shadow indicators.
- **Desktop (> 1024px)**:
  - Full 4 or 5-column metric cards grid.
  - Two-column dashboard layout (65% data tables, 35% quick actions).

### 3.2. Accessibility (WCAG 2.1 AA)
- Minimum color contrast ratio $\ge 4.5:1$ for all text against backgrounds.
- All form inputs include explicit `<label htmlFor="...">` bindings.
- All interactive controls have visible focus rings (`outline: 2px solid #006B3C; outline-offset: 2px`).
- Screen reader announcements via `aria-live="polite"` for dynamic status changes and async alerts.
- Modals trap focus and close on `Escape` key press.
