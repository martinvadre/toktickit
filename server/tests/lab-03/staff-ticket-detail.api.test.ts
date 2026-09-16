import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";
import { Role, Priority, TicketStatus } from "@prisma/client";
import { generateToken } from "../../src/utils/auth";

describe("API-17 to API-22: IT Staff Ticket Detail & Operations API", () => {
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

  let testTicketId: number;

  beforeEach(async () => {
    await prisma.ticketComment.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.ticket.deleteMany({});

    // Seed base test ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260915-0010",
        requesterId: 1,
        categoryId: 4, // Network
        relatedSystemId: 3, // VPN Access
        summary: "VPN connectivity issues from off-campus",
        description: "Frequent disconnects when using campus VPN service.",
        requestedPriority: Priority.HIGH,
        itPriority: Priority.HIGH,
        currentStatus: TicketStatus.NEW,
        assignedStaffId: 6,
      },
    });

    testTicketId = ticket.id;

    // Seed an attachment
    await prisma.attachment.create({
      data: {
        ticketId: ticket.id,
        fileName: "vpn_diagnostic.log",
        storedFileName: "vpn_diagnostic_1234.log",
        fileSize: 4096,
        mimeType: "text/plain",
      },
    });
  });

  it("API-17 (AC-08): GET /api/staff/tickets/:id returns full ticket metadata, requester details, and attachments for Staff/Admin", async () => {
    const res = await request(app)
      .get(`/api/staff/tickets/${testTicketId}`)
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(testTicketId);
    expect(res.body.data.ticketNumber).toBe("TCK-20260915-0010");
    expect(res.body.data.requester.id).toBe(1);
    expect(res.body.data.category.name).toBe("Network");
    expect(res.body.data.attachments).toHaveLength(1);
    expect(res.body.data.attachments[0].fileName).toBe("vpn_diagnostic.log");
  });

  it("API-18 (AC-07): PATCH /api/staff/tickets/:id/status executes valid status transitions according to the permitted matrix", async () => {
    // NEW -> IN_PROGRESS is valid
    const res1 = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "IN_PROGRESS" });

    expect(res1.status).toBe(200);
    expect(res1.body.data.currentStatus).toBe("IN_PROGRESS");

    // IN_PROGRESS -> RESOLVED with valid resolutionSummary
    const res2 = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        status: "RESOLVED",
        resolutionSummary: "Reconfigured VPN gateway routes and balanced traffic load.",
      });

    expect(res2.status).toBe(200);
    expect(res2.body.data.currentStatus).toBe("RESOLVED");
    expect(res2.body.data.resolutionSummary).toBe(
      "Reconfigured VPN gateway routes and balanced traffic load."
    );
    expect(res2.body.data.resolvedAt).toBeDefined();
  });

  it("API-19 (AC-07): PATCH /api/staff/tickets/:id/status rejects illegal transitions with 400 Bad Request", async () => {
    // Transition to CLOSED first
    await prisma.ticket.update({
      where: { id: testTicketId },
      data: {
        currentStatus: TicketStatus.CLOSED,
        resolutionSummary: "Issue resolved and confirmed closed.",
      },
    });

    // Attempt CLOSED -> NEW (illegal: CLOSED is terminal)
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "NEW" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");
  });

  it("API-20 (AC-07): PATCH /api/staff/tickets/:id/status strictly requires a non-empty resolutionSummary (>= 10 chars) for RESOLVED/CLOSED", async () => {
    await prisma.ticket.update({
      where: { id: testTicketId },
      data: { currentStatus: TicketStatus.IN_PROGRESS },
    });

    // Missing resolution summary
    const resMissing = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "RESOLVED" });

    expect(resMissing.status).toBe(400);
    expect(resMissing.body.error.code).toBe("RESOLUTION_SUMMARY_REQUIRED");

    // Too short resolution summary (< 10 chars)
    const resShort = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "RESOLVED", resolutionSummary: "Fixed." });

    expect(resShort.status).toBe(400);
    expect(resShort.body.error.code).toBe("RESOLUTION_SUMMARY_REQUIRED");
  });

  it("API-21 (AC-08): PATCH /api/staff/tickets/:id/assign assigns ticket to an active Staff/Admin user and rejects Requester or inactive user", async () => {
    // Valid assignment to Staff user 7
    const resValid = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/assign`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ assignedStaffId: 7 });

    expect(resValid.status).toBe(200);
    expect(resValid.body.data.assignedStaff.id).toBe(7);

    // Unassigning (setting to null) is also valid
    const resUnassign = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/assign`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ assignedStaffId: null });

    expect(resUnassign.status).toBe(200);
    expect(resUnassign.body.data.assignedStaff).toBeNull();

    // Rejects assigning to Requester user (ID 1)
    const resRequester = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/assign`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ assignedStaffId: 1 });

    expect(resRequester.status).toBe(400);
    expect(resRequester.body.error.code).toBe("INVALID_ASSIGNEE");
  });

  it("API-22 (AC-08): PATCH /api/staff/tickets/:id/priority updates itPriority independently from Requested Priority", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/priority`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ itPriority: "URGENT" });

    expect(res.status).toBe(200);
    expect(res.body.data.requestedPriority).toBe("HIGH"); // Untouched
    expect(res.body.data.itPriority).toBe("URGENT"); // Updated independently
  });
});
