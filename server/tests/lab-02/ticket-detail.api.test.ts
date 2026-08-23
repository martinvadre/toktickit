import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";

describe("API-07: Ticket Detail Endpoint & Cross-Requester Access Rejection (GET /api/tickets/:id)", () => {
  let requester1TicketId: number;

  beforeEach(async () => {
    await prisma.attachment.deleteMany({});
    await prisma.ticket.deleteMany({});

    // Create ticket for Requester 1 (Somchai)
    const t1 = await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260823-3001",
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Somchai's confidential password reset request",
        description: "Please reset password for my main account.",
        requestedPriority: "HIGH",
        currentStatus: "NEW",
      },
    });
    requester1TicketId = t1.id;
  });

  it("returns 200 OK with full ticket relations when accessed by ticket owner", async () => {
    const res = await request(app)
      .get(`/api/tickets/${requester1TicketId}`)
      .set("x-requester-id", "1");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("id", requester1TicketId);
    expect(res.body.data.summary).toBe("Somchai's confidential password reset request");
    expect(res.body.data.requester.name).toBe("Somchai Prasert");
    expect(res.body.data.category.name).toBe("Account and Access");
  });

  it("API-07: returns 403 Forbidden when accessed by non-owner requester (AC-09)", async () => {
    // Requester 2 (Apinya) attempts to view Requester 1's ticket
    const res = await request(app)
      .get(`/api/tickets/${requester1TicketId}`)
      .set("x-requester-id", "2");

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});
