# Lab 2 UI Specification: Zen Green Theme

This document defines the visual style system, layout rules, component states, and responsive behaviors for TokTickIT Sprint 2.

---

## 1. Design Tokens & Color System

| Token Name | Hex Value | Usage / Semantic Role |
| :--- | :--- | :--- |
| **Primary Green** | `#006B3C` | Application header bar, primary CTA buttons, strong emphasis accents |
| **Secondary Green** | `#0B7A46` | Active navigation indicators, hover states, secondary highlights |
| **Pale Green** | `#EAF6EF` | Selected table rows, badge backgrounds, success callout surfaces |
| **Page Background** | `#F5F7F6` | Clean neutral background for application canvas |
| **Surface / Card** | `#FFFFFF` | Card background with subtle border (`#E5E7EB`) and soft elevation shadow |
| **Text Primary** | `#1F2937` | Dark charcoal-green for high-contrast, comfortable body readability |
| **Text Muted** | `#5B6573` | Secondary metadata, labels, and helper text |
| **Border Neutral** | `#D1D5DB` | Standard input borders and card separators |
| **Border Focused** | `#006B3C` | 2px solid outline ring on focused inputs and buttons |
| **Danger / Error** | `#B3261E` | Validation error text, invalid input borders, destructive buttons |
| **Warning / Urgent** | `#D97706` | High/Urgent priority badges and cautionary alert callouts |
| **Success** | `#2E7D32` | Confirmation banners and resolved status badges |

---

## 2. Typography & Spacing Scale

- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif.
- **Font Sizes**:
  - Heading 1 (Page Title): `1.75rem` (28px), Semi-bold (600)
  - Heading 2 (Card Title): `1.25rem` (20px), Semi-bold (600)
  - Subheading / Section Header: `1.0rem` (16px), Medium (500)
  - Body Text: `0.9375rem` (15px), Regular (400), Line height 1.5
  - Captions & Badges: `0.8125rem` (13px), Medium (500)
  - Validation Messages: `0.8125rem` (13px), Regular (400)
