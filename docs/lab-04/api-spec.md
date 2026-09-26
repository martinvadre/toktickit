# Lab 4 REST API Specification: Actions Taken, Dashboards, and Workflow

This document defines the REST API contract for TokTickIT Sprint 4 (Actions Taken, Dashboards, and Final Regression).

---

## 1. General Conventions

### 1.1. Base URL & Authentication Protocol
- All endpoints are prefixed with `/api`.
- Protected endpoints require an HTTP Authorization header containing a valid JWT token:
  ```http
  Authorization: Bearer <jwt_token>
  ```

### 1.2. Role-Based Access Enforcement
- `REQUESTER`: Can access own tickets, own dashboard, and view actions taken on owned tickets. Write access to actions taken or staff dashboards is rejected with `403 Forbidden`.
- `STAFF`: Can access all requester endpoints, shared staff queue, ticket operations, create/update actions taken, and staff dashboard.
- `ADMIN`: Can access all endpoints including staff operations, admin user management, and admin dashboard.

### 1.3. Standard Error Envelope
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed error message.",
    "fieldErrors": [
      { "field": "followUpNote", "message": "Follow-up note is required when follow-up is needed." }
    ]
  }
}
```

Standard Error Codes in Lab 4:
- `VALIDATION_ERROR` (400 Bad Request)
- `INVALID_ASSIGNEE` (400 Bad Request - inactive or non-staff user)
- `INVALID_STATUS_TRANSITION` (400 Bad Request)
- `RESOLUTION_SUMMARY_REQUIRED` (400 Bad Request)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)
- `NOT_FOUND` (404 Not Found)
- `STALE_UPDATE_CONFLICT` (409 Conflict - concurrent update detected)
- `INTERNAL_SERVER_ERROR` (500 Internal Server Error)

---

## 2. Actions Taken Endpoints

### 2.1. `GET /api/tickets/:id/actions-taken`
Retrieve all Actions Taken for a specific ticket.
- **Access Level**: `REQUESTER` (owned tickets only), `STAFF`, `ADMIN`
- **Path Parameters**: `id` (integer ticket ID)
- **Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": 1,
      "ticketId": 101,
      "actionDateTime": "2026-09-24T08:30:00.000Z",
      "actionDescription": "Inspected network switch ports and tested cabling continuity.",
      "result": "Discovered faulty patch cable on port 14; replaced with Cat6 cable.",
      "performedBy": {
        "id": 2,
        "name": "Supachai Staff",
        "email": "staff.supachai@kmutt.ac.th",
        "role": "STAFF"
      },
      "status": "COMPLETED",
      "followUpRequired": true,
      "followUpNote": "Monitor ping latency for 24 hours to ensure connection stability.",
      "attachmentNotes": "Cable test diagnostic log saved locally.",
      "createdAt": "2026-09-24T08:30:00.000Z",
      "updatedAt": "2026-09-24T08:30:00.000Z"
    }
  ]
}
```
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: Requester does not own this ticket.
  - `404 Not Found`: Ticket does not exist.

---

### 2.2. `POST /api/staff/tickets/:id/actions-taken`
Record a new Action Taken under a Ticket.
- **Access Level**: `STAFF`, `ADMIN`
- **Path Parameters**: `id` (integer ticket ID)
- **Request Body**:
```json
{
  "actionDateTime": "2026-09-24T09:00:00.000Z",
  "actionDescription": "Replaced RAM module on user workstation.",
  "result": "System successfully booted into OS with 32GB detected.",
  "performedById": 3,
  "status": "COMPLETED",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "Diagnostics report memory_pass.log"
}
```
*Note: `performedById` defaults to authenticated user if omitted. `status` defaults to `COMPLETED` if omitted.*
- **Validation Rules**:
  - `actionDescription`: String, non-empty, min 5 chars, max 2000 chars.
  - `result`: String, non-empty, min 3 chars, max 2000 chars.
  - `performedById`: Must refer to an active user with role `STAFF` or `ADMIN`.
  - `followUpRequired`: Boolean.
  - `followUpNote`: Required (min 5 chars) if `followUpRequired === true`.
