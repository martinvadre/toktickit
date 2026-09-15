import { Request, Response, NextFunction } from "express";
import { Role, User } from "@prisma/client";
import prisma from "../prisma";
import { verifyToken } from "../utils/auth";

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Universal Authentication Middleware:
 * 1. Checks `Authorization: Bearer <token>`
 * 2. If valid, attaches `req.user`
 * 3. Supports legacy `x-requester-id` for backwards compatibility with Lab 2 tests
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers["authorization"];

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (payload) {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
        });

        if (user && user.isActive) {
          req.user = user;
          return next();
        }
      }
    }

    // Fallback for legacy Lab 2 test cases using x-requester-id
    const legacyRequesterId = req.headers["x-requester-id"];
    if (legacyRequesterId) {
      const parsedId = Number(legacyRequesterId);
      if (!isNaN(parsedId)) {
        const user = await prisma.user.findUnique({
          where: { id: parsedId },
        });
        if (user && user.isActive) {
          req.user = user;
          return next();
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
}

/**
 * Guard middleware requiring an authenticated user session.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication token missing or invalid.",
      },
    });
  }
  next();
}

/**
 * Guard middleware enforcing minimum permitted roles.
 */
export function requireRole(...permittedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication token missing or invalid.",
        },
      });
    }

    if (!permittedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Requires one of roles: ${permittedRoles.join(
            ", "
          )}`,
        },
      });
    }

    next();
  };
}