- **Spacing Scale**: Base 4px system (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`).

---

## 3. Component Hierarchy & Button States

| Button Variant | Background | Border | Text Color | Hover / Active State |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `#006B3C` | None | `#FFFFFF` | Background shifts to `#0B7A46` |
| **Secondary** | `#FFFFFF` | `1px solid #006B3C` | `#006B3C` | Background shifts to `#EAF6EF` |
| **Destructive** | `#FFFFFF` | `1px solid #B3261E` | `#B3261E` | Background shifts to `#FDF2F2` |
| **Disabled** | `#E5E7EB` | `1px solid #D1D5DB` | `#9CA3AF` | Cursor `not-allowed`, no hover change |
| **Busy State** | `#006B3C` | None | `#FFFFFF` | Inset animated spinner + disabled cursor |

---

## 4. Screen Layouts & Behaviors

### 4.1. Application Shell & Navigation
- **Top Header Bar**: Background `#006B3C`, containing:
  - Brand Logo & Title: **TokTickIT**
  - Navigation Tabs: *My Tickets*, *Create Ticket* (Active tab marked with `#FFFFFF` bottom underline indicator)
  - Requester Context Badge (Right side): "Logged in as: **[Requester Name]**" + "Change Requester" button.
- **Mobile Navigation**: Collapses into a responsive dropdown menu with accessible tap targets ($\ge 44\text{px}$).

### 4.2. Development Requester Selection Screen ("Simulated Login")
- Centered card on `#F5F7F6` background.
- Heading: **TokTickIT - Development Requester Selection**.
- Explanation Notice: *"Select a Development Requester to test requester-specific ticket behavior. This is a testing mechanism for Lab 2; full authentication will be introduced in Lab 3."*
- Form Elements:
  - Requester Dropdown (populated dynamically from `GET /api/requesters`).
  - Continue Button (Primary variant).
- Feedback States:
  - Loading: Animated skeleton / spinner while fetching requesters.
  - Empty: *"No active requesters found in database."*
  - Failure: Red alert banner with retry button if API fails.

### 4.3. Create Ticket Screen (Create Mode)
- Card container with title: **Submit a New IT Ticket**.
- Field Layout:
  1. **Requester** (Read-only input with soft ivory/gray-green background `#F9FAFB`).
  2. **Category** (Select dropdown with red asterisk `*`).
  3. **Related System** (Select dropdown with red asterisk `*`).
  4. **Requested Priority** (Radio group or Select dropdown: Low, Medium, High, Urgent).
  5. **Summary** (Single-line text input, 5–150 chars, red asterisk `*`).
  6. **Description** (Multiline textarea, min 4 rows, 10–3000 chars, red asterisk `*`).
  7. **Attachments Section**:
     - File input supporting drag-and-drop or file browser.
     - Accepted hint: *"JPG, PNG, WEBP, PDF up to 5 MB (Max 5 files)"*.
     - Selected file preview pills with file size and remove button.
  8. **Action Bar**: Primary "Submit Ticket" button + Secondary "Cancel / Back" button.
- Feedback & Error States:
  - Required fields missing: Red border `#B3261E` around inputs with explicit text below: *"Summary is required (min 5 characters)"*.
  - Backend/Network failure: Safe alert box at top; form fields retain all entered text.
  - Success state: Clean green confirmation card displaying official Ticket Number (e.g. `TCK-20260823-0001`) with links to *"View Ticket Details"* or *"Create Another Ticket"*.

### 4.4. My Tickets Screen (List Mode)
- **Top Control Bar**:
  - Search Input with magnifying glass icon: *"Search by keyword..."*
  - Category Filter dropdown: *All Categories | Account & Access | Hardware | Software | Network*
  - Status Filter dropdown: *All Statuses | New | In Progress | Pending | Resolved | Closed*
  - Priority Filter dropdown: *All Priorities | Low | Medium | High | Urgent*
  - Clear Filters button.
  - "Create Ticket" action button.
- **Desktop Table View ($\ge 992\text{px}$)**:
  - Columns: Ticket Number, Category, Related System, Summary, Priority Badge, Status Badge, Created Date, Actions.
  - Row hover effect: Pale Green highlight (`#EAF6EF`).
  - Clicking any row navigates to Ticket Detail.
- **Mobile Card View ($< 768\text{px}$)**:
  - Stacked cards with Ticket Number and Status Badge at top right, Summary in bold, Category/System in muted metadata text, and Created Date.
- **Pagination Bar**:
  - Previous / Next buttons + Page numbers.
  - Page limit selector (5, 10, 20).
- **Empty / Failure States**:
  - Empty: *"You haven't submitted any tickets yet."* + CTA to *Create Ticket*.
  - No Results: *"No tickets match your search criteria."* + CTA to *Clear Filters*.

### 4.5. Requester Ticket Detail Screen (View Mode) & Attachments
- **Header Summary Card**:
  - Ticket Number & Creation Date.
  - Status Badge & Requested Priority Badge.
  - Read-only fields for Category, Related System, and Requester.
- **Main Content**:
  - Ticket Summary (Heading).
  - Ticket Description (Full rendered text box).
- **Attachments Card**:
  - List of active attachments with icon (image/pdf), file name, size in KB/MB, upload date, **Download** button, and **Remove** button.
  - List of soft-removed attachments displayed with muted style, "Removed" badge, removal reason callout, and disabled download.
  - "Add Attachment" button opening file picker (disabled if 5 active attachments reached).
  - **Soft Removal Confirmation Modal**:
    - Title: *Remove Attachment*.
    - Warning: *"This attachment will be marked as removed and no longer downloadable."*
    - Textarea for Removal Reason (required, 3–255 characters).
    - Buttons: "Confirm Removal" (Destructive) and "Cancel".

---

## 5. Responsive Breakpoint Rules

| Breakpoint | Viewport Width | Layout Behavior |
| :--- | :--- | :--- |
| **Desktop** | $\ge 992\text{px}$ | Multi-column forms (Category & System side-by-side); full table for My Tickets; max-width 1200px centered. |
| **Tablet** | \text{px} - 991\text{px}$ | 2-column forms where practical; compact table with horizontal scroll if needed; summary text wraps cleanly. |
| **Mobile** | $< 768\text{px}$ | Single column stacked fields; My Tickets switches to stacked cards; navigation menu collapses; touch targets $\ge 44\text{px}$. |

---

## 6. Accessibility (WCAG 2.2 AA) & Visual Quality Checklist

- [ ] Every form input has an associated `<label>` element with matching `htmlFor` / `id`.
- [ ] Color is never used as the sole indicator of status or priority (text labels or icons accompany badges).
- [ ] Contrast ratio between text and background exceeds 4.5:1 (Normal text) and 3.0:1 (Large text).
- [ ] Keyboard navigation is fully supported (Tab / Shift+Tab / Enter / Space) with visible 2px outline rings.
- [ ] No horizontal page scrolling occurs at any viewport size down to 320px width.
- [ ] Error messages are announced to screen readers via `aria-live="polite"` or `role="alert"`.
- [ ] All interactive buttons and touch targets meet minimum \times 44\text{px}$ dimensions on mobile.
