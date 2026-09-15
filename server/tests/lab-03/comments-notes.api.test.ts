import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";
import { Role, Priority, TicketStatus } from "@prisma/client";
import { generateToken } from "../../src/utils/auth";

describe("API-23 to API-27: Comments & Notes Privacy API", () => {
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

  const otherRequesterToken = generateToken({
    userId: 2,
    email: "anan.suk@kmutt.ac.th",
    role: Role.REQUESTER,
    name: "Anan Sukjai",
  });

  let testTicketId: number;

  beforeEach(async () => {
    await prisma.ticketComment.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.ticket.deleteMany({});

    // Seed test ticket owned by Requester 1
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260915-0020",
        requesterId: 1,
        categoryId: 4,
        relatedSystemId: 3,
        summary: "VPN credentials fail after reset",
        description: "Password reset completed but login continues to fail.",
        requestedPriority: Priority.MEDIUM,
        itPriority: Priority.MEDIUM,
        currentStatus: TicketStatus.IN_PROGRESS,
        assignedStaffId: 6,
      },
    });

    testTicketId = ticket.id;
  });

  it("API-23 (AC-04): POST /api/staff/tickets/:id/comments creates an internal staff note (isInternal = true)", async () => {
    const res = await request(app)
      .post(`/api/staff/tickets/${testTicketId}/comments`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        content: "LDAP sync delay identified on auth node 2. Re-sync scheduled.",
        isInternal: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe(
      "LDAP sync delay identified on auth node 2. Re-sync scheduled."
    );
    expect(res.body.data.isInternal).toBe(true);
    expect(res.body.data.author.id).toBe(6);
  });

  it("API-24 (AC-04): GET /api/tickets/:id for Requester user strictly omits internal staff notes (isInternal = true)", async () => {
    // Create 1 public comment and 1 internal note
    await prisma.ticketComment.createMany({
      data: [
        {
          ticketId: testTicketId,
          authorId: 6,
          content: "We are currently investigating your authentication issue.",
          isInternal: false,
        },
        {
          ticketId: testTicketId,
          authorId: 6,
          content: "INTERNAL: User password hash was corrupted during migration. Resetting manually.",
          isInternal: true,
        },
      ],
    });

    const res = await request(app)
      .get(`/api/tickets/${testTicketId}`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.comments).toHaveLength(1);
    expect(res.body.data.comments[0].content).toBe(
      "We are currently investigating your authentication issue."
    );
    expect(res.body.data.comments[0].isInternal).toBe(false);

    // Verify internal note is NEVER included
    const contents = res.body.data.comments.map((c: any) => c.content);
    expect(contents.some((c: string) => c.includes("INTERNAL"))).toBe(false);
  });

  it("API-25 (AC-04): GET /api/staff/tickets/:id for Staff/Admin user includes all comments and internal notes with author attribution", async () => {
    // Create 1 public comment and 1 internal note
    await prisma.ticketComment.createMany({
      data: [
        {
          ticketId: testTicketId,
          authorId: 1,
          content: "I tried logging in again today with no success.",
          isInternal: false,
        },
        {
          ticketId: testTicketId,
          authorId: 6,
          content: "Checked RADIUS server log, authentication timeout occurred.",
          isInternal: true,
        },
      ],
    });

    const res = await request(app)
      .get(`/api/staff/tickets/${testTicketId}`)
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.comments).toHaveLength(2);

    const internalComment = res.body.data.comments.find((c: any) => c.isInternal);
    expect(internalComment).toBeDefined();
    expect(internalComment.author.name).toBe("Supachai Techavichit");
  });

  it("API-26 (AC-12): POST /api/tickets/:id/comments allows Requesters to post public comments on their owned tickets", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/comments`)
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({
        content: "I restarted my router and the problem still persists.",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.content).toBe(
      "I restarted my router and the problem still persists."
    );
    expect(res.body.data.isInternal).toBe(false);

    // Rejects commenting by non-owner requester
    const resForbidden = await request(app)
      .post(`/api/tickets/${testTicketId}/comments`)
      .set("Authorization", `Bearer ${otherRequesterToken}`)
      .send({ content: "Sneaky comment attempt" });

    expect(resForbidden.status).toBe(403);
    expect(resForbidden.body.error.code).toBe("FORBIDDEN");
  });

  it("API-27 (AC-12): PATCH /api/tickets/:id/indicate-resolved allows Requester to set requesterIndicatedResolved = true", async () => {
    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}/indicate-resolved`)
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.requesterIndicatedResolved).toBe(true);

    const ticketInDb = await prisma.ticket.findUnique({
      where: { id: testTicketId },
    });
    expect(ticketInDb?.requesterIndicatedResolved).toBe(true);
    // Ticket status should NOT be forced to RESOLVED/CLOSED; formal lifecycle is preserved for staff
    expect(ticketInDb?.currentStatus).toBe(TicketStatus.IN_PROGRESS);
  });
});
