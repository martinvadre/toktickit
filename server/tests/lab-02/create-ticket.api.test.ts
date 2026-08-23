import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app";

describe("API-03 & API-04: Ticket Creation Endpoint (POST /api/tickets)", () => {
  it("API-03: creates a valid ticket with status NEW and official ticketNumber (201 Created)", async () => {
    const payload = {
      requesterId: 1,
      categoryId: 2,
      relatedSystemId: 7,
      summary: "Corporate laptop battery drains rapidly",
      description: "The laptop battery drains within 30 minutes of unplugging even on idle.",
      requestedPriority: "HIGH",
    };

    const response = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", "1")
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toHaveProperty("data");

    const ticket = response.body.data;
    expect(ticket).toHaveProperty("id");
    expect(ticket.ticketNumber).toMatch(/^TCK-\d{8}-\d{4}$/);
    expect(ticket.currentStatus).toBe("NEW");
    expect(ticket.requestedPriority).toBe("HIGH");
    expect(ticket.summary).toBe(payload.summary);
    expect(ticket.description).toBe(payload.description);
    expect(ticket.category.name).toBe("Hardware");
    expect(ticket.relatedSystem.name).toBe("Corporate Laptop");
    expect(ticket.requester.name).toBe("Somchai Prasert");
  });

  it("API-04: returns 400 Bad Request with field-level errors when inputs are invalid", async () => {
    const invalidPayload = {
      requesterId: 1,
      categoryId: null,
      relatedSystemId: null,
      summary: "Hi",
      description: "Too short",
    };

    const response = await request(app)
      .post("/api/tickets")
      .send(invalidPayload);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.fieldErrors.length).toBeGreaterThanOrEqual(3);

    const fields = response.body.error.fieldErrors.map((f: any) => f.field);
    expect(fields).toContain("summary");
    expect(fields).toContain("description");
    expect(fields).toContain("categoryId");
  });
});
