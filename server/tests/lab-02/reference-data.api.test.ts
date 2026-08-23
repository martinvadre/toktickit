import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app";

describe("API-02: Reference Data Endpoints", () => {
  it("GET /api/categories returns 200 with seeded active categories", async () => {
    const response = await request(app).get("/api/categories");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);

    const categories = response.body.data;
    expect(categories.length).toBe(4);

    const names = categories.map((c: any) => c.name);
    expect(names).toContain("Account and Access");
    expect(names).toContain("Hardware");
    expect(names).toContain("Software");
    expect(names).toContain("Network");
  });

  it("GET /api/related-systems returns 200 with seeded active systems", async () => {
    const response = await request(app).get("/api/related-systems");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data)).toBe(true);

    const systems = response.body.data;
    expect(systems.length).toBeGreaterThanOrEqual(6);

    const names = systems.map((s: any) => s.name);
    expect(names).toContain("Email System");
    expect(names).toContain("Campus Wi-Fi");
    expect(names).toContain("VPN Access");
    expect(names).toContain("LEB2 Learning Platform");
    expect(names).toContain("Corporate Laptop");
  });
});
