# Lab 3 REST API Specification

This document defines the REST API contract for TokTickIT Sprint 3 (Authentication, IT Staff Operations, Admin User Management).

---

## 1. General Conventions

### 1.1. Base URL & Authentication Protocol
- All endpoints are prefixed with `/api`.
- Protected endpoints require an HTTP Authorization header containing a valid JWT token:
  ```http
  Authorization: Bearer <jwt_token>
  ```

### 1.2. Role-Based Access Enforcement
Endpoints enforce minimum required roles:
- `REQUESTER`: Can access public reference data, authentication endpoints, and owned ticket endpoints.
- `STAFF`: Can access all `REQUESTER` endpoints plus staff ticket queue and ticket operation endpoints.
- `ADMIN`: Can access all endpoints including administrator user management.

### 1.3. Standard Error Envelope
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication token missing or invalid.",
    "fieldErrors": [],
    "correlationId": "f8a92b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
  }
}
```

Standard Error Codes:
- `VALIDATION_ERROR` (400 Bad Request)
- `UNAUTHORIZED` (401 Unauthorized)
- `FORBIDDEN` (403 Forbidden)
- `NOT_FOUND` (404 Not Found)
- `CONFLICT` (409 Conflict - e.g. duplicate email)
- `GONE` (410 Gone - e.g. soft-removed attachment)
- `INTERNAL_SERVER_ERROR` (500 Internal Server Error)

---

## 2. Authentication Endpoints

### 2.1. `POST /api/auth/login`
Authenticate a user with email and password.

- **Access Level**: Public
- **Request Body**:
```json
{
  "email": "staff.supachai@kmutt.ac.th",
  "password": "Password123!"
}
```
- **Success Response (200 OK)**:
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 5,
      "name": "Supachai Techavichit",
      "email": "staff.supachai@kmutt.ac.th",
      "department": "IT Operations",
      "role": "STAFF",
      "isActive": true
    }
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid credentials or account disabled (`isActive = false`).

---

### 2.2. `POST /api/auth/logout`
Invalidate local user session.

- **Access Level**: Authenticated (`REQUESTER`, `STAFF`, `ADMIN`)
- **Success Response (200 OK)**:
```json
{
  "message": "Successfully logged out."
}
```

---

### 2.3. `GET /api/auth/me`
Retrieve currently authenticated user profile.

- **Access Level**: Authenticated (`REQUESTER`, `STAFF`, `ADMIN`)
- **Success Response (200 OK)**:
```json
{
  "data": {
    "id": 5,
    "name": "Supachai Techavichit",
    "email": "staff.supachai@kmutt.ac.th",
    "department": "IT Operations",
    "role": "STAFF",
    "isActive": true,
    "createdAt": "2026-08-20T08:30:00.000Z"
  }
}
```

---

## 3. IT Staff Ticket Queue & Operations Endpoints

### 3.1. `GET /api/staff/tickets`
Retrieve tickets across all requesters with filtering, search, sorting, and pagination.

- **Access Level**: Restricted to `STAFF`, `ADMIN`
- **Query Parameters**:
  - `search` (optional string): Keyword matching ticket number, summary, description, requester name/email.
  - `status` (optional TicketStatus enum): `NEW`, `ASSIGNED`, `IN_PROGRESS`, `PENDING_REQUESTER`, `RESOLVED`, `CLOSED`, `CANCELLED`.
  - `categoryId` (optional integer): Filter by Category ID.
  - `relatedSystemId` (optional integer): Filter by Related System ID.
  - `assignedStaffId` (optional integer / string): Staff user ID or `'unassigned'`.
  - `requestedPriority` (optional Priority enum): `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
  - `itPriority` (optional Priority enum): `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
  - `page` (optional integer, default `1`).
  - `limit` (optional integer, default `10`).
  - `sortBy` (optional string): `createdAt`, `updatedAt`, `currentStatus`, `requestedPriority`, `itPriority` (default `createdAt`).
  - `sortOrder` (optional string): `asc` or `desc` (default `desc`).
- **Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": 12,
      "ticketNumber": "TCK-20260913-0004",
      "summary": "VPN connection drops during peak hours",
      "requestedPriority": "HIGH",
      "itPriority": "URGENT",
      "currentStatus": "IN_PROGRESS",
      "createdAt": "2026-09-13T09:15:00.000Z",
      "updatedAt": "2026-09-13T10:00:00.000Z",
      "requester": {
        "id": 1,
        "name": "Somchai Prasert",
        "email": "somchai.pra@kmutt.ac.th",
        "department": "Computer Engineering"
      },
      "assignedStaff": {
        "id": 5,
        "name": "Supachai Techavichit",
        "email": "staff.supachai@kmutt.ac.th"
      },
      "category": { "id": 4, "name": "Network" },
      "relatedSystem": { "id": 3, "name": "VPN Access" },
      "_count": { "attachments": 2, "comments": 3 }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5
  }
}
```

---

### 3.2. `GET /api/staff/tickets/:id`
Retrieve comprehensive details of a specific ticket for IT Staff, including internal notes.

