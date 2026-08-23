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
