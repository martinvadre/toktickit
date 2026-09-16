import { Router, Response } from "express";
import { Role } from "@prisma/client";
import prisma from "../prisma";
import bcrypt from "bcryptjs";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";

const router = Router();

// Guard all admin routes: restricted to ADMIN role only
router.use(requireRole(Role.ADMIN));

/**
 * GET /api/admin/users
 * List users with search, role filter, active status filter, and pagination.
 */
router.get("/users", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search,
      role,
      isActive,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Search by name or email
    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    // Role filter
    if (role && role !== "ALL") {
      const upperRole = String(role).toUpperCase();
      if (Object.values(Role).includes(upperRole as Role)) {
        where.role = upperRole as Role;
      }
    }

    // Active status filter
    if (isActive !== undefined && isActive !== "ALL") {
      where.isActive = String(isActive).toLowerCase() === "true";
    }

    const validSortFields = ["id", "name", "email", "role", "createdAt", "updatedAt"];
    const sortField = validSortFields.includes(String(sortBy)) ? String(sortBy) : "createdAt";
    const orderDirection = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

    const [totalItems, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: orderDirection },
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    return res.status(200).json({
      data: users,
      meta: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages,
      },
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Admin user list error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve users." },
    });
  }
});

/**
 * POST /api/admin/users
 * Create a new user account with hashed password and role assignment.
 */
router.post("/users", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, department, role, password, isActive = true } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "User name is required." },
      });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "A valid email address is required." },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!role || !Object.values(Role).includes(String(role).toUpperCase() as Role)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "A valid user role is required (REQUESTER, STAFF, ADMIN)." },
      });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Initial password must be at least 8 characters." },
      });
    }

    // Check duplicate email (AC-11 / BR-12)
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return res.status(409).json({
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: `User with email '${normalizedEmail}' already exists.`,
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        department: department && typeof department === "string" ? department.trim() : null,
        role: String(role).toUpperCase() as Role,
        passwordHash,
        isActive: Boolean(isActive),
        mustChangePassword: true, // Initial password forces change at first login
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ data: newUser });
  } catch (error) {
    console.error("Admin user creation error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to create user account." },
    });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Modify user details, role, or active status with safety guardrails (BR-11 / AC-10).
 */
router.patch("/users/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid user ID." },
      });
    }

    const { name, email, department, role, isActive } = req.body;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "User not found." },
      });
    }

    // Guardrail 1: Self-deactivation prohibited (BR-11 / AC-10 / API-33)
    if (req.user && req.user.id === targetUser.id && isActive === false) {
      return res.status(400).json({
        error: {
          code: "SELF_DEACTIVATION_PROHIBITED",
          message: "Administrators cannot deactivate their own account.",
        },
      });
    }

    // Guardrail 2: Last active Admin protection (BR-11 / AC-10 / API-32)
    // Prohibit deactivating or demoting the last active administrator
    const isTargetActiveAdmin = targetUser.role === Role.ADMIN && targetUser.isActive;
    const willBeDemotedOrDeactivated =
      (isActive === false && isTargetActiveAdmin) ||
      (role && String(role).toUpperCase() !== Role.ADMIN && isTargetActiveAdmin);

    if (willBeDemotedOrDeactivated) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: Role.ADMIN,
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          error: {
            code: "LAST_ADMIN_PROTECTION",
            message: "Cannot deactivate or demote the last active Administrator.",
          },
        });
      }
    }

    const updateData: any = {};

    if (name && typeof name === "string") {
      updateData.name = name.trim();
    }

    if (department !== undefined) {
      updateData.department = department && typeof department === "string" ? department.trim() : null;
    }

    if (role && typeof role === "string") {
      const upperRole = role.trim().toUpperCase() as Role;
      if (Object.values(Role).includes(upperRole)) {
        updateData.role = upperRole;
      }
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (email && typeof email === "string") {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== targetUser.email) {
        const existing = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (existing) {
          return res.status(409).json({
            error: {
              code: "EMAIL_ALREADY_EXISTS",
              message: `User with email '${normalizedEmail}' already exists.`,
            },
          });
        }
        updateData.email = normalizedEmail;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ data: updated });
  } catch (error) {
    console.error("Admin user update error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update user account." },
    });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Set a new initial password and force password change at next login (BR-02 / API-34).
 */
router.post("/users/:id/reset-password", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid user ID." },
      });
    }

    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "New password must be at least 8 characters.",
        },
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "User not found." },
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
      },
    });

    return res.status(200).json({
      message: `Password reset successfully for user ${targetUser.name}.`,
      data: updated,
    });
  } catch (error) {
    console.error("Admin password reset error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to reset user password." },
    });
  }
});

export default router;
