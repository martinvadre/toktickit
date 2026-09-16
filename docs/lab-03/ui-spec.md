# Lab 3 UI Design Specification

This document defines the UI/UX specification and design system extensions for TokTickIT Sprint 3 (Zen Green Theme Extensions for Authentication, Staff Operations, and Admin Management).

---

## 1. Design System & Theme Token Extensions

### 1.1. Color Tokens (Zen Green Extensions)
- **Primary Accent**: `#006B3C` (Zen Green Primary)
- **Primary Hover**: `#004D2B` (Zen Green Dark)
- **Primary Pale Background**: `#E6F4EA` (Soft Green)
- **Background Layer**: `#F8FAFC` (Slate Light Background)
- **Card Background**: `#FFFFFF` (Pure White Container)
- **Border Default**: `#E2E8F0` (Border Light Gray)
- **Text Primary**: `#1F2937` (Charcoal / Slate 800)
- **Text Muted**: `#6B7280` (Gray 500)
- **Danger / Destructive**: `#C53030` (Red 700)
- **Warning**: `#D69E2E` (Amber 600)

### 1.2. Role Badge Tokens
- **Requester (`REQUESTER`)**:
  - Background: `#EBF8FF`
  - Text Color: `#2B6CB0`
  - Border Color: `#BEE3F8`
- **IT Staff (`STAFF`)**:
  - Background: `#E6F4EA`
  - Text Color: `#006B3C`
  - Border Color: `#A3E0BF`
- **Administrator (`ADMIN`)**:
  - Background: `#FFF5F5`
  - Text Color: `#C53030`
  - Border Color: `#FEB2B2`

### 1.3. Ticket Status & Priority Badges
- **Status Tokens**:
  - `NEW`: Blue badge (`#EBF8FF` bg, `#2B6CB0` text)
  - `OPEN` / `ASSIGNED`: Purple badge (`#FAF5FF` bg, `#6B46C1` text)
  - `IN_PROGRESS`: Amber badge (`#FEFCBF` bg, `#B7791F` text)
  - `WAITING_FOR_REQUESTER` / `PENDING_REQUESTER`: Orange badge (`#FEEBC8` bg, `#C05621` text)
  - `RESOLVED`: Emerald badge (`#E6F4EA` bg, `#006B3C` text)
  - `CLOSED`: Slate badge (`#EDF2F7` bg, `#4A5568` text)
  - `REOPENED`: Indigo badge (`#EBF4FF` bg, `#4C51BF` text)
  - `CANCELLED`: Red badge (`#FFF5F5` bg, `#C53030` text)
- **IT Priority Tokens**:
  - `LOW`: `#EDF2F7` bg, `#4A5568` text
  - `MEDIUM`: `#FEFCBF` bg, `#D69E2E` text
  - `HIGH`: `#FEEBC8` bg, `#DD6B20` text
  - `URGENT`: `#FFF5F5` bg, `#E53E3E` text, pulse indicator icon

---

## 2. Screen Component Specifications

### 2.1. Authentication Screen (`/login`)
- **Layout**: Centered card layout on soft background (`#F8FAFC`).
- **Header**: TokTickIT Logo, Zen Green branding title, subtitle ("Sign in to your IT Service Desk account").
- **Form Controls**:
  - Email address input (with validation feedback).
  - Password input (with toggle show/hide visibility).
  - "Sign In" primary button (`#006B3C`, full width).
  - "Forgot your password?" helper link.
- **Development Demo Helper**: Quick-select buttons for pre-populated test accounts (Requester, Staff, Admin) to streamline manual grading and automated verification.
- **Feedback & Validation**: Inline error banners for invalid credentials or disabled accounts (`isActive = false`).

---

### 2.2. Mandatory Change Password Screen (`/change-password`)
- **Layout**: Centered card layout matching `/login`.
- **Header**: "Change Your Password", subtext: "You must change your password to continue."
- **Form Controls**:
  - Current (temporary) password input (with eye toggle).
  - New password input (with eye toggle).
  - Confirm new password input (with eye toggle).
  - Dynamic Password Requirements Checklist:
    - [x] At least 8 characters
    - [x] Include upper and lower case letters
    - [x] Include a number and a special character
  - "Continue" primary button (`#006B3C`, full width).
- **Navigation Guard**: Users with `mustChangePassword = true` are intercepted by router guards and redirected to `/change-password` until the password change is successfully completed.

---

### 2.3. Header & Role-Aware Navigation Bar
- **App Header**:
  - Brand Logo & Title (`martinvadre / TokTickIT`).
  - Active User Identity Capsule: User Name, Email, and color-coded Role Badge (`REQUESTER`, `STAFF`, `ADMIN`).
  - Logout Button with confirmation or immediate session purge.
