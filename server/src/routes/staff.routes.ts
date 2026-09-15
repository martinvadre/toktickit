import { Router, Response } from "express";
import { Role, Priority, TicketStatus } from "@prisma/client";
import prisma from "../prisma";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";

const router = Router();

// Restrict all routes in this router to STAFF and ADMIN
router.use(requireRole(Role.STAFF, Role.ADMIN));

/**
 * GET /api/staff/tickets
 * Retrieve the shared IT Staff Ticket Queue with multi-criteria filtering,
 * keyword search, sorting, and pagination across all requesters.
 */
router.get("/tickets", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      search,
      status,
      categoryId,
      relatedSystemId,
      assignedStaffId,
      requestedPriority,
      itPriority,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // 1. Keyword search (ticketNumber, summary, description, requester name, requester email)
    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { requester: { name: { contains: q, mode: "insensitive" } } },
        { requester: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    // 2. Status filter
    if (status && typeof status === "string" && status.trim() !== "" && status !== "ALL") {
      const upperStatus = status.trim().toUpperCase() as TicketStatus;
      where.currentStatus = upperStatus;
    }

    // 3. Category filter
    if (categoryId && categoryId !== "ALL") {
      const catId = Number(categoryId);
      if (!isNaN(catId)) {
        where.categoryId = catId;
      }
    }

    // 4. Related System filter
    if (relatedSystemId && relatedSystemId !== "ALL") {
      const sysId = Number(relatedSystemId);
      if (!isNaN(sysId)) {
        where.relatedSystemId = sysId;
      }
    }

    // 5. Staff Assignment filter
    if (assignedStaffId && assignedStaffId !== "ALL") {
      if (assignedStaffId === "unassigned") {
        where.assignedStaffId = null;
      } else {
        const staffId = Number(assignedStaffId);
        if (!isNaN(staffId)) {
          where.assignedStaffId = staffId;
        }
      }
    }

    // 6. Requested Priority filter
    if (
      requestedPriority &&
      typeof requestedPriority === "string" &&
      requestedPriority.trim() !== "" &&
      requestedPriority !== "ALL"
    ) {
      where.requestedPriority = requestedPriority.trim().toUpperCase() as Priority;
    }

    // 7. IT Priority filter
    if (
      itPriority &&
      typeof itPriority === "string" &&
      itPriority.trim() !== "" &&
      itPriority !== "ALL"
    ) {
      where.itPriority = itPriority.trim().toUpperCase() as Priority;
    }

    // 8. Sorting
    const validSortFields = [
      "createdAt",
      "updatedAt",
      "currentStatus",
      "requestedPriority",
      "itPriority",
      "ticketNumber",
    ];
    const sortField = validSortFields.includes(String(sortBy))
      ? String(sortBy)
      : "createdAt";
    const orderDirection =
      String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

    // Execute queries in parallel
    const [totalItems, tickets, totalCount, unassignedCount, inProgressCount, resolvedCount] =
      await Promise.all([
        prisma.ticket.count({ where }),
        prisma.ticket.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { [sortField]: orderDirection },
          include: {
            requester: {
              select: { id: true, name: true, email: true, department: true },
            },
            assignedStaff: {
              select: { id: true, name: true, email: true },
            },
            category: {
              select: { id: true, name: true },
            },
            relatedSystem: {
              select: { id: true, name: true },
            },
            attachments: {
              where: { isRemoved: false },
              select: { id: true },
            },
            comments: {
              select: { id: true },
            },
          },
        }),
        prisma.ticket.count(),
        prisma.ticket.count({ where: { assignedStaffId: null } }),
        prisma.ticket.count({ where: { currentStatus: TicketStatus.IN_PROGRESS } }),
        prisma.ticket.count({ where: { currentStatus: TicketStatus.RESOLVED } }),
      ]);

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const formattedTickets = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      description: t.description,
      requestedPriority: t.requestedPriority,
      itPriority: t.itPriority || t.requestedPriority,
      currentStatus: t.currentStatus,
      requesterIndicatedResolved: t.requesterIndicatedResolved,
      resolutionSummary: t.resolutionSummary,
      resolvedAt: t.resolvedAt,
      closedAt: t.closedAt,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      requester: t.requester,
      assignedStaff: t.assignedStaff,
      category: t.category,
      relatedSystem: t.relatedSystem,
      attachmentCount: t.attachments.length,
      commentCount: t.comments.length,
    }));

    return res.status(200).json({
      data: formattedTickets,
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
      counts: {
        total: totalCount,
        unassigned: unassignedCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
      },
    });
  } catch (error) {
    console.error("Staff queue retrieval error:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve IT Staff ticket queue.",
      },
    });
  }
});

