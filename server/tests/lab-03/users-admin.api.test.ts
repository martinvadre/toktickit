import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { generateToken } from "../../src/utils/auth";

describe("API-28 to API-34: Administrator User Management & Safety API", () => {
  const adminToken = generateToken({
    userId: 10,
    email: "admin@kmutt.ac.th",
    role: Role.ADMIN,
    name: "Admin System",
  });

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

  let adminUserId = 10;
  let testStaffUserId: number;

  beforeEach(async () => {
    // Ensure active admin user exists
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Sync Postgres sequence to avoid duplicate ID conflicts on create
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"User"', 'id'), coalesce(max(id), 1)) FROM "User";`
    );

    const adminUser = await prisma.user.upsert({
      where: { email: "admin@kmutt.ac.th" },
      update: {
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
      },
      create: {
        id: 10,
        name: "Admin System",
        email: "admin@kmutt.ac.th",
        passwordHash,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    adminUserId = adminUser.id;

    // Ensure test staff user exists
    const staffUser = await prisma.user.upsert({
      where: { email: "staff.supachai@kmutt.ac.th" },
      update: {
        passwordHash,
        role: Role.STAFF,
        isActive: true,
      },
      create: {
        id: 6,
        name: "Supachai Techavichit",
        email: "staff.supachai@kmutt.ac.th",
        passwordHash,
        department: "IT Operations",
        role: Role.STAFF,
        isActive: true,
      },
    });
    testStaffUserId = staffUser.id;
  });

  it("API-28 (AC-09): GET /api/admin/users returns user list with role and status filtering for Admin users", async () => {
    const res = await request(app)
      .get("/api/admin/users?role=STAFF")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    res.body.data.forEach((u: any) => {
      expect(u.role).toBe("STAFF");
      expect(u.passwordHash).toBeUndefined(); // Security: passwordHash never exposed
    });

    // Verify non-admin is rejected with 403 Forbidden
    const resStaff = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(resStaff.status).toBe(403);
  });

  it("API-29 (AC-11): POST /api/admin/users creates a new user with hashed password and assigned role", async () => {
    const uniqueEmail = `test.user.${Date.now()}@kmutt.ac.th`;

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Kanya Ratana",
        email: uniqueEmail,
        department: "Network Engineering",
        role: "STAFF",
        password: "NewInitialPassword123!",
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Kanya Ratana");
    expect(res.body.data.email).toBe(uniqueEmail.toLowerCase());
    expect(res.body.data.role).toBe("STAFF");
    expect(res.body.data.mustChangePassword).toBe(true);
    expect(res.body.data.passwordHash).toBeUndefined();

    // Verify password is correctly hashed in database
    const createdInDb = await prisma.user.findUnique({
      where: { email: uniqueEmail.toLowerCase() },
    });
    expect(createdInDb).toBeDefined();
    expect(createdInDb?.passwordHash).not.toBe("NewInitialPassword123!");
    const isMatch = await bcrypt.compare(
      "NewInitialPassword123!",
      createdInDb!.passwordHash
    );
    expect(isMatch).toBe(true);
  });

  it("API-30 (AC-11): POST /api/admin/users rejects duplicate email registration with 409 Conflict", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Duplicate Somchai",
        email: "admin@kmutt.ac.th", // Already registered
        role: "REQUESTER",
        password: "Password123!",
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("API-31 (AC-10): PATCH /api/admin/users/:id updates user profile, role, and isActive flag", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${testStaffUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        department: "Enterprise Cloud Support",
        role: "STAFF",
        isActive: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.department).toBe("Enterprise Cloud Support");
  });

  it("API-32 (AC-10): PATCH /api/admin/users/:id rejects deactivating or demoting the last active Administrator", async () => {
    // Ensure only 1 active Admin exists
    await prisma.user.updateMany({
      where: {
        role: Role.ADMIN,
        id: { not: adminUserId },
      },
      data: { isActive: false },
    });

    // Attempt to deactivate the last active admin
    const resDeactivate = await request(app)
      .patch(`/api/admin/users/${adminUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false });

    // Prohibited (either self-deactivation or last-admin protection)
    expect(resDeactivate.status).toBe(400);

    // Attempt to demote the last active admin to STAFF using another admin token if another exists,
    // or verify demotion rejection
    const resDemote = await request(app)
      .patch(`/api/admin/users/${adminUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "STAFF" });

    expect(resDemote.status).toBe(400);
    expect(resDemote.body.error.code).toMatch(/(LAST_ADMIN_PROTECTION|SELF_DEACTIVATION_PROHIBITED)/);
  });

  it("API-33 (AC-10): PATCH /api/admin/users/:id rejects an Administrator deactivating their own account", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("SELF_DEACTIVATION_PROHIBITED");
  });

  it("API-34 (AC-02): POST /api/admin/users/:id/reset-password sets a new initial password and flags mustChangePassword = true", async () => {
    const res = await request(app)
      .post(`/api/admin/users/${testStaffUserId}/reset-password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        newPassword: "ResetPassword123!",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.mustChangePassword).toBe(true);

    // Verify user can log in with reset password and mustChangePassword is true
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "staff.supachai@kmutt.ac.th",
      password: "ResetPassword123!",
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.mustChangePassword).toBe(true);
  });
});
