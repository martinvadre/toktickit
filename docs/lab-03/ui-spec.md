# Lab 3 UI Design Specification

This document defines the UI/UX specification and design system extensions for TokTickIT Sprint 3 (Zen Green Theme Extensions for Authentication, Staff Operations, and Admin Management).

---

## 1. Design System & Theme Token Extensions

### 1.1. Color Tokens (Zen Green Extensions)
- **Primary Accent**: `#006B3C` (Zen Green Primary)
- **Primary Hover**: `#004D2B` (Zen Green Dark)
- **Background Layer**: `#F8FAFC` (Slate Light Background)
- **Card Background**: `#FFFFFF` (Pure White Container)
- **Border Default**: `#E2E8F0` (Border Light Gray)

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
  - `ASSIGNED`: Purple badge (`#FAF5FF` bg, `#6B46C1` text)
  - `IN_PROGRESS`: Amber badge (`#FEFCBF` bg, `#B7791F` text)
  - `PENDING_REQUESTER`: Orange badge (`#FEEBC8` bg, `#C05621` text)
  - `RESOLVED`: Emerald badge (`#E6F4EA` bg, `#006B3C` text)
  - `CLOSED`: Slate badge (`#EDF2F7` bg, `#4A5568` text)
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
- **Development Demo Helper**: Quick-select buttons for pre-populated test accounts (Requester, Staff, Admin) to streamline manual grading and automated verification.

---

### 2.2. Header & Role-Aware Navigation Bar
- **App Header**:
  - Brand Logo & Title (`martinvadre / TokTickIT`).
  - Active User Identity Capsule: User Name, Email, and color-coded Role Badge (`REQUESTER`, `STAFF`, `ADMIN`).
  - Logout Button with confirmation modal or direct action.
- **Dynamic Role Navigation**:
  - **Requester View**: `[ My Tickets ]` `[ Create Ticket ]`
  - **IT Staff View**: `[ IT Staff Queue ]` `[ My Tickets ]` `[ Create Ticket ]`
  - **Admin View**: `[ IT Staff Queue ]` `[ User Management ]` `[ My Tickets ]` `[ Create Ticket ]`

---

### 2.3. IT Staff Ticket Queue Screen (`/staff/queue`)
- **Filter Toolbar**:
  - Global Search input (matches Ticket #, Summary, Requester, Description).
  - Multi-select dropdowns for Status, Category, System, Staff Assignee, Requested Priority, IT Priority.
  - Clear Filters button.
- **Desktop Table View ($\ge 992\text{px}$)**:
  - Columns: Ticket #, Requester, Summary, Status, IT Priority, Assignee, Created Date, Actions.
  - Sorting indicators on header click ($\uparrow / \downarrow$).
- **Mobile Card View ($< 992\text{px}$)**:
  - Stacked cards with Ticket #, Requester avatar badge, Summary snippet, side-by-side Status and IT Priority badges, and quick-action view button.
- **Pagination Footer**: Showing total record count, items per page selector (5, 10, 20), page jump buttons.

---

### 2.4. IT Staff Ticket Detail & Operations Screen (`/staff/tickets/:id`)
- **Header Banner**: Ticket #, Summary title, Status badge, Requester department banner.
- **Quick Operations Panel**:
  - Status Select dropdown (triggers Resolution Summary modal when selecting `RESOLVED` or `CLOSED`).
  - Assignee Select dropdown (active Staff/Admin users list).
  - IT Priority selector.
- **Ticket Content Grid**:
  - Full description panel with formatted text.
  - Active Attachments list with download button and file size badge.
- **Comments & Collaboration Feed**:
  - Tabbed or split view: **Public Comments** vs **Internal Staff Notes**.
  - Internal Staff Notes rendered with distinct lock icon banner (`#FFF5F5` background, `#C53030` left border) to make internal notes immediately identifiable.
  - Comment box with toggle switch: `[ ] Make this an internal staff note (hidden from requester)`.

---

### 2.5. Admin User Management Screen (`/admin/users`)
- **Header & Action Bar**:
  - Page title: "User Management".
  - Filter bar: Search input (Name/Email/Department), Role Filter (`ALL`, `REQUESTER`, `STAFF`, `ADMIN`), Active Status filter (`ALL`, `Active`, `Inactive`).
  - Primary Action Button: `+ Add New User`.
- **User Data Table / Grid**:
  - Columns: Name, Email, Department, Role Badge, Active Status Toggle Switch, Actions (`Edit`, `Reset Password`).
- **Modals**:
  - **Add User Modal**: Input fields for Name, Email, Department, Role, Initial Password.
  - **Edit User Modal**: Input fields for Name, Department, Role select, Active status switch.
  - **Reset Password Modal**: User summary details, New Password input, password strength indicator.
