import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";

describe("Categories Endpoint", () => {
  it("GET /api/categories returns the four seeded categories", async () => {
    vi.spyOn(prisma.category, "findMany").mockResolvedValue([
      { id: 1, name: "Account and Access", isActive: true },
      { id: 2, name: "Hardware", isActive: true },
      { id: 3, name: "Software", isActive: true },
      { id: 4, name: "Network", isActive: true },
    ] as any);

    const response = await request(app).get("/api/categories");
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.body).toEqual({
      data: [
        { id: 1, name: "Account and Access", isActive: true },
        { id: 2, name: "Hardware", isActive: true },
        { id: 3, name: "Software", isActive: true },
        { id: 4, name: "Network", isActive: true },
      ],
    });

    const ids = response.body.data.map((cat: any) => cat.id);
    expect(ids).toEqual([...ids].sort((a: number, b: number) => a - b));
  });
});
