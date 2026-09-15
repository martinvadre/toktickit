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

export default router;
