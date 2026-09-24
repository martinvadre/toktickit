import { Router, Response } from "express";
import { Role, TicketStatus } from "@prisma/client";
import prisma from "../prisma";
import { AuthenticatedRequest, requireRole } from "../middleware/auth";

const router = Router();

// Restrict all routes in this router to REQUESTER role
router.use(requireRole(Role.REQUESTER));

/**
 * GET /api/requester/dashboard
 * Retrieve authoritative operational metrics and recent tickets for the authenticated Requester.
 * Strictly isolates query by authenticated requester ID (BR-10, BR-11).
 */
router.get("/dashboard", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUserId = req.user!.id;

    const [
      openCount,
      inProgressCount,
      waitingCount,
      resolvedCount,
      closedCount,
      totalSubmitted,
      recentTickets,
    ] = await Promise.all([
      prisma.ticket.count({
        where: { requesterId: authUserId, currentStatus: TicketStatus.OPEN },
      }),
      prisma.ticket.count({
        where: { requesterId: authUserId, currentStatus: TicketStatus.IN_PROGRESS },
      }),
      prisma.ticket.count({
        where: {
          requesterId: authUserId,
          currentStatus: { in: [TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.PENDING_REQUESTER] },
        },
      }),
      prisma.ticket.count({
        where: { requesterId: authUserId, currentStatus: TicketStatus.RESOLVED },
      }),
      prisma.ticket.count({
        where: { requesterId: authUserId, currentStatus: TicketStatus.CLOSED },
      }),
      prisma.ticket.count({
        where: { requesterId: authUserId },
      }),
      prisma.ticket.findMany({
        where: { requesterId: authUserId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          currentStatus: true,
          requestedPriority: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true } },
          _count: { select: { actionsTaken: true } },
        },
      }),
    ]);

    const formattedRecent = recentTickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      currentStatus: t.currentStatus,
      requestedPriority: t.requestedPriority,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      category: t.category,
      actionCount: t._count.actionsTaken,
    }));

    return res.status(200).json({
      data: {
        metrics: {
          openTickets: openCount,
          inProgressTickets: inProgressCount,
          waitingForRequesterTickets: waitingCount,
          resolvedTickets: resolvedCount,
          closedTickets: closedCount,
          totalSubmitted: totalSubmitted,
        },
        recentTickets: formattedRecent,
        quickActions: [
          { id: "create-ticket", label: "Create Ticket", action: "create-ticket" },
          { id: "my-tickets", label: "View My Tickets", action: "my-tickets" },
        ],
      },
    });
  } catch (error) {
    console.error("Requester dashboard error:", error);
    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve requester dashboard metrics.",
      },
    });
  }
});

export default router;