/**
 * GET /api/staff/members
 * Return active Staff and Admin users for assignment dropdowns.
 */
router.get("/members", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const staffMembers = await prisma.user.findMany({
      where: {
        role: { in: [Role.STAFF, Role.ADMIN] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
      orderBy: { name: "asc" },
    });

    return res.status(200).json({ data: staffMembers });
  } catch (error) {
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch staff members.",
      },
    });
  }
});

// Permitted status transitions matrix (BR-06)
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: [TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  OPEN: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.PENDING_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  ASSIGNED: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.PENDING_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  IN_PROGRESS: [TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.PENDING_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  WAITING_FOR_REQUESTER: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  PENDING_REQUESTER: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  RESOLVED: [TicketStatus.CLOSED, TicketStatus.REOPENED],
  REOPENED: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  CLOSED: [],
  CANCELLED: [],
};

function isValidTransition(from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) return true;
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * GET /api/staff/tickets/:id
 * Retrieve full ticket detail including all public comments and internal notes.
 */
router.get("/tickets/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid ticket ID." },
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true, department: true } },
        assignedStaff: { select: { id: true, name: true, email: true, role: true, department: true } },
        attachments: {
          where: { isRemoved: false },
          orderBy: { createdAt: "asc" },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found." },
      });
    }

    return res.status(200).json({
      data: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        summary: ticket.summary,
        description: ticket.description,
        requestedPriority: ticket.requestedPriority,
        itPriority: ticket.itPriority || ticket.requestedPriority,
        currentStatus: ticket.currentStatus,
        requesterIndicatedResolved: ticket.requesterIndicatedResolved,
        resolutionSummary: ticket.resolutionSummary,
        resolvedAt: ticket.resolvedAt,
        closedAt: ticket.closedAt,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        requester: ticket.requester,
        assignedStaff: ticket.assignedStaff,
        category: ticket.category,
        relatedSystem: ticket.relatedSystem,
        attachments: ticket.attachments,
        comments: ticket.comments,
      },
    });
  } catch (error) {
    console.error("Staff ticket detail error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve ticket detail." },
    });
  }
});

/**
 * PATCH /api/staff/tickets/:id/status
 * Execute valid ticket status transition per BR-06.
 */
router.patch("/tickets/:id/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid ticket ID." },
      });
    }

    const { status, resolutionSummary } = req.body;
    if (!status || typeof status !== "string") {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Status is required." },
      });
    }

    const targetStatus = status.trim().toUpperCase() as TicketStatus;
    if (!Object.values(TicketStatus).includes(targetStatus)) {
      return res.status(400).json({
        error: { code: "INVALID_STATUS", message: `Invalid status: ${status}` },
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found." },
      });
    }

    // Check transition legality (BR-06)
    if (!isValidTransition(ticket.currentStatus, targetStatus)) {
      return res.status(400).json({
        error: {
          code: "INVALID_STATUS_TRANSITION",
          message: `Cannot transition status from ${ticket.currentStatus} to ${targetStatus}.`,
        },
      });
    }

    // Resolution summary requirement for RESOLVED or CLOSED (BR-09)
    if (targetStatus === TicketStatus.RESOLVED || targetStatus === TicketStatus.CLOSED) {
      const summaryText = typeof resolutionSummary === "string" ? resolutionSummary.trim() : (ticket.resolutionSummary || "");
      if (summaryText.length < 10) {
        return res.status(400).json({
          error: {
            code: "RESOLUTION_SUMMARY_REQUIRED",
            message: "A resolution summary of at least 10 characters is required.",
          },
        });
      }
    }

    const updateData: any = {
      currentStatus: targetStatus,
    };

    if (resolutionSummary && typeof resolutionSummary === "string") {
      updateData.resolutionSummary = resolutionSummary.trim();
    }

    if (targetStatus === TicketStatus.RESOLVED && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    if (targetStatus === TicketStatus.CLOSED && !ticket.closedAt) {
      updateData.closedAt = new Date();
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        assignedStaff: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(200).json({
      data: {
        id: updated.id,
        ticketNumber: updated.ticketNumber,
        currentStatus: updated.currentStatus,
        resolutionSummary: updated.resolutionSummary,
        resolvedAt: updated.resolvedAt,
        closedAt: updated.closedAt,
        assignedStaff: updated.assignedStaff,
      },
    });
  } catch (error) {
    console.error("Staff status update error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update ticket status." },
    });
  }
});

