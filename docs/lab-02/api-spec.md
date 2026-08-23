# Lab 2 REST API Specification

This document defines the REST API contract for TokTickIT Sprint 2 (Requester Ticket Management & Attachments).

---

## 1. General Conventions

### 1.1. Base URL & Protocol
- All endpoints are prefixed with `/api`.
- Standard payload format is JSON (`Content-Type: application/json`), except file upload endpoints which accept `multipart/form-data`.

### 1.2. Requester Identity Context (Lab 2 Testing)
In Lab 2, real authentication sessions are deferred to Lab 3. The currently selected Development Requester is passed in API requests using the **`x-requester-id`** HTTP header:
```http
x-requester-id: 1
```
Endpoints enforcing ownership isolation will read this header to verify that the target resource is owned by the calling requester.

### 1.3. Standard Error Envelope
All error responses adhere to the unified error envelope:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid ticket submission data.",
    "fieldErrors": [
      {
        "field": "summary",
        "message": "Summary must be between 5 and 150 characters."
      }
    ],
    "correlationId": "c2f4a1e8-79e2-49a3-9cb3-128a5d3f1012"
  }
}
```

---

## 2. Reference Data & Development Requester Endpoints

### 2.1. `GET /api/requesters`
Retrieve active development requesters for the simulated login dropdown.

- **Query Parameters**: None.
- **Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Somchai Prasert",
      "email": "somchai.pra@kmutt.ac.th",
      "department": "Computer Engineering",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Apinya Sukcharoen",
      "email": "apinya.suk@kmutt.ac.th",
      "department": "Information Technology",
      "isActive": true
    }
  ]
}
```

### 2.2. `GET /api/categories`
Retrieve active ticket categories.

- **Query Parameters**: None.
- **Success Response (200 OK)**:
```json
{
  "data": [
    { "id": 1, "name": "Account and Access", "isActive": true },
    { "id": 2, "name": "Hardware", "isActive": true },
    { "id": 3, "name": "Software", "isActive": true },
    { "id": 4, "name": "Network", "isActive": true }
  ]
}
```

### 2.3. `GET /api/related-systems`
Retrieve active related systems/devices.

- **Query Parameters**: None.
- **Success Response (200 OK)**:
```json
{
  "data": [
    { "id": 1, "name": "Email System", "isActive": true },
    { "id": 2, "name": "Campus Wi-Fi", "isActive": true },
    { "id": 3, "name": "VPN Access", "isActive": true },
    { "id": 4, "name": "LEB2 Learning Platform", "isActive": true },
    { "id": 5, "name": "Grade Submission Portal", "isActive": true },
    { "id": 6, "name": "Network Printer", "isActive": true },
    { "id": 7, "name": "Corporate Laptop", "isActive": true }
  ]
}
```

---

## 3. Ticket Endpoints

### 3.1. `POST /api/tickets`
Create a new ticket for the active requester.

- **Headers**:
  - `x-requester-id`: (Optional if provided in body)
