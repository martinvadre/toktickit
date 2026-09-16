import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

describe("API-01 to API-07: Authentication Foundation & Password Change (POST /api/auth/*)", () => {
  beforeEach(async () => {
    // Ensure test users exist with known passwords
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Active Requester
    await prisma.user.upsert({
      where: { email: "somchai.pra@kmutt.ac.th" },
      update: {
        passwordHash,
        isActive: true,
        mustChangePassword: false,
        role: Role.REQUESTER,
      },
      create: {
        id: 1,
        name: "Somchai Prasert",
        email: "somchai.pra@kmutt.ac.th",
        passwordHash,
        department: "Computer Engineering",
        role: Role.REQUESTER,
        isActive: true,
        mustChangePassword: false,
      },
    });

    // Inactive User
    await prisma.user.upsert({
      where: { email: "wandee.old@kmutt.ac.th" },
      update: {
        passwordHash,
        isActive: false,
        role: Role.REQUESTER,
      },
      create: {
        id: 5,
        name: "Wandee InactiveUser",
        email: "wandee.old@kmutt.ac.th",
        passwordHash,
        department: "Former Staff",
        role: Role.REQUESTER,
        isActive: false,
        mustChangePassword: false,
      },
    });

    // IT Staff
    await prisma.user.upsert({
      where: { email: "staff.supachai@kmutt.ac.th" },
      update: {
        passwordHash,
        isActive: true,
        mustChangePassword: false,
        role: Role.STAFF,
      },
      create: {
        id: 6,
        name: "Supachai Techavichit",
        email: "staff.supachai@kmutt.ac.th",
        passwordHash,
        department: "IT Operations",
        role: Role.STAFF,
        isActive: true,
        mustChangePassword: false,
      },
    });

    // User requiring password change
    await prisma.user.upsert({
      where: { email: "firstlogin@kmutt.ac.th" },
      update: {
        passwordHash,
        isActive: true,
        mustChangePassword: true,
        role: Role.REQUESTER,
      },
      create: {
        id: 11,
        name: "First Login User",
        email: "firstlogin@kmutt.ac.th",
        passwordHash,
        department: "Academic Affairs",
        role: Role.REQUESTER,
        isActive: true,
        mustChangePassword: true,
      },
    });
  });

  it("API-01 (AC-01): logs in successfully with valid credentials and returns JWT token + user profile", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "staff.supachai@kmutt.ac.th",
      password: "Password123!",
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user).toMatchObject({
      email: "staff.supachai@kmutt.ac.th",
      name: "Supachai Techavichit",
      role: "STAFF",
      isActive: true,
      mustChangePassword: false,
    });
  });

  it("API-02 (AC-05): rejects login with invalid password (401 Unauthorized)", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "staff.supachai@kmutt.ac.th",
      password: "WrongPassword999!",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty("code", "UNAUTHORIZED");
    expect(res.body.error.message).toMatch(/invalid email or password/i);
  });

  it("API-03 (AC-05): rejects login with non-existent email (401 Unauthorized)", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nonexistent@kmutt.ac.th",
      password: "Password123!",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty("code", "UNAUTHORIZED");
  });

  it("API-04 (AC-05): rejects login for inactive account with lockout message (401 Unauthorized)", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "wandee.old@kmutt.ac.th",
      password: "Password123!",
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty("code", "UNAUTHORIZED");
    expect(res.body.error.message).toMatch(/deactivated/i);
  });

  it("API-05: rejects login with missing email or password (400 Bad Request)", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "staff.supachai@kmutt.ac.th",
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty("code", "VALIDATION_ERROR");
  });

  it("API-06 (AC-01): GET /api/auth/me returns authenticated user details", async () => {
    // 1. Login to get token
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "somchai.pra@kmutt.ac.th",
      password: "Password123!",
    });

    const token = loginRes.body.data.token;

    // 2. Call /api/auth/me
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data).toMatchObject({
      email: "somchai.pra@kmutt.ac.th",
      name: "Somchai Prasert",
      role: "REQUESTER",
      isActive: true,
    });
  });

  it("API-07 (AC-01): GET /api/auth/me rejects request without token (401 Unauthorized)", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error).toHaveProperty("code", "UNAUTHORIZED");
  });

  it("API-08: POST /api/auth/logout succeeds with 200 OK", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/logged out/i);
  });

  it("API-09 (AC-02): changes password successfully and clears mustChangePassword flag", async () => {
    // 1. Login as user requiring password change
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "firstlogin@kmutt.ac.th",
      password: "Password123!",
    });

    expect(loginRes.body.data.user.mustChangePassword).toBe(true);
    const token = loginRes.body.data.token;

    // 2. Submit change password
    const changeRes = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "BrandNewPassword2026!",
        confirmPassword: "BrandNewPassword2026!",
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.data.user.mustChangePassword).toBe(false);

    // 3. Verify user can now log in with the new password
    const newLoginRes = await request(app).post("/api/auth/login").send({
      email: "firstlogin@kmutt.ac.th",
      password: "BrandNewPassword2026!",
    });

    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.data.user.mustChangePassword).toBe(false);
  });

  it("API-10 (AC-02): rejects password change when confirmation does not match (400 Bad Request)", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "somchai.pra@kmutt.ac.th",
      password: "Password123!",
    });
    const token = loginRes.body.data.token;

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "NewPassword123!",
        confirmPassword: "MismatchedPassword123!",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/do not match/i);
  });

  it("API-11 (AC-02): rejects password change when current password is wrong (401 Unauthorized)", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "somchai.pra@kmutt.ac.th",
      password: "Password123!",
    });
    const token = loginRes.body.data.token;

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "IncorrectCurrentPassword123!",
        newPassword: "ValidNewPassword123!",
        confirmPassword: "ValidNewPassword123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/current password is incorrect/i);
  });

  it("API-12 (AC-02): rejects password change when new password fails complexity (400 Bad Request)", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "somchai.pra@kmutt.ac.th",
      password: "Password123!",
    });
    const token = loginRes.body.data.token;

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "simple", // too short, no uppercase, no number, no special char
        confirmPassword: "simple",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/at least 8 characters/i);
  });
});
