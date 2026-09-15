import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";
import { Role, Priority, TicketStatus } from "@prisma/client";
import { generateToken } from "../../src/utils/auth";

describe("API-13 to API-21: IT Staff Ticket Queue API (GET /api/staff/tickets)", () => {
  const staffToken = generateToken({
    userId: 6,
    email: "staff.supachai@kmutt.ac.th",
    role: Role.STAFF,
    name: "Supachai Techavichit",
  });

  const adminToken = generateToken({
    userId: 10,
    email: "admin@kmutt.ac.th",
    role: Role.ADMIN,
    name: "Admin System",
  });

  const requesterToken = generateToken({
    userId: 1,
    email: "somchai.pra@kmutt.ac.th",
    role: Role.REQUESTER,
    name: "Somchai Prasert",
  });

  beforeEach(async () => {
    // Clear existing tickets and attachments to start each test with deterministic data
    await prisma.attachment.deleteMany({});
    await prisma.ticketComment.deleteMany({});
    await prisma.ticket.deleteMany({});

    // Seed test tickets across different requesters, categories, priorities, and statuses
    // Ticket 1: Requester 1, Network, High priority, In Progress, assigned to Staff 6
    await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260915-0001",
        requesterId: 1,
        categoryId: 4, // Network
        relatedSystemId: 3, // VPN Access
        summary: "VPN authentication timeout error",
        description: "Cannot connect to VPN from home network",
        requestedPriority: Priority.HIGH,
        itPriority: Priority.HIGH,
        currentStatus: TicketStatus.IN_PROGRESS,
        assignedStaffId: 6,
      },
    });

    // Ticket 2: Requester 2, Hardware, Urgent, New, unassigned
    await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260915-0002",
        requesterId: 2,
        categoryId: 2, // Hardware
        relatedSystemId: 7, // Corporate Laptop
        summary: "Laptop battery bulging and overheating",
        description: "Hardware defect detected on work laptop",
        requestedPriority: Priority.URGENT,
        itPriority: Priority.URGENT,
        currentStatus: TicketStatus.NEW,
        assignedStaffId: null,
      },
    });

    // Ticket 3: Requester 3, Software, Medium, Resolved, assigned to Staff 7
    await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260915-0003",
        requesterId: 3,
        categoryId: 3, // Software
        relatedSystemId: 4, // LEB2
        summary: "Unable to upload final exam grades on LEB2",
        description: "File upload button triggers generic error",
        requestedPriority: Priority.MEDIUM,
        itPriority: Priority.LOW,
        currentStatus: TicketStatus.RESOLVED,
        resolutionSummary: "Cleared browser cache and updated user session permissions.",
        assignedStaffId: 7,
      },
    });

    // Ticket 4: Requester 4, Account and Access, Low, Closed, assigned to Staff 6
    await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260915-0004",
        requesterId: 4,
        categoryId: 1, // Account and Access
        relatedSystemId: 1, // Email System
        summary: "Request email alias for new research lab",
        description: "Need research@kmutt.ac.th alias created",
        requestedPriority: Priority.LOW,
        itPriority: Priority.LOW,
        currentStatus: TicketStatus.CLOSED,
        resolutionSummary: "Created requested email alias in admin console.",
        assignedStaffId: 6,
      },
    });
  });

  it("API-13 (AC-06): returns tickets across all requesters with pagination and summary counts for Staff", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
    expect(res.body.pagination).toMatchObject({
      totalItems: 4,
      totalPages: 1,
      currentPage: 1,
      limit: 10,
    });
    expect(res.body.counts).toMatchObject({
      total: 4,
      unassigned: 1,
      inProgress: 1,
      resolved: 1,
    });
  });

  it("API-14 (AC-06): returns queue successfully for Administrator user", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
  });

  it("API-15 (AC-06): filters tickets by Status", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?status=IN_PROGRESS")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].ticketNumber).toBe("TCK-20260915-0001");
    expect(res.body.data[0].currentStatus).toBe("IN_PROGRESS");
  });

  it("API-16 (AC-06): filters tickets by Category ID", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?categoryId=2")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].summary).toMatch(/battery bulging/i);
  });

  it("API-17 (AC-06): filters unassigned tickets using assignedStaffId=unassigned", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?assignedStaffId=unassigned")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].assignedStaff).toBeNull();
    expect(res.body.data[0].ticketNumber).toBe("TCK-20260915-0002");
  });

  it("API-18 (AC-06): filters tickets by assigned staff member ID", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?assignedStaffId=6")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((t: any) => t.assignedStaff?.id === 6)).toBe(true);
  });

  it("API-19 (AC-06): matches keyword search against summary, description, ticket number, and requester", async () => {
    // Search by summary keyword
    const searchSummary = await request(app)
      .get("/api/staff/tickets?search=battery")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(searchSummary.status).toBe(200);
    expect(searchSummary.body.data).toHaveLength(1);

    // Search by ticket number
    const searchNumber = await request(app)
      .get("/api/staff/tickets?search=TCK-20260915-0001")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(searchNumber.status).toBe(200);
    expect(searchNumber.body.data).toHaveLength(1);

    // Search by requester name
    const searchRequester = await request(app)
      .get("/api/staff/tickets?search=Somchai")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(searchRequester.status).toBe(200);
    expect(searchRequester.body.data).toHaveLength(1);
  });

  it("API-20 (AC-06): paginates tickets properly", async () => {
    const res = await request(app)
      .get("/api/staff/tickets?page=1&limit=2")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({
      totalItems: 4,
      totalPages: 2,
      currentPage: 1,
      limit: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it("API-21 (AC-06): rejects access to IT Staff queue for REQUESTER role with 403 Forbidden", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toHaveProperty("code", "FORBIDDEN");
  });

  it("API-22: rejects unauthenticated requests to IT Staff queue with 401 Unauthorized", async () => {
    const res = await request(app).get("/api/staff/tickets");

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty("code", "UNAUTHORIZED");
  });

  it("API-23: GET /api/staff/members returns active Staff and Admin users", async () => {
    const res = await request(app)
      .get("/api/staff/members")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4); // 3 active staff + 1 active admin
    expect(res.body.data.every((u: any) => u.role === "STAFF" || u.role === "ADMIN")).toBe(true);
  });
});
