import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { Role } from "@prisma/client";
import { authenticate, requireAuth, requireRole } from "../../src/middleware/auth";
import { generateToken } from "../../src/utils/auth";

describe("API-08 to API-11: Authorization & RBAC Middleware", () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(authenticate);

  // Protected route for authenticated users
  testApp.get("/test/protected", requireAuth, (req, res) => {
    res.status(200).json({ status: "ok", user: (req as any).user });
  });

  // Protected route for STAFF and ADMIN
  testApp.get("/test/staff-only", requireRole(Role.STAFF, Role.ADMIN), (req, res) => {
    res.status(200).json({ status: "ok", message: "Staff access granted" });
  });

  // Protected route strictly for ADMIN
  testApp.get("/test/admin-only", requireRole(Role.ADMIN), (req, res) => {
    res.status(200).json({ status: "ok", message: "Admin access granted" });
  });

  it("API-08 (AC-01): rejects unauthenticated requests with 401 Unauthorized", async () => {
    const res = await request(testApp).get("/test/protected");
    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty("code", "UNAUTHORIZED");
  });

  it("API-09 (AC-01): rejects REQUESTER from accessing STAFF route with 403 Forbidden", async () => {
    const requesterToken = generateToken({
      userId: 1,
      email: "somchai.pra@kmutt.ac.th",
      role: Role.REQUESTER,
      name: "Somchai Prasert",
    });

    const res = await request(testApp)
      .get("/test/staff-only")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toHaveProperty("code", "FORBIDDEN");
  });

  it("API-10 (AC-01): allows STAFF to access STAFF route with 200 OK", async () => {
    const staffToken = generateToken({
      userId: 6,
      email: "staff.supachai@kmutt.ac.th",
      role: Role.STAFF,
      name: "Supachai Techavichit",
    });

    const res = await request(testApp)
      .get("/test/staff-only")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/staff access granted/i);
  });

  it("API-11 (AC-01): rejects STAFF from accessing ADMIN route with 403 Forbidden", async () => {
    const staffToken = generateToken({
      userId: 6,
      email: "staff.supachai@kmutt.ac.th",
      role: Role.STAFF,
      name: "Supachai Techavichit",
    });

    const res = await request(testApp)
      .get("/test/admin-only")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toHaveProperty("code", "FORBIDDEN");
  });

  it("API-12 (AC-01): allows ADMIN to access ADMIN route with 200 OK", async () => {
    const adminToken = generateToken({
      userId: 10,
      email: "admin@kmutt.ac.th",
      role: Role.ADMIN,
      name: "Admin System",
    });

    const res = await request(testApp)
      .get("/test/admin-only")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/admin access granted/i);
  });
});
