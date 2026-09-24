import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";
import { Role, Priority, TicketStatus } from "@prisma/client";
import { generateToken } from "../../src/utils/auth";

describe("API-09 to API-14: Ticket Workflow & Resolution Gate API Tests (Lab 4)", () => {
  const staffToken = generateToken({
    userId: 6,
    email: "staff.supachai@kmutt.ac.th",
    role: Role.STAFF,
    name: "Supachai Techavichit",
  });

  const requesterToken = generateToken({
    userId: 1,
    email: "somchai.pra@kmutt.ac.th",
    role: Role.REQUESTER,
    name: "Somchai Prasert",
  });

  let testTicketId: number;

  beforeEach(async () => {
    await prisma.actionTaken.deleteMany({});
    await prisma.ticketComment.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.ticket.deleteMany({});

    // Seed test ticket owned by Requester 1 in OPEN status
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260924-0010",
        requesterId: 1,
        categoryId: 2, // Hardware
        relatedSystemId: 7, // Corporate Laptop
        summary: "Laptop monitor flickering intermittently",
        description: "Display blinks black every few minutes when connected to external dock.",
        requestedPriority: Priority.HIGH,
        itPriority: Priority.HIGH,
        currentStatus: TicketStatus.OPEN,
        assignedStaffId: 6,
      },
    });

    testTicketId = ticket.id;
  });

  it("API-09 (AC-06): PATCH /api/staff/tickets/:id/status executes valid transition from OPEN to IN_PROGRESS", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        status: "IN_PROGRESS",
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(testTicketId);
    expect(res.body.data.currentStatus).toBe(TicketStatus.IN_PROGRESS);

    // Verify in database
    const inDb = await prisma.ticket.findUnique({ where: { id: testTicketId } });
    expect(inDb?.currentStatus).toBe(TicketStatus.IN_PROGRESS);
  });

  it("API-10 (AC-07): PATCH /api/staff/tickets/:id/status rejects illegal transition with 400 Bad Request", async () => {
    // Put ticket into NEW status
    await prisma.ticket.update({
      where: { id: testTicketId },
      data: { currentStatus: TicketStatus.NEW },
    });

    // Attempt illegal transition from NEW to RESOLVED directly
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        status: "RESOLVED",
        resolutionSummary: "Attempting direct jump to resolved from new status.",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("INVALID_STATUS_TRANSITION");

    // Status remains NEW
    const inDb = await prisma.ticket.findUnique({ where: { id: testTicketId } });
    expect(inDb?.currentStatus).toBe(TicketStatus.NEW);
  });

  it("API-11 (AC-08): PATCH /api/staff/tickets/:id/status rejects transition to RESOLVED when resolutionSummary is missing or < 10 characters", async () => {
    // Move to IN_PROGRESS first
    await prisma.ticket.update({
      where: { id: testTicketId },
      data: { currentStatus: TicketStatus.IN_PROGRESS },
    });

    // Missing resolution summary
    const resMissing = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        status: "RESOLVED",
      });

    expect(resMissing.status).toBe(400);
    expect(resMissing.body.error.code).toBe("RESOLUTION_SUMMARY_REQUIRED");

    // Resolution summary too short (< 10 chars)
    const resShort = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        status: "RESOLVED",
        resolutionSummary: "Fixed it",
      });

    expect(resShort.status).toBe(400);
    expect(resShort.body.error.code).toBe("RESOLUTION_SUMMARY_REQUIRED");

    // Ensure status remains IN_PROGRESS
    const inDb = await prisma.ticket.findUnique({ where: { id: testTicketId } });
    expect(inDb?.currentStatus).toBe(TicketStatus.IN_PROGRESS);
    expect(inDb?.resolvedAt).toBeNull();
  });

  it("API-12 (AC-08): PATCH /api/staff/tickets/:id/status succeeds transitioning to RESOLVED when valid resolutionSummary (>= 10 chars) is provided", async () => {
    // Move to IN_PROGRESS first
    await prisma.ticket.update({
      where: { id: testTicketId },
      data: { currentStatus: TicketStatus.IN_PROGRESS },
    });

    const resolution = "Replaced faulty Thunderbolt 4 cable and updated dock firmware.";
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        status: "RESOLVED",
        resolutionSummary: resolution,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.currentStatus).toBe(TicketStatus.RESOLVED);
    expect(res.body.data.resolutionSummary).toBe(resolution);
    expect(res.body.data.resolvedAt).toBeDefined();

    // Verify in database
    const inDb = await prisma.ticket.findUnique({ where: { id: testTicketId } });
    expect(inDb?.currentStatus).toBe(TicketStatus.RESOLVED);
    expect(inDb?.resolutionSummary).toBe(resolution);
    expect(inDb?.resolvedAt).not.toBeNull();
  });

  it("API-13 (AC-09): PATCH /api/tickets/:id/indicate-resolved sets requesterIndicatedResolved = true without altering currentStatus", async () => {
    // Ticket starts in OPEN status
    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}/indicate-resolved`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.requesterIndicatedResolved).toBe(true);
    expect(res.body.data.currentStatus).toBe(TicketStatus.OPEN);

    // Verify database state: status must still be OPEN
    const inDb = await prisma.ticket.findUnique({ where: { id: testTicketId } });
    expect(inDb?.requesterIndicatedResolved).toBe(true);
    expect(inDb?.currentStatus).toBe(TicketStatus.OPEN);
  });

  it("API-14 (AC-10): PATCH /api/staff/tickets/:id/status returns 409 Conflict when an outdated expectedUpdatedAt is provided", async () => {
    const ticketBefore = await prisma.ticket.findUniqueOrThrow({ where: { id: testTicketId } });

    // Simulate concurrent modification
    const pastTime = new Date(Date.now() - 60000).toISOString();

    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        status: "IN_PROGRESS",
        expectedUpdatedAt: pastTime,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("STALE_UPDATE_CONFLICT");
    expect(res.body.error.currentUpdatedAt).toBeDefined();

    // Now send with exact matching expectedUpdatedAt and verify it succeeds
    const resMatching = await request(app)
      .patch(`/api/staff/tickets/${testTicketId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        status: "IN_PROGRESS",
        expectedUpdatedAt: ticketBefore.updatedAt.toISOString(),
      });

    expect(resMatching.status).toBe(200);
    expect(resMatching.body.data.currentStatus).toBe(TicketStatus.IN_PROGRESS);
  });
});