/**
 * PATCH /api/staff/tickets/:id/assign
 * Assign ticket to an active Staff or Administrator user (BR-07).
 */
router.patch("/tickets/:id/assign", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid ticket ID." },
      });
    }

    const { assignedStaffId } = req.body;

    if (assignedStaffId !== null && assignedStaffId !== undefined) {
      const staffIdNum = Number(assignedStaffId);
      if (isNaN(staffIdNum)) {
        return res.status(400).json({
          error: { code: "INVALID_ASSIGNEE", message: "Invalid staff ID format." },
        });
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: staffIdNum },
      });

      if (!targetUser || !targetUser.isActive || targetUser.role === Role.REQUESTER) {
        return res.status(400).json({
          error: {
            code: "INVALID_ASSIGNEE",
            message: "Can only assign ticket to an active Staff or Administrator user.",
          },
        });
      }
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found." },
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedStaffId: assignedStaffId ? Number(assignedStaffId) : null,
      },
      include: {
        assignedStaff: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(200).json({
      data: {
        id: updated.id,
        ticketNumber: updated.ticketNumber,
        assignedStaff: updated.assignedStaff,
      },
    });
  } catch (error) {
    console.error("Staff assign error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to assign staff." },
    });
  }
});

/**
 * PATCH /api/staff/tickets/:id/priority
 * Update IT Priority independently from Requested Priority (BR-08).
 */
router.patch("/tickets/:id/priority", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid ticket ID." },
      });
    }

    const { itPriority } = req.body;
    if (!itPriority || typeof itPriority !== "string") {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "itPriority is required." },
      });
    }

    const priorityVal = itPriority.trim().toUpperCase() as Priority;
    if (!Object.values(Priority).includes(priorityVal)) {
      return res.status(400).json({
        error: { code: "INVALID_PRIORITY", message: `Invalid priority: ${itPriority}` },
      });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found." },
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { itPriority: priorityVal },
    });

    return res.status(200).json({
      data: {
        id: updated.id,
        ticketNumber: updated.ticketNumber,
        requestedPriority: updated.requestedPriority,
        itPriority: updated.itPriority,
      },
    });
  } catch (error) {
    console.error("Staff priority update error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update IT priority." },
    });
  }
});

/**
 * POST /api/staff/tickets/:id/comments
 * Add public comment or internal staff note (BR-04, BR-10).
 */
router.post("/tickets/:id/comments", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid ticket ID." },
      });
    }

    const { content, isInternal } = req.body;
    if (!content || typeof content !== "string" || content.trim().length === 0 || content.trim().length > 2000) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Comment content must be non-empty and up to 2000 characters.",
        },
      });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found." },
      });
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: req.user!.id,
        content: content.trim(),
        isInternal: Boolean(isInternal),
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(201).json({ data: comment });
  } catch (error) {
    console.error("Staff comment creation error:", error);
    return res.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to add comment." },
    });
  }
});

export default router;