- **Success Response (201 Created)**:
```json
{
  "data": {
    "id": 2,
    "ticketId": 101,
    "actionDateTime": "2026-09-24T09:00:00.000Z",
    "actionDescription": "Replaced RAM module on user workstation.",
    "result": "System successfully booted into OS with 32GB detected.",
    "performedBy": {
      "id": 3,
      "name": "Santawat Staff",
      "email": "santawat.staff@kmutt.ac.th",
      "role": "STAFF"
    },
    "status": "COMPLETED",
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "Diagnostics report memory_pass.log",
    "createdAt": "2026-09-24T09:00:00.000Z",
    "updatedAt": "2026-09-24T09:00:00.000Z"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: `VALIDATION_ERROR` or `INVALID_ASSIGNEE` (inactive user or non-staff).
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: Role is `REQUESTER`.
  - `404 Not Found`: Ticket not found.

---

### 2.3. `PATCH /api/staff/tickets/:id/actions-taken/:actionId`
Update an existing Action Taken.
- **Access Level**: `STAFF`, `ADMIN`
- **Path Parameters**: `id` (ticket ID), `actionId` (action taken ID)
- **Request Body**:
```json
{
  "actionDescription": "Updated action description.",
  "result": "Work completed with new findings.",
  "status": "COMPLETED",
  "performedById": 2,
  "followUpRequired": true,
  "followUpNote": "Follow-up schedule confirmed for next Monday.",
  "attachmentNotes": "Updated screenshot attached."
}
```
- **Success Response (200 OK)**:
```json
{
  "data": {
    "id": 2,
    "ticketId": 101,
    "actionDateTime": "2026-09-24T09:00:00.000Z",
    "actionDescription": "Updated action description.",
    "result": "Work completed with new findings.",
    "performedBy": {
      "id": 2,
      "name": "Supachai Staff",
      "email": "staff.supachai@kmutt.ac.th",
      "role": "STAFF"
    },
    "status": "COMPLETED",
    "followUpRequired": true,
    "followUpNote": "Follow-up schedule confirmed for next Monday.",
    "attachmentNotes": "Updated screenshot attached.",
    "createdAt": "2026-09-24T09:00:00.000Z",
    "updatedAt": "2026-09-24T09:15:00.000Z"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid fields or inactive assignee.
  - `404 Not Found`: Action Taken or Ticket not found.

---

## 3. Ticket Workflow & Resolution Gate Endpoints

### 3.1. `PATCH /api/staff/tickets/:id/status`
Update ticket status adhering to the authoritative state transition matrix and resolution gate.
- **Access Level**: `STAFF`, `ADMIN`
- **Path Parameters**: `id` (ticket ID)
- **Request Body**:
```json
{
  "status": "RESOLVED",
  "resolutionSummary": "Replaced faulty switch port module and restored connectivity.",
  "expectedUpdatedAt": "2026-09-24T08:00:00.000Z"
}
```
- **Rules**:
  - If `status === "RESOLVED"` or `"CLOSED"`, `resolutionSummary` must be at least 10 characters.
  - If `expectedUpdatedAt` is provided and does not match the database `updatedAt`, returns `409 Conflict` (`STALE_UPDATE_CONFLICT`).
  - Transition must be legal according to the transition matrix.
- **Success Response (200 OK)**:
```json
{
  "data": {
    "id": 101,
    "ticketNumber": "TCK-20260924-0001",
    "currentStatus": "RESOLVED",
    "resolutionSummary": "Replaced faulty switch port module and restored connectivity.",
    "resolvedAt": "2026-09-24T09:30:00.000Z",
    "closedAt": null,
    "updatedAt": "2026-09-24T09:30:00.000Z",
    "assignedStaff": {
      "id": 2,
      "name": "Supachai Staff",
      "email": "staff.supachai@kmutt.ac.th"
    }
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: `INVALID_STATUS_TRANSITION` or `RESOLUTION_SUMMARY_REQUIRED`.
  - `409 Conflict`: `STALE_UPDATE_CONFLICT` (record was modified by another user).

---

## 4. Operational Dashboard Endpoints

### 4.1. `GET /api/requester/dashboard`
Retrieve authoritative operational metrics and recent tickets for the authenticated Requester.
- **Access Level**: `REQUESTER`
- **Success Response (200 OK)**:
```json
{
  "data": {
    "metrics": {
      "openTickets": 3,
      "inProgressTickets": 2,
      "waitingForRequesterTickets": 1,
      "resolvedTickets": 5,
      "closedTickets": 12,
      "totalSubmitted": 20
    },
    "recentTickets": [
      {
        "id": 101,
        "ticketNumber": "TCK-20260924-0001",
        "summary": "Laptop battery drains quickly",
        "currentStatus": "IN_PROGRESS",
        "requestedPriority": "HIGH",
        "createdAt": "2026-09-24T08:00:00.000Z",
        "updatedAt": "2026-09-24T09:00:00.000Z",
        "category": { "id": 1, "name": "Hardware" },
        "actionCount": 2
      }
    ],
    "quickActions": [
      { "id": "create-ticket", "label": "Create Ticket", "action": "create-ticket" },
      { "id": "my-tickets", "label": "View My Tickets", "action": "my-tickets" }
    ]
  }
}
```

---

### 4.2. `GET /api/staff/dashboard`
Retrieve operational queue metrics, urgent items, and breakdown for IT Staff.
- **Access Level**: `STAFF`, `ADMIN`
- **Success Response (200 OK)**:
```json
{
  "data": {
    "metrics": {
      "unassignedTickets": 5,
      "myAssignedTickets": 14,
      "newTickets": 8,
      "openTickets": 12,
      "inProgressTickets": 16,
      "waitingForRequesterTickets": 6,
      "resolvedTickets": 25,
      "highOrUrgentTickets": 7,
      "totalActiveTickets": 47
    },
    "urgentTickets": [
      {
        "id": 105,
        "ticketNumber": "TCK-20260924-0005",
        "summary": "Core router outage in Building B",
        "currentStatus": "IN_PROGRESS",
        "requestedPriority": "URGENT",
        "itPriority": "URGENT",
        "assignedStaff": { "id": 2, "name": "Supachai Staff" },
        "requester": { "id": 5, "name": "Dr. Somchai" },
        "createdAt": "2026-09-24T07:15:00.000Z",
        "updatedAt": "2026-09-24T09:10:00.000Z",
        "actionCount": 3
      }
    ],
    "recentTickets": [
      {
        "id": 106,
        "ticketNumber": "TCK-20260924-0006",
        "summary": "VPN disconnects randomly",
        "currentStatus": "OPEN",
        "requestedPriority": "MEDIUM",
        "itPriority": "HIGH",
        "assignedStaff": null,
        "createdAt": "2026-09-24T08:45:00.000Z",
        "updatedAt": "2026-09-24T08:45:00.000Z"
      }
    ]
  }
}
```

---

### 4.3. `GET /api/admin/dashboard`
Retrieve comprehensive operational metrics plus administrator user account statistics.
- **Access Level**: `ADMIN`
- **Success Response (200 OK)**:
```json
{
  "data": {
    "staffMetrics": {
      "unassignedTickets": 5,
      "myAssignedTickets": 14,
      "newTickets": 8,
      "openTickets": 12,
      "inProgressTickets": 16,
      "waitingForRequesterTickets": 6,
      "resolvedTickets": 25,
      "highOrUrgentTickets": 7,
      "totalActiveTickets": 47
    },
    "urgentTickets": [],
    "recentTickets": [],
    "userSummary": {
      "totalUsers": 28,
      "activeStaff": 6,
      "activeAdmins": 2,
      "activeRequesters": 19,
      "inactiveUsers": 1
    }
  }
}
```
