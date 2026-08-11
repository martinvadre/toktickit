import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../src/app";

describe("API Health Check Endpoint", () => {
  it("GET /api/health returns 200 and expected JSON", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "TokTickIT API",
    });
  });
});