- **Request Body**:
```json
{
  "requesterId": 1,
  "categoryId": 2,
  "relatedSystemId": 7,
  "summary": "Corporate laptop battery drains rapidly",
  "description": "The laptop battery loses charge within 30 minutes of unplugging even under minimal load.",
  "requestedPriority": "HIGH"
}
```
- **Validation Rules**:
  - `requesterId`: Required integer referencing an active `RequesterUser`.
  - `categoryId`: Required integer referencing an active `Category`.
  - `relatedSystemId`: Required integer referencing an active `RelatedSystem`.
  - `summary`: Required string (length 5–150 chars).
  - `description`: Required string (length 10–3000 chars).
  - `requestedPriority`: Required enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`). Default `MEDIUM`.
- **Success Response (201 Created)**:
```json
{
  "data": {
    "id": 10,
    "ticketNumber": "TCK-20260823-0001",
    "requesterId": 1,
    "categoryId": 2,
    "relatedSystemId": 7,
    "summary": "Corporate laptop battery drains rapidly",
    "description": "The laptop battery loses charge within 30 minutes of unplugging even under minimal load.",
    "requestedPriority": "HIGH",
    "currentStatus": "NEW",
    "createdAt": "2026-08-23T07:15:00.000Z",
    "updatedAt": "2026-08-23T07:15:00.000Z",
    "category": { "id": 2, "name": "Hardware" },
    "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
    "requester": { "id": 1, "name": "Somchai Prasert", "email": "somchai.pra@kmutt.ac.th" }
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing/invalid fields.
  - `404 Not Found`: Invalid Category, Related System, or Requester ID.

---

### 3.2. `GET /api/tickets`
Retrieve a paginated list of tickets owned by the requesting user, with search and filtering.

- **Headers**:
  - `x-requester-id`: Required (or via query param `requesterId`).
- **Query Parameters**:
  - `requesterId`: (Optional if passed in header)
  - `search`: String (keyword match on summary or description)
  - `categoryId`: Int (filter by category)
  - `status`: String (filter by `NEW`, `ASSIGNED`, `IN_PROGRESS`, `PENDING_REQUESTER`, `RESOLVED`, `CLOSED`, `CANCELLED`)
  - `priority`: String (filter by `LOW`, `MEDIUM`, `HIGH`, `URGENT`)
  - `page`: Int (default `1`)
  - `limit`: Int (default `10`, max `50`)
  - `sortBy`: String (`createdAt`, `updatedAt`, `requestedPriority`, `ticketNumber`, default `createdAt`)
  - `sortOrder`: String (`asc`, `desc`, default `desc`)
- **Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": 10,
      "ticketNumber": "TCK-20260823-0001",
      "requesterId": 1,
      "summary": "Corporate laptop battery drains rapidly",
      "requestedPriority": "HIGH",
      "currentStatus": "NEW",
      "createdAt": "2026-08-23T07:15:00.000Z",
      "updatedAt": "2026-08-23T07:15:00.000Z",
      "category": { "id": 2, "name": "Hardware" },
      "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
      "attachmentCount": 1
    }
  ],
  "pagination": {
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1,
    "limit": 10,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

---

### 3.3. `GET /api/tickets/:id`
Retrieve full detail of a single owned ticket including active and soft-removed attachments.

- **Headers**:
  - `x-requester-id`: Required integer.
- **Success Response (200 OK)**:
```json
{
  "data": {
    "id": 10,
    "ticketNumber": "TCK-20260823-0001",
    "requesterId": 1,
    "summary": "Corporate laptop battery drains rapidly",
    "description": "The laptop battery loses charge within 30 minutes of unplugging even under minimal load.",
    "requestedPriority": "HIGH",
    "currentStatus": "NEW",
    "createdAt": "2026-08-23T07:15:00.000Z",
    "updatedAt": "2026-08-23T07:15:00.000Z",
    "category": { "id": 2, "name": "Hardware" },
    "relatedSystem": { "id": 7, "name": "Corporate Laptop" },
    "requester": { "id": 1, "name": "Somchai Prasert", "email": "somchai.pra@kmutt.ac.th" },
    "attachments": [
      {
        "id": 5,
        "ticketId": 10,
        "fileName": "battery-diagnostic.png",
        "fileSize": 204850,
        "mimeType": "image/png",
        "isRemoved": false,
        "removalReason": null,
        "removedAt": null,
        "createdAt": "2026-08-23T07:16:00.000Z"
      }
    ]
  }
}
```
- **Error Responses**:
  - `403 Forbidden`: Ticket belongs to a different requester.
  - `404 Not Found`: Ticket does not exist.

---

## 4. Attachment Endpoints

### 4.1. `POST /api/tickets/:id/attachments`
Upload an attachment to an existing owned ticket.

- **Headers**:
  - `x-requester-id`: Required.
  - `Content-Type: multipart/form-data`
- **Form Data**:
  - `file`: File payload.
- **Constraints**:
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
  - Max size: 5,242,880 bytes (5 MB).
  - Max active attachments per ticket: 5.
- **Success Response (201 Created)**:
```json
{
  "data": {
    "id": 6,
    "ticketId": 10,
    "fileName": "error-log.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "isRemoved": false,
    "createdAt": "2026-08-23T07:20:00.000Z"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Max 5 active attachments limit exceeded.
  - `403 Forbidden`: Ticket belongs to another requester.
  - `413 Payload Too Large`: File exceeds 5 MB.
  - `415 Unsupported Media Type`: File type not in allowed list.

---

### 4.2. `GET /api/attachments/:id/download`
Download an active attachment file.

- **Headers**:
  - `x-requester-id`: Required.
- **Success Response (200 OK)**:
  - Headers: `Content-Disposition: attachment; filename="battery-diagnostic.png"`, `Content-Type: image/png`.
  - Body: Binary stream.
- **Error Responses**:
  - `403 Forbidden`: Attachment belongs to another requester's ticket.
  - `404 Not Found`: Attachment ID not found.
  - `410 Gone`: Attachment has been soft-removed and download is permanently blocked.

---

### 4.3. `DELETE /api/attachments/:id`
Soft-remove an attachment from an owned ticket with a mandatory explanation reason.

- **Headers**:
  - `x-requester-id`: Required.
  - `Content-Type: application/json`
- **Request Body**:
```json
{
  "reason": "Uploaded wrong screenshot by mistake."
}
```
- **Validation Rules**:
  - `reason`: Required string (length 3–255 characters).
- **Success Response (200 OK)**:
```json
{
  "data": {
    "id": 5,
    "ticketId": 10,
    "fileName": "battery-diagnostic.png",
    "isRemoved": true,
    "removalReason": "Uploaded wrong screenshot by mistake.",
    "removedAt": "2026-08-23T07:25:00.000Z"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Reason missing or too short.
  - `403 Forbidden`: Attachment belongs to another requester.
  - `404 Not Found`: Attachment does not exist.
  - `409 Conflict`: Attachment is already removed.
