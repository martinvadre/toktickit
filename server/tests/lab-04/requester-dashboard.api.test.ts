import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";
import { Role, Priority, TicketStatus } from "@prisma/client";
import { generateToken } from "../../src/utils/auth";

describe("API-15 to API-17: Requester Dashboard API Tests (Lab 4)", () => {
  const requesterToken1 = generateToken({
    userId: 1,
    email: "somchai.pra@kmutt.ac.th",
    role: Role.REQUESTER,
    name: "Somchai Prasert",
  });

  const requesterToken2 = generateToken({
    userId: 2,
    email: "apinya.suk@kmutt.ac.th",
    role: Role.REQUESTER,
    name: "Apinya Sukcharoen",
  });

  const staffToken = generateToken({
    userId: 6,
    email: "staff.supachai@kmutt.ac.th",
    role: Role.STAFF,
    name: "Supachai Techavichit",
  });

  beforeEach(async () => {
    await prisma.actionTaken.deleteMany({});
    await prisma.ticketComment.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.ticket.deleteMany({});

    // Seed tickets for Requester 1:
    // 1 OPEN, 2 IN_PROGRESS, 1 WAITING_FOR_REQUESTER, 1 RESOLVED, 1 CLOSED (Total = 6)
    await prisma.ticket.createMany({
      data: [
        {
          ticketNumber: "TCK-REQ1-001",
          requesterId: 1,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Requester 1 Open ticket",
          description: "Details for open ticket",
          requestedPriority: Priority.HIGH,
          currentStatus: TicketStatus.OPEN,
        },
        {
          ticketNumber: "TCK-REQ1-002",
          requesterId: 1,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Requester 1 In Progress ticket A",
          description: "Details for in progress ticket A",
          requestedPriority: Priority.MEDIUM,
          currentStatus: TicketStatus.IN_PROGRESS,
        },
        {
          ticketNumber: "TCK-REQ1-003",
          requesterId: 1,
          categoryId: 2,
          relatedSystemId: 1,
          summary: "Requester 1 In Progress ticket B",
          description: "Details for in progress ticket B",
          requestedPriority: Priority.LOW,
          currentStatus: TicketStatus.IN_PROGRESS,
        },
        {
          ticketNumber: "TCK-REQ1-004",
          requesterId: 1,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Requester 1 Waiting ticket",
          description: "Details for waiting ticket",
          requestedPriority: Priority.HIGH,
          currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
        },
        {
          ticketNumber: "TCK-REQ1-005",
          requesterId: 1,
          categoryId: 2,
          relatedSystemId: 1,
          summary: "Requester 1 Resolved ticket",
          description: "Details for resolved ticket",
          requestedPriority: Priority.HIGH,
          currentStatus: TicketStatus.RESOLVED,
          resolutionSummary: "Resolved through complete system reload.",
          resolvedAt: new Date(),
        },
        {
          ticketNumber: "TCK-REQ1-006",
          requesterId: 1,
          categoryId: 2,
          relatedSystemId: 1,
          summary: "Requester 1 Closed ticket",
          description: "Details for closed ticket",
          requestedPriority: Priority.LOW,
          currentStatus: TicketStatus.CLOSED,
          resolutionSummary: "Issue confirmed closed by staff.",
          closedAt: new Date(),
        },
      ],
    });

    // Seed tickets for Requester 2:
    await prisma.ticket.createMany({
      data: [
        {
          ticketNumber: "TCK-REQ2-001",
          requesterId: 2,
          categoryId: 3,
          relatedSystemId: 1,
          summary: "Requester 2 Confidential Ticket",
          description: "Details confidential to requester 2",
          requestedPriority: Priority.URGENT,
          currentStatus: TicketStatus.OPEN,
        },
      ],
    });
  });

  it("API-15 (AC-11): GET /api/requester/dashboard returns authoritative counts for the authenticated Requester", async () => {
    const res = await request(app)
      .get("/api/requester/dashboard")
      .set("Authorization", `Bearer ${requesterToken1}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();

    const { metrics } = res.body.data;
    expect(metrics.openTickets).toBe(1);
    expect(metrics.inProgressTickets).toBe(2);
    expect(metrics.waitingForRequesterTickets).toBe(1);
    expect(metrics.resolvedTickets).toBe(1);
    expect(metrics.closedTickets).toBe(1);
    expect(metrics.totalSubmitted).toBe(6);

    // Verify quickActions are present
    expect(res.body.data.quickActions).toBeDefined();
    expect(res.body.data.quickActions.length).toBeGreaterThanOrEqual(2);
  });

  it("API-16 (AC-11): GET /api/requester/dashboard returns strictly only tickets submitted by the authenticated user in recent tickets list", async () => {
    const res = await request(app)
      .get("/api/requester/dashboard")
      .set("Authorization", `Bearer ${requesterToken1}`);

    expect(res.status).toBe(200);
    const { recentTickets } = res.body.data;
    expect(recentTickets.length).toBeLessThanOrEqual(5);

    // All tickets must belong exclusively to Requester 1
    recentTickets.forEach((t: any) => {
      expect(t.ticketNumber).toMatch(/^TCK-REQ1-/);
      expect(t.ticketNumber).not.toBe("TCK-REQ2-001");
      expect(t.summary).not.toContain("Confidential");
    });
  });

  it("API-17 (AC-11): GET /api/requester/dashboard returns 401 Unauthorized when unauthenticated and 403 Forbidden for non-requester role", async () => {
    // 1. Unauthenticated request
    const resUnauth = await request(app).get("/api/requester/dashboard");
    expect(resUnauth.status).toBe(401);
    expect(resUnauth.body.error.code).toBe("UNAUTHORIZED");

    // 2. Staff user attempting to access requester dashboard
    const resForbidden = await request(app)
      .get("/api/requester/dashboard")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(resForbidden.status).toBe(403);
    expect(resForbidden.body.error.code).toBe("FORBIDDEN");
  });
});
