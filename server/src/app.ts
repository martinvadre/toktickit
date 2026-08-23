import express from "express";
import cors from "cors";
import prisma from "./prisma";
import { validateTicketInput } from "./utils/validation";
import { getNextTicketNumber } from "./utils/ticketNumber";

const app = express();

app.use(cors());
app.use(express.json());

// GET /api/health
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "TokTickIT API",
  });
});

// GET /api/requesters
app.get("/api/requesters", async (req, res) => {
  try {
    const requesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isActive: true,
      },
    });
    res.status(200).json({ data: requesters });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Failed to fetch development requesters",
      },
    });
  }
});

// GET /api/categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true, isActive: true },
    });
    res.status(200).json({ data: categories });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Failed to fetch categories",
      },
    });
  }
});

// GET /api/related-systems
app.get("/api/related-systems", async (req, res) => {
  try {
    const systems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true, isActive: true },
    });
    res.status(200).json({ data: systems });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Failed to fetch related systems",
      },
    });
  }
});

// GET /api/tickets
app.get("/api/tickets", async (req, res) => {
  try {
    const requesterHeader = req.headers["x-requester-id"];
    const requesterId = req.query.requesterId
      ? Number(req.query.requesterId)
      : requesterHeader
      ? Number(requesterHeader)
      : undefined;

    if (!requesterId || isNaN(requesterId)) {
      return res.status(400).json({
        error: {
          code: "UNAUTHORIZED_REQUESTER",
          message: "Valid x-requester-id header or requesterId query parameter is required.",
        },
      });
    }

    const {
      search,
      categoryId,
      status,
      priority,
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Build Prisma where clause with strict requester isolation
    const where: any = {
      requesterId: requesterId,
    };

    if (search && typeof search === "string" && search.trim() !== "") {
      const searchStr = search.trim();
      where.OR = [
        { summary: { contains: searchStr, mode: "insensitive" } },
        { description: { contains: searchStr, mode: "insensitive" } },
        { ticketNumber: { contains: searchStr, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      const catId = Number(categoryId);
      if (!isNaN(catId)) {
        where.categoryId = catId;
      }
    }

    if (status && typeof status === "string" && status.trim() !== "") {
      where.currentStatus = status.toUpperCase();
    }

    if (priority && typeof priority === "string" && priority.trim() !== "") {
      where.requestedPriority = priority.toUpperCase();
    }

    // Build orderBy
    const validSortFields = ["createdAt", "updatedAt", "requestedPriority", "ticketNumber"];
    const sortField = validSortFields.includes(String(sortBy)) ? String(sortBy) : "createdAt";
    const orderDirection = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";

    const [totalItems, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          [sortField]: orderDirection,
        },
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          attachments: {
            where: { isRemoved: false },
            select: { id: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const formattedTickets = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      requesterId: t.requesterId,
      summary: t.summary,
      description: t.description,
      requestedPriority: t.requestedPriority,
      currentStatus: t.currentStatus,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      category: t.category,
      relatedSystem: t.relatedSystem,
      attachmentCount: t.attachments.length,
    }));

    res.status(200).json({
      data: formattedTickets,
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
    console.error("Failed to retrieve tickets:", error);
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Failed to retrieve tickets.",
      },
    });
  }
});

// POST /api/tickets
app.post("/api/tickets", async (req, res) => {
  try {
    const requesterHeader = req.headers["x-requester-id"];
    const requesterId = req.body.requesterId || (requesterHeader ? Number(requesterHeader) : undefined);

    const validation = validateTicketInput({
      ...req.body,
      requesterId,
    });

    if (!validation.isValid || !validation.sanitizedData) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ticket submission data.",
          fieldErrors: validation.fieldErrors,
        },
      });
    }

    const { sanitizedData } = validation;

    // Verify active requester exists
    const requester = await prisma.requesterUser.findFirst({
      where: { id: sanitizedData.requesterId, isActive: true },
    });
    if (!requester) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Active requester not found.",
        },
      });
    }

    // Verify active category exists
    const category = await prisma.category.findFirst({
      where: { id: sanitizedData.categoryId, isActive: true },
    });
    if (!category) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Active category not found.",
        },
      });
    }

    // Verify active related system exists
    const relatedSystem = await prisma.relatedSystem.findFirst({
      where: { id: sanitizedData.relatedSystemId, isActive: true },
    });
    if (!relatedSystem) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Active related system not found.",
        },
      });
    }

    // Generate unique official ticket number
    const ticketNumber = await getNextTicketNumber(prisma);

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId: sanitizedData.requesterId,
        categoryId: sanitizedData.categoryId,
        relatedSystemId: sanitizedData.relatedSystemId,
        summary: sanitizedData.summary,
        description: sanitizedData.description,
        requestedPriority: sanitizedData.requestedPriority || "MEDIUM",
        currentStatus: "NEW",
      },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ data: newTicket });
  } catch (error) {
    console.error("Failed to create ticket:", error);
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Failed to create ticket.",
      },
    });
  }
});

export default app;