- **Dynamic Role Navigation**:
  - **Requester View**: `[ My Tickets ]` `[ Create Ticket ]`
  - **IT Staff View**: `[ IT Staff Queue ]` `[ My Tickets ]` `[ Create Ticket ]`
  - **Admin View**: `[ IT Staff Queue ]` `[ User Management ]` `[ My Tickets ]` `[ Create Ticket ]`

---

### 2.4. IT Staff Ticket Queue Screen (`/staff/queue`)
- **Filter Toolbar**:
  - Global Search input (matches Ticket #, Summary, Requester, Description).
  - Multi-select dropdowns for Status, Category, System, Staff Assignee, Requested Priority, IT Priority.
  - "Clear Filters" button.
- **Desktop Table View ($\ge 992\text{px}$)**:
  - Columns: Ticket No., Created Date, Summary, Category, Req. Priority, IT Priority, Status, Owner, Actions.
  - Sorting indicators on sortable header columns ($\uparrow / \downarrow$).
- **Mobile Card View ($< 992\text{px}$)**:
  - Stacked cards with Ticket No., Requester avatar badge, Summary snippet, side-by-side Status and IT Priority badges, and quick-action view button.
- **Pagination Footer**: Showing total record count, items per page selector (5, 10, 20), and Previous/Next page buttons.

---

### 2.5. IT Staff Ticket Detail & Operations Screen (`/staff/tickets/:id`)
- **Header Banner**: Back to Queue button, Ticket Number, Summary heading, Status badge.
- **Quick Operations Panel**:
  - Status Select dropdown (selecting `RESOLVED` or `CLOSED` opens the Resolution Summary modal requiring $\ge 10$ characters).
  - Ticket Owner / Assignee dropdown (lists active Staff/Admin users with "Claim Ticket" shortcut).
  - IT Priority selector (Low, Medium, High, Urgent).
- **Ticket Content Grid**:
  - Full description panel with metadata (Category, Related System, Requester info, Created/Updated dates).
  - Active Attachments list with download action and file size badge.
- **Comments & Collaboration Feed**:
  - Split or tabbed timeline: **Public Comments** vs **Internal Notes**.
  - Internal Notes rendered with distinct lock icon banner (`#FFF5F5` background, `#C53030` left border) so internal communication is never mistaken for public remarks.
  - Comment box with toggle checkbox: `[ ] Make this an internal staff note (hidden from requester)`.

---

### 2.6. Requester Ticket Detail Screen (`/tickets/:id`) Updates
- **Public Comments**: Requesters can view public comments and submit new public remarks.
- **Problem Appears Resolved**: A dedicated action / checkbox allowing the Requester to indicate that their issue appears resolved (`requesterIndicatedResolved = true`), displaying an alert banner to IT Staff while leaving formal status progression to Staff.

---

### 2.7. Admin User Management Screen (`/admin/users`)
- **Header & Action Bar**:
  - Title: "User Management".
  - Search input: filter users by Name or Email.
  - Role filter dropdown (`ALL`, `REQUESTER`, `STAFF`, `ADMIN`).
  - Primary button: `+ Create User`.
- **User Data Table**:
  - Columns: Name, Email, Role Badge, Status Badge (`Active` / `Inactive`), Actions (`Edit`, `Set Initial Password`).
- **Modals / Side Panels**:
  - **Create New User**: Inputs for Full Name, Email, Role dropdown (`Requester`, `IT Staff`, `Administrator`), Active toggle, and Initial Password (with option "User will change password on first login").
  - **Edit User**: Inputs for Name, Email, Role, and Active switch. Guardrail: Disable deactivation toggle if editing the active user's own account or if the user is the last active Administrator.
  - **Set Initial Password**: Reset dialog setting a new temporary password and setting `mustChangePassword = true`.

---

## 3. Responsive Breakpoints & Accessibility (WCAG 2.2 AA)
- **Breakpoints**:
  - Mobile: $< 768\text{px}$ (single-column cards, full-width inputs, touch targets $\ge 44\text{px}$).
  - Tablet: $768\text{px} - 991\text{px}$ (adaptive grid, scrollable data tables).
  - Desktop: $\ge 992\text{px}$ (multi-column tables, fixed side panels).
- **Accessibility**:
  - All interactive elements possess explicit `aria-label` or visible labels.
  - Contrast ratios exceed $4.5:1$ for body text and $3.0:1$ for large text/badges against their backgrounds.
  - Focus rings utilize Zen Green (`#006B3C`) with 2px offset.