- **Access Level**: Restricted to `STAFF`, `ADMIN`
- **Success Response (200 OK)**:
```json
{
  "data": {
    "id": 12,
    "ticketNumber": "TCK-20260913-0004",
    "summary": "VPN connection drops during peak hours",
    "description": "Whenever I attempt to connect to the campus VPN between 14:00 and 16:00, the session disconnects every 5 minutes.",
    "requestedPriority": "HIGH",
    "itPriority": "URGENT",
    "currentStatus": "IN_PROGRESS",
    "resolutionSummary": null,
    "createdAt": "2026-09-13T09:15:00.000Z",
    "updatedAt": "2026-09-13T10:00:00.000Z",
    "requester": {
      "id": 1,
      "name": "Somchai Prasert",
      "email": "somchai.pra@kmutt.ac.th",
      "department": "Computer Engineering"
    },
    "assignedStaff": {
      "id": 5,
      "name": "Supachai Techavichit",
      "email": "staff.supachai@kmutt.ac.th"
    },
    "category": { "id": 4, "name": "Network" },
    "relatedSystem": { "id": 3, "name": "VPN Access" },
    "attachments": [
      {
        "id": 8,
        "fileName": "vpn_log.txt",
        "fileSize": 14200,
        "mimeType": "text/plain",
        "isRemoved": false,
        "createdAt": "2026-09-13T09:15:00.000Z"
      }
    ],
    "comments": [
      {
        "id": 15,
        "author": { "id": 1, "name": "Somchai Prasert", "role": "REQUESTER" },
        "content": "Updated VPN client to v4.2 but problem persists.",
        "isInternal": false,
        "createdAt": "2026-09-13T09:30:00.000Z"
      },
      {
        "id": 16,
        "author": { "id": 5, "name": "Supachai Techavichit", "role": "STAFF" },
        "content": "Checked network gateway node 3, CPU utilization reached 98%. Routing traffic to node 4.",
        "isInternal": true,
        "createdAt": "2026-09-13T09:45:00.000Z"
      }
    ]
  }
}
```

---

### 3.3. `PATCH /api/staff/tickets/:id/status`
Update ticket status.

- **Access Level**: Restricted to `STAFF`, `ADMIN`
- **Request Body**:
```json
{
  "status": "RESOLVED",
  "resolutionSummary": "Reconfigured VPN gateway node 3 routes and balanced user load to gateway node 4."
}
```
- **Success Response (200 OK)**:
```json
{
  "data": {
    "id": 12,
    "ticketNumber": "TCK-20260913-0004",
    "currentStatus": "RESOLVED",
    "resolutionSummary": "Reconfigured VPN gateway node 3 routes and balanced user load to gateway node 4.",
    "resolvedAt": "2026-09-13T10:30:00.000Z"
  }
}
```

---

### 3.4. `PATCH /api/staff/tickets/:id/assign`
Assign ticket to an IT Staff member.

- **Access Level**: Restricted to `STAFF`, `ADMIN`
- **Request Body**:
```json
{
  "assignedStaffId": 5
}
```
- **Success Response (200 OK)**:
```json
{
  "data": {
    "id": 12,
    "assignedStaff": {
      "id": 5,
      "name": "Supachai Techavichit",
      "email": "staff.supachai@kmutt.ac.th"
    }
  }
}
```

---

### 3.5. `PATCH /api/staff/tickets/:id/priority`
Update IT Priority.

- **Access Level**: Restricted to `STAFF`, `ADMIN`
- **Request Body**:
```json
{
  "itPriority": "URGENT"
}
```
- **Success Response (200 OK)**: Returns updated ticket priority metadata.

---

### 3.6. `POST /api/staff/tickets/:id/comments`
Add a public comment or internal staff note.

- **Access Level**: Restricted to `STAFF`, `ADMIN`
- **Request Body**:
```json
{
  "content": "Contacted network infrastructure vendor for firmware patch.",
  "isInternal": true
}
```
- **Success Response (201 Created)**: Returns created comment object.

---

## 4. Administrator User Management Endpoints

### 4.1. `GET /api/admin/users`
List users with search, role filter, active status filter, and pagination.

- **Access Level**: Restricted to `ADMIN`
- **Query Parameters**: `search`, `role`, `isActive`, `page`, `limit`.
- **Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Somchai Prasert",
      "email": "somchai.pra@kmutt.ac.th",
      "department": "Computer Engineering",
      "role": "REQUESTER",
      "isActive": true,
      "createdAt": "2026-08-01T08:00:00.000Z"
    },
    {
      "id": 5,
      "name": "Supachai Techavichit",
      "email": "staff.supachai@kmutt.ac.th",
      "department": "IT Operations",
      "role": "STAFF",
      "isActive": true,
      "createdAt": "2026-08-05T08:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 10, "totalItems": 24, "totalPages": 3 }
}
```

---

### 4.2. `POST /api/admin/users`
Create a new user account.

- **Access Level**: Restricted to `ADMIN`
- **Request Body**:
```json
{
  "name": "Kanya Ratana",
  "email": "kanya.rat@kmutt.ac.th",
  "department": "Network Engineering",
  "role": "STAFF",
  "password": "Password123!"
}
```
- **Success Response (201 Created)**: Returns newly created user object (excluding `passwordHash`).

---

### 4.3. `PATCH /api/admin/users/:id`
Update user account details, role, or active status.

- **Access Level**: Restricted to `ADMIN`
- **Request Body**:
```json
{
  "name": "Kanya Ratana",
  "department": "Infrastructure Support",
  "role": "STAFF",
  "isActive": true
}
```
- **Success Response (200 OK)**: Returns updated user profile.

---

### 4.4. `POST /api/admin/users/:id/reset-password`
Reset a user's password.

- **Access Level**: Restricted to `ADMIN`
- **Request Body**:
```json
{
  "newPassword": "NewSecurePassword456!"
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Password reset successfully for user Kanya Ratana."
}
```

---

### 4.5. `GET /api/admin/staff-list`
Retrieve active staff and admin users for assignment dropdowns.

- **Access Level**: Restricted to `STAFF`, `ADMIN`
- **Success Response (200 OK)**:
```json
{
  "data": [
    { "id": 5, "name": "Supachai Techavichit", "email": "staff.supachai@kmutt.ac.th", "role": "STAFF" },
    { "id": 9, "name": "Admin System", "email": "admin@kmutt.ac.th", "role": "ADMIN" }
  ]
}
```
