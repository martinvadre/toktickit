import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";

describe("Categories Endpoint", () => {
  it("GET /api/categories returns the four seeded categories", async () => {
    vi.spyOn(prisma.category, "findMany").mockResolvedValue([
      { id: 1, name: "Account and Access" },
      { id: 2, name: "Hardware" },
      { id: 3, name: "Software" },
      { id: 4, name: "Network" },
    ] as any);

    const response = await request(app).get("/api/categories");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: 1, name: "Account and Access" },
      { id: 2, name: "Hardware" },
      { id: 3, name: "Software" },
      { id: 4, name: "Network" },
    ]);
  });
});
