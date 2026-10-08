import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";
import { Role, Priority, TicketStatus, ActionStatus } from "@prisma/client";
import { generateToken } from "../../src/utils/auth";

describe("API-01 to API-08: Actions Taken API Tests (Lab 4)", () => {
  const staffToken = generateToken({
    userId: 6,
    email: "staff.supachai@kmutt.ac.th",
    role: Role.STAFF,
    name: "Supachai Techavichit",
  });

  const staffToken2 = generateToken({
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

  const otherRequesterToken = generateToken({
    userId: 2,
    email: "apinya.suk@kmutt.ac.th",
    role: Role.REQUESTER,
    name: "Apinya Sukcharoen",
  });

  let testTicketId: number;

  beforeEach(async () => {
    await prisma.actionTaken.deleteMany({});
    await prisma.ticketComment.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.ticket.deleteMany({});

    // Seed test ticket owned by Requester 1, assigned to Staff 6
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260924-0001",
        requesterId: 1,
        categoryId: 2, // Hardware
        relatedSystemId: 7, // Corporate Laptop
        summary: "Laptop battery drains in 30 minutes",
        description: "Battery discharges rapidly under normal operation.",
        requestedPriority: Priority.HIGH,
        itPriority: Priority.HIGH,
        currentStatus: TicketStatus.IN_PROGRESS,
        assignedStaffId: 6,
      },
    });

    testTicketId = ticket.id;
  });

  it("API-01 (AC-01): POST /api/staff/tickets/:id/actions-taken creates action with auto-captured performer", async () => {
    const res = await request(app)
      .post(`/api/staff/tickets/${testTicketId}/actions-taken`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        actionDescription: "Performed battery diagnostics and impedance test.",
        result: "Found degraded cell 3; output voltage fluctuating.",
        followUpRequired: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.ticketId).toBe(testTicketId);
    expect(res.body.data.actionDescription).toBe("Performed battery diagnostics and impedance test.");
    expect(res.body.data.result).toBe("Found degraded cell 3; output voltage fluctuating.");
    expect(res.body.data.performedBy.id).toBe(6);
    expect(res.body.data.performedBy.name).toBe("Supachai Techavichit");
    expect(res.body.data.status).toBe(ActionStatus.COMPLETED);
    expect(res.body.data.followUpRequired).toBe(false);
    expect(res.body.data.followUpNote).toBeNull();
  });

  it("API-02 (AC-01 & BR-02): POST allows assigning a different active IT Staff member as performer", async () => {
    // Ticket coordinator is Staff 6, but Action Taken is performed by Staff 7 (Manee)
    const res = await request(app)
      .post(`/api/staff/tickets/${testTicketId}/actions-taken`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        actionDescription: "Replaced internal lithium pack with certified spare.",
        result: "New pack recognized; 100% capacity reported by BIOS.",
        performedById: 7, // Manee
        status: "COMPLETED",
        followUpRequired: true,
        followUpNote: "Run full calibration cycle overnight.",
        attachmentNotes: "battery_test.log",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.performedBy.id).toBe(7);
    expect(res.body.data.performedBy.name).toBe("Manee Kerdphon");
    expect(res.body.data.followUpRequired).toBe(true);
    expect(res.body.data.followUpNote).toBe("Run full calibration cycle overnight.");
    expect(res.body.data.attachmentNotes).toBe("battery_test.log");
  });

  it("API-03 (AC-02 & BR-04): POST rejects creation when followUpRequired is true but followUpNote is empty", async () => {
    const res = await request(app)
      .post(`/api/staff/tickets/${testTicketId}/actions-taken`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        actionDescription: "Disassembled laptop shell to inspect thermal paste.",
        result: "Thermal paste dry and cracked.",
        followUpRequired: true,
        followUpNote: "", // Missing note!
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toContain("Follow-up note");
  });

  it("API-04 (AC-03 & BR-03): POST rejects creation when performedById belongs to inactive staff or requester", async () => {
    // Attempt assigning to inactive staff user (ID: 9)
    const resInactive = await request(app)
      .post(`/api/staff/tickets/${testTicketId}/actions-taken`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        actionDescription: "Cleaned heat sink fans and re-seated CPU cooler.",
        result: "Fans spinning at normal RPM.",
        performedById: 9, // Inactive Staff
      });

    expect(resInactive.status).toBe(400);
    expect(resInactive.body.error.code).toBe("INVALID_ASSIGNEE");

    // Attempt assigning to requester user (ID: 1)
    const resRequester = await request(app)
      .post(`/api/staff/tickets/${testTicketId}/actions-taken`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        actionDescription: "Cleaned heat sink fans and re-seated CPU cooler.",
        result: "Fans spinning at normal RPM.",
        performedById: 1, // Requester
      });

    expect(resRequester.status).toBe(400);
    expect(resRequester.body.error.code).toBe("INVALID_ASSIGNEE");
  });

  it("API-05 (AC-04): GET /api/tickets/:id/actions-taken returns actions for owning Requester", async () => {
    // Seed action
    await prisma.actionTaken.create({
      data: {
        ticketId: testTicketId,
        actionDescription: "Replaced faulty CMOS coin cell.",
        result: "System clock persists across reboots.",
        performedById: 6,
        status: ActionStatus.COMPLETED,
        followUpRequired: false,
      },
    });

    const res = await request(app)
      .get(`/api/tickets/${testTicketId}/actions-taken`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].actionDescription).toBe("Replaced faulty CMOS coin cell.");
    expect(res.body.data[0].performedBy.name).toBe("Supachai Techavichit");
  });

  it("API-06 (AC-04): GET /api/tickets/:id/actions-taken returns 403 Forbidden for non-owning Requester", async () => {
    const res = await request(app)
      .get(`/api/tickets/${testTicketId}/actions-taken`)
      .set("Authorization", `Bearer ${otherRequesterToken}`); // Requester 2 doesn't own ticket

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("API-07 (AC-05): PATCH /api/staff/tickets/:id/actions-taken/:actionId updates action and status", async () => {
    const action = await prisma.actionTaken.create({
      data: {
        ticketId: testTicketId,
        actionDescription: "Dispatched motherboard for micro-soldering.",
        result: "Awaiting board return from vendor lab.",
        performedById: 6,
        status: ActionStatus.IN_PROGRESS,
        followUpRequired: true,
        followUpNote: "Call vendor lab on Friday for status update.",
      },
    });

    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/actions-taken/${action.id}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        result: "Board returned and repaired successfully. All solder joints intact.",
        status: "COMPLETED",
        followUpRequired: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(action.id);
    expect(res.body.data.status).toBe(ActionStatus.COMPLETED);
    expect(res.body.data.result).toBe("Board returned and repaired successfully. All solder joints intact.");
    expect(res.body.data.followUpRequired).toBe(false);
    expect(res.body.data.followUpNote).toBeNull();
  });

  it("API-08 (AC-03): PATCH rejects updating performer to an inactive user", async () => {
    const action = await prisma.actionTaken.create({
      data: {
        ticketId: testTicketId,
        actionDescription: "Initial physical inspection completed.",
        result: "No external physical chassis cracks found.",
        performedById: 6,
        status: ActionStatus.COMPLETED,
      },
    });

    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/actions-taken/${action.id}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        performedById: 9, // Inactive user
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ASSIGNEE");
  });
});
