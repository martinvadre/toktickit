# Lab 2 - Peer Review Record

**Author:** Pawarit Wongdaeng 67070503466 - **GitHub:** @martinvadre  
**Peer reviewer:** Tatchakorn Thamnimitr 67070503415 - **GitHub:** @Magiciancat9  

---

## 1. Pull Requests I Authored

| PR | Feature Branch | Summary & Deliverables | Reviewer Verdict |
| :--- | :--- | :--- | :--- |
| **[#20](https://github.com/martinvadre/toktickit/pull/20)** | `feature/5-spec-and-tests` | Lab 2 Engineering Specification, REST API Contract, Zen Green UI Spec, and Test Plan | Approved by @Magiciancat9 |
| **[#21](https://github.com/martinvadre/toktickit/pull/21)** | `feature/6-requester-context` | Development Requester Context, Prisma database schema, seeds, and Zen Green CSS tokens | Approved by @Magiciancat9 |
| **[#22](https://github.com/martinvadre/toktickit/pull/22)** | `feature/7-create-ticket` | Ticket creation workflow (`POST /api/tickets`, `TCK-YYYYMMDD-XXXX`), inline validation, error recovery | Approved by @Magiciancat9 |
| **[#24](https://github.com/martinvadre/toktickit/pull/24)** | `feature/8-my-tickets` | My Tickets screen with ownership isolation (`x-requester-id`), search, filters, pagination | Approved by @Magiciancat9 |
| **[#25](https://github.com/martinvadre/toktickit/pull/25)** | `feature/9-ticket-detail-and-attachments` | Requester ticket detail view, attachment upload/download, 403 rejection, and soft-removal modal | Approved by @Magiciancat9 |

---

## 2. Review Comments Received and My Responses

### Sprint Specification and Test Plan - PR #20
**@Magiciancat9 commented:**
> Specification is very thorough and covers all requirements including Zen Green palette and test traceability matrix. Looks good to merge.

**My response:**
> Thank you for reviewing the engineering specs and test matrix! Merging into `lab2-staging`.

---

### Requester Context and Database Schema - PR #21
**@Magiciancat9 commented:**
> Database schema and seed data match the requirements accurately. Development requester selector works smoothly and persists context. Approved.

**My response:**
> Thanks! Verified active requester filtering and localStorage persistence. Merging now.

---

### Ticket Creation (Create Mode) - PR #22
**@Magiciancat9 commented:**
> Verified ticket number format `TCK-YYYYMMDD-XXXX` and initial `NEW` status. Red asterisks and inline field errors display correctly on empty submit, and entered data is preserved on API failure. Good work.

**My response:**
> Thank you! All backend and frontend unit tests passed. Merging to proceed to My Tickets.

---

### My Tickets with Search and Pagination - PR #24
**@Magiciancat9 commented:**
> Requester isolation is strictly enforced; tickets belonging to other requesters do not appear. Search, category filter, and desktop/mobile views look great. Approved.

**My response:**
> Thanks for verifying the multi-requester ownership boundaries! Merged.

---

### Ticket Detail and Attachment Lifecycle - PR #25
**@Magiciancat9 commented:**
> Attachment upload constraints (<= 5MB, format whitelist, max 5 active files) and soft removal modal with mandatory reason work as expected. 410 Gone blocking on removed files verified. Approving.

**My response:**
> Thank you for the comprehensive review and testing! Merged to finalize Sprint 2 features.

---

## 3. Pull Requests I Reviewed for My Partner

| PR | Feature Branch | Feature Description | My Verdict |
| :--- | :--- | :--- | :--- |
| **[#13](https://github.com/Magiciancat9/toktickit/pull/13)** | `feature/5-spec-and-tests` | Lab 2 engineering specifications and test plan documentation | Approved |
| **[#14](https://github.com/Magiciancat9/toktickit/pull/14)** | `feature/6-requester-context` | Requester context selection, Prisma schema, and seed data | Approved |
| **[#15](https://github.com/Magiciancat9/toktickit/pull/15)** | `feature/7-create-ticket` | Ticket creation form, validation, and ticket number generator | Approved |
| **[#16](https://github.com/Magiciancat9/toktickit/pull/16)** | `feature/8-my-tickets` | My Tickets screen with pagination, search, and filter controls | Approved |
| **[#17](https://github.com/Magiciancat9/toktickit/pull/17)** | `feature/9-ticket-detail-and-attachments` | Ticket detail view and attachment soft-removal lifecycle | Approved |

---

## 4. My Review Comments and Partner Responses

### Partner PR #13 - Specification and Test Plan
**My review:**
> Comprehensive documentation covering functional requirements, API contracts, and Zen Green UI layout. Approved.

---

### Partner PR #14 - Requester Context and Database Schema
**My review:**
> Database relationships and seed records verified. Inactive user filtering correctly implemented. Approved.

---

### Partner PR #15 - Ticket Creation
**My review:**
> Validated ticket number sequential format and field-level validation errors. Form value preservation on error verified. Approved.

---

### Partner PR #16 - My Tickets List
**My review:**
> Strict requester isolation tested and verified. Search filtering and pagination behave properly. Approved.

---

### Partner PR #17 - Ticket Detail and Attachments
**My review:**
> Attachment constraints and soft removal audit trail with mandatory reason verified. 410 Gone download block works as required. Approved.
