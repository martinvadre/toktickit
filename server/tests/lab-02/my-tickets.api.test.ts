import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";

describe("API-05 & API-06: My Tickets Endpoint (GET /api/tickets)", () => {
  beforeEach(async () => {
    // Reset tickets table before each test
    await prisma.ticket.deleteMany({});

    // Create 3 tickets for Requester 1 (Somchai)
    await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260823-1001",
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Cannot access corporate email inbox",
        description: "Outlook displays password prompt continuously.",
        requestedPriority: "HIGH",
        currentStatus: "NEW",
      },
    });

    await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260823-1002",
        requesterId: 1,
        categoryId: 2,
        relatedSystemId: 7,
        summary: "Corporate laptop screen flickering",
        description: "Screen flickers when connected to external monitor.",
        requestedPriority: "MEDIUM",
        currentStatus: "IN_PROGRESS",
      },
    });

    await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260823-1003",
        requesterId: 1,
        categoryId: 4,
        relatedSystemId: 2,
        summary: "Campus Wi-Fi connection drops in Building 3",
        description: "Wi-Fi disconnects every 10 minutes on 3rd floor.",
        requestedPriority: "LOW",
        currentStatus: "RESOLVED",
      },
    });

    // Create 2 tickets for Requester 2 (Apinya)
    await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260823-2001",
        requesterId: 2,
        categoryId: 3,
        relatedSystemId: 4,
        summary: "LEB2 assignment submission button unresponsive",
        description: "Cannot click turn in on Lab 1 assignment page.",
        requestedPriority: "URGENT",
        currentStatus: "NEW",
      },
    });

    await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260823-2002",
        requesterId: 2,
        categoryId: 1,
        relatedSystemId: 3,
        summary: "VPN access token expired",
        description: "Need renewed certificate for remote access.",
        requestedPriority: "MEDIUM",
        currentStatus: "ASSIGNED",
      },
    });
  });

  it("API-05: enforces ownership isolation by x-requester-id header", async () => {
    // Requester 1 query
    const res1 = await request(app).get("/api/tickets").set("x-requester-id", "1");
    expect(res1.status).toBe(200);
    expect(res1.body.data.length).toBe(3);
    res1.body.data.forEach((t: any) => {
      expect(t.requesterId).toBe(1);
    });

    // Requester 2 query
    const res2 = await request(app).get("/api/tickets").set("x-requester-id", "2");
    expect(res2.status).toBe(200);
    expect(res2.body.data.length).toBe(2);
    res2.body.data.forEach((t: any) => {
      expect(t.requesterId).toBe(2);
    });

    // Verify Requester 1 does not see Requester 2's tickets
    const ticketNumbers1 = res1.body.data.map((t: any) => t.ticketNumber);
    expect(ticketNumbers1).not.toContain("TCK-20260823-2001");
    expect(ticketNumbers1).not.toContain("TCK-20260823-2002");
  });

  it("API-06: filters tickets by keyword search, category, status, and priority", async () => {
    // Search keyword
    const searchRes = await request(app)
      .get("/api/tickets?search=flickering")
      .set("x-requester-id", "1");
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].summary).toContain("flickering");

    // Filter by category
    const catRes = await request(app)
      .get("/api/tickets?categoryId=1")
      .set("x-requester-id", "1");
    expect(catRes.status).toBe(200);
    expect(catRes.body.data.length).toBe(1);
    expect(catRes.body.data[0].category.name).toBe("Account and Access");

    // Filter by status
    const statusRes = await request(app)
      .get("/api/tickets?status=IN_PROGRESS")
      .set("x-requester-id", "1");
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.length).toBe(1);
    expect(statusRes.body.data[0].currentStatus).toBe("IN_PROGRESS");

    // Filter by priority
    const priorityRes = await request(app)
      .get("/api/tickets?priority=HIGH")
      .set("x-requester-id", "1");
    expect(priorityRes.status).toBe(200);
    expect(priorityRes.body.data.length).toBe(1);
    expect(priorityRes.body.data[0].requestedPriority).toBe("HIGH");
  });

  it("API-06: paginates ticket results and returns metadata", async () => {
    const pageRes = await request(app)
      .get("/api/tickets?page=1&limit=2")
      .set("x-requester-id", "1");

    expect(pageRes.status).toBe(200);
    expect(pageRes.body.data.length).toBe(2);
    expect(pageRes.body.pagination).toEqual({
      totalItems: 3,
      totalPages: 2,
      currentPage: 1,
      limit: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });
});
