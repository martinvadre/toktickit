import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";
import { Role, Priority, TicketStatus } from "@prisma/client";
import { generateToken } from "../../src/utils/auth";

describe("API-18 to API-20: Staff & Admin Dashboard API Tests (Lab 4)", () => {
  const staffToken = generateToken({
    userId: 6,
    email: "staff.supachai@kmutt.ac.th",
    role: Role.STAFF,
    name: "Supachai Techavichit",
  });

  const otherStaffToken = generateToken({
    userId: 7,
    email: "staff.manee@kmutt.ac.th",
    role: Role.STAFF,
    name: "Manee Kerdphon",
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
    await prisma.actionTaken.deleteMany({});
    await prisma.ticketComment.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.ticket.deleteMany({});

    // Seed diverse ticket queue:
    // 1. Unassigned, NEW, URGENT
    // 2. Unassigned, OPEN, HIGH
    // 3. Assigned to Staff 6, IN_PROGRESS, URGENT
    // 4. Assigned to Staff 6, WAITING_FOR_REQUESTER, MEDIUM
    // 5. Assigned to Staff 7, IN_PROGRESS, LOW
    // 6. Assigned to Staff 6, RESOLVED, HIGH
    await prisma.ticket.createMany({
      data: [
        {
          ticketNumber: "TCK-OPS-001",
          requesterId: 1,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Core switch link flap",
          description: "High priority network incident",
          requestedPriority: Priority.URGENT,
          itPriority: Priority.URGENT,
          currentStatus: TicketStatus.NEW,
          assignedStaffId: null,
        },
        {
          ticketNumber: "TCK-OPS-002",
          requesterId: 1,
          categoryId: 2,
          relatedSystemId: 1,
          summary: "Broken projector in classroom 401",
          description: "High priority hardware issue",
          requestedPriority: Priority.HIGH,
          itPriority: Priority.HIGH,
          currentStatus: TicketStatus.OPEN,
          assignedStaffId: null,
        },
        {
          ticketNumber: "TCK-OPS-003",
          requesterId: 2,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "Server disk array degraded",
          description: "Urgent server fault",
          requestedPriority: Priority.URGENT,
          itPriority: Priority.URGENT,
          currentStatus: TicketStatus.IN_PROGRESS,
          assignedStaffId: 6,
        },
        {
          ticketNumber: "TCK-OPS-004",
          requesterId: 2,
          categoryId: 3,
          relatedSystemId: 1,
          summary: "Software license expired",
          description: "Waiting for requester purchase order number",
          requestedPriority: Priority.MEDIUM,
          itPriority: Priority.MEDIUM,
          currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
          assignedStaffId: 6,
        },
        {
          ticketNumber: "TCK-OPS-005",
          requesterId: 1,
          categoryId: 2,
          relatedSystemId: 1,
          summary: "Mouse cursor lagging",
          description: "Low priority workstation ticket",
          requestedPriority: Priority.LOW,
          itPriority: Priority.LOW,
          currentStatus: TicketStatus.IN_PROGRESS,
          assignedStaffId: 7,
        },
        {
          ticketNumber: "TCK-OPS-006",
          requesterId: 1,
          categoryId: 1,
          relatedSystemId: 1,
          summary: "DNS cache corruption resolved",
          description: "Resolved network incident",
          requestedPriority: Priority.HIGH,
          itPriority: Priority.HIGH,
          currentStatus: TicketStatus.RESOLVED,
          assignedStaffId: 6,
          resolutionSummary: "Flushed DNS resolver caches across all edge nodes.",
          resolvedAt: new Date(),
        },
      ],
    });
  });

  it("API-18 (AC-12): GET /api/staff/dashboard returns correct counts for Unassigned, My Assigned, and Status breakdowns", async () => {
    const res = await request(app)
      .get("/api/staff/dashboard")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();

    const { metrics } = res.body.data;
    // Active tickets: TCK-OPS-001 (unassigned, NEW), TCK-OPS-002 (unassigned, OPEN),
    // TCK-OPS-003 (assigned 6, IN_PROGRESS), TCK-OPS-004 (assigned 6, WAITING),
    // TCK-OPS-005 (assigned 7, IN_PROGRESS)
    // TCK-OPS-006 is RESOLVED (inactive for open queue metrics)
    expect(metrics.unassignedTickets).toBe(2);
    expect(metrics.myAssignedTickets).toBe(2); // OPS-003, OPS-004 (active assigned to Staff 6)
    expect(metrics.newTickets).toBe(1);
    expect(metrics.openTickets).toBe(1);
    expect(metrics.inProgressTickets).toBe(2);
    expect(metrics.waitingForRequesterTickets).toBe(1);
    expect(metrics.resolvedTickets).toBe(1);
    // highOrUrgent active: OPS-001 (URGENT), OPS-002 (HIGH), OPS-003 (URGENT) -> 3
    expect(metrics.highOrUrgentTickets).toBe(3);
    expect(metrics.totalActiveTickets).toBe(5);
  });

  it("API-19 (AC-12): GET /api/staff/dashboard returns urgent and recent tickets list", async () => {
    const res = await request(app)
      .get("/api/staff/dashboard")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    const { urgentTickets, recentTickets } = res.body.data;

    expect(Array.isArray(urgentTickets)).toBe(true);
    expect(urgentTickets.length).toBe(3); // OPS-001, OPS-002, OPS-003
    urgentTickets.forEach((t: any) => {
      expect(["URGENT", "HIGH"]).toContain(t.itPriority);
    });

    expect(Array.isArray(recentTickets)).toBe(true);
    expect(recentTickets.length).toBeLessThanOrEqual(5);
  });

  it("API-20 (AC-13): GET /api/admin/dashboard returns staff metrics plus user account summary", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.staffMetrics).toBeDefined();
    expect(res.body.data.userSummary).toBeDefined();

    const { userSummary } = res.body.data;
    expect(userSummary.totalUsers).toBeGreaterThan(0);
    expect(userSummary.activeStaff).toBeGreaterThanOrEqual(1);
    expect(userSummary.activeAdmins).toBeGreaterThanOrEqual(1);
    expect(userSummary.activeRequesters).toBeGreaterThanOrEqual(1);
    expect(typeof userSummary.inactiveUsers).toBe("number");

    // Requester attempting to access admin dashboard should be forbidden (403)
    const resForbidden = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(resForbidden.status).toBe(403);
  });
});
