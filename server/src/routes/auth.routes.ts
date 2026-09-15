import { Router, Response } from "express";
import prisma from "../prisma";
import {
  comparePassword,
  generateToken,
  hashPassword,
  validatePasswordComplexity,
} from "../utils/auth";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

const router = Router();

/**
 * POST /api/auth/login
 * Public endpoint to authenticate a user with email and password.
 */
router.post("/login", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required.",
        },
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        },
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Account is deactivated. Please contact an administrator.",
        },
      });
    }

    const isMatch = await comparePassword(String(password), user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        },
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return res.status(200).json({
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          role: user.role,
          isActive: user.isActive,
          mustChangePassword: user.mustChangePassword,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred during authentication.",
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate session on client side.
 */
router.post("/logout", (_req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    data: {
      message: "Successfully logged out.",
    },
  });
});

/**
 * GET /api/auth/me
 * Return profile of currently authenticated user.
 */
router.get("/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.status(200).json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
    },
  });
});

/**
 * POST /api/auth/change-password
 * Complete mandatory first-login or user-initiated password change.
 */
router.post(
  "/change-password",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const user = req.user!;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Current password, new password, and confirmation are required.",
          },
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "New password and confirmation password do not match.",
          },
        });
      }

      const isCurrentMatch = await comparePassword(
        String(currentPassword),
        user.passwordHash
      );
      if (!isCurrentMatch) {
        return res.status(401).json({
          error: {
            code: "UNAUTHORIZED",
            message: "Current password is incorrect.",
          },
        });
      }

      const complexity = validatePasswordComplexity(String(newPassword));
      if (!complexity.isValid) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: complexity.message,
          },
        });
      }

      const newPasswordHash = await hashPassword(String(newPassword));

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          mustChangePassword: false,
        },
      });

      return res.status(200).json({
        data: {
          message: "Password changed successfully.",
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            mustChangePassword: updatedUser.mustChangePassword,
          },
        },
      });
    } catch (error) {
      console.error("Change password error:", error);
      return res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to change password.",
        },
      });
    }
  }
);

export default router;
