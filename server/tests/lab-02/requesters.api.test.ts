import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app";

describe("API-01: Development Requesters Endpoint", () => {
  it("GET /api/requesters returns 200 with active requesters only", async () => {
    const response = await request(app).get("/api/requesters");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);

    const requesters = response.body.data;
    expect(requesters.length).toBeGreaterThanOrEqual(4);

    // Verify all returned requesters are active
    requesters.forEach((req: any) => {
      expect(req.isActive).toBe(true);
      expect(req).toHaveProperty("id");
      expect(req).toHaveProperty("name");
      expect(req).toHaveProperty("email");
    });

    // Inactive requester must not appear
    const inactiveFound = requesters.some(
      (req: any) => req.name === "Wandee InactiveUser" || req.isActive === false
    );
    expect(inactiveFound).toBe(false);
  });
});
