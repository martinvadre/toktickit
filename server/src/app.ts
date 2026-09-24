import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import prisma from "./prisma";
import { validateTicketInput } from "./utils/validation";
import { getNextTicketNumber } from "./utils/ticketNumber";
import {
  isAllowedMimeType,
  MAX_FILE_SIZE_BYTES,
  MAX_ACTIVE_ATTACHMENTS_PER_TICKET,
  validateRemovalReason,
} from "./utils/attachmentValidator";
import authRoutes from "./routes/auth.routes";
import staffRoutes from "./routes/staff.routes";
import adminRoutes from "./routes/admin.routes";
import { authenticate } from "./middleware/auth";

const app = express();

app.use(cors());
app.use(express.json());
app.use(authenticate);

app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/admin", adminRoutes);

// Set up Multer file upload storage
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

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
    const requesters = await prisma.user.findMany({
      where: { role: "REQUESTER", isActive: true },
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
    const authenticatedUser = (req as any).user;
    let requesterId: number | undefined;

    // BR-03 / API-11: Authenticated REQUESTER identity strictly determines ownership
    if (authenticatedUser && authenticatedUser.role === "REQUESTER") {
      requesterId = authenticatedUser.id;
    } else {
      const requesterHeader = req.headers["x-requester-id"];
      requesterId = req.query.requesterId
        ? Number(req.query.requesterId)
        : requesterHeader
        ? Number(requesterHeader)
        : authenticatedUser?.id;
    }

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

// GET /api/tickets/:id (Ticket Details)
app.get("/api/tickets/:id", async (req, res) => {
  try {
    const authenticatedUser = (req as any).user;
    let requesterId: number | undefined;

    if (authenticatedUser && authenticatedUser.role === "REQUESTER") {
      requesterId = authenticatedUser.id;
    } else {
      const requesterHeader = req.headers["x-requester-id"];
      requesterId = req.query.requesterId
        ? Number(req.query.requesterId)
        : requesterHeader
        ? Number(requesterHeader)
        : authenticatedUser?.id;
    }

    if (!requesterId || isNaN(requesterId)) {
      return res.status(400).json({
        error: {
          code: "UNAUTHORIZED_REQUESTER",
          message: "Valid x-requester-id header or requesterId query parameter is required.",
        },
      });
    }

    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "Invalid ticket ID.",
        },
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true, department: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
        attachments: {
          orderBy: { createdAt: "asc" },
        },
        comments: {
          where: { isInternal: false }, // Strictly omit internal notes for requesters! (API-24 / BR-04)
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, role: true } },
          },
        },
        actionsTaken: {
          orderBy: { actionDateTime: "asc" },
          include: {
            performedBy: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    // Ownership check (AC-09 / BR-03)
    const isStaffOrAdmin = authenticatedUser && (authenticatedUser.role === "STAFF" || authenticatedUser.role === "ADMIN");
    if (!isStaffOrAdmin && ticket.requesterId !== requesterId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to view this ticket.",
        },
      });
    }

    res.status(200).json({ data: ticket });
  } catch (error) {
    console.error("Failed to get ticket detail:", error);
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Failed to get ticket detail.",
      },
    });
  }
});

// GET /api/tickets/:id/actions-taken (Requester & Staff View Actions Taken)
app.get("/api/tickets/:id/actions-taken", async (req, res) => {
  try {
    const authenticatedUser = (req as any).user;
    if (!authenticatedUser) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
    }

    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid ticket ID." },
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

    const isStaffOrAdmin = authenticatedUser.role === "STAFF" || authenticatedUser.role === "ADMIN";
    if (!isStaffOrAdmin && ticket.requesterId !== authenticatedUser.id) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have permission to view actions taken on this ticket." },
      });
    }

    const actions = await prisma.actionTaken.findMany({
      where: { ticketId },
      orderBy: { actionDateTime: "asc" },
      include: {
        performedBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(200).json({ data: actions });
  } catch (error) {
    console.error("Requester fetch actions taken error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Failed to fetch actions taken." },
    });
  }
});

// POST /api/tickets/:id/comments (Public Comments for Requesters & Staff)
app.post("/api/tickets/:id/comments", async (req, res) => {
  try {
    const authenticatedUser = (req as any).user;
    if (!authenticatedUser) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
    }

    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid ticket ID." },
      });
    }

    const { content } = req.body;
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

    // If requester, verify ownership
    if (authenticatedUser.role === "REQUESTER" && ticket.requesterId !== authenticatedUser.id) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have permission to comment on this ticket." },
      });
    }

    // Requesters can NEVER create internal notes (isInternal is always false)
    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: authenticatedUser.id,
        content: content.trim(),
        isInternal: false,
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return res.status(201).json({ data: comment });
  } catch (error) {
    console.error("Requester comment error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Failed to post comment." },
    });
  }
});

// PATCH /api/tickets/:id/indicate-resolved (Requester marks issue as appearing resolved)
app.patch("/api/tickets/:id/indicate-resolved", async (req, res) => {
  try {
    const authenticatedUser = (req as any).user;
    if (!authenticatedUser) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Authentication required." },
      });
    }

    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        error: { code: "INVALID_ID", message: "Invalid ticket ID." },
      });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found." },
      });
    }

    if (authenticatedUser.role === "REQUESTER" && ticket.requesterId !== authenticatedUser.id) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You do not have permission to update this ticket." },
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { requesterIndicatedResolved: true },
    });

    return res.status(200).json({
      data: {
        id: updated.id,
        ticketNumber: updated.ticketNumber,
        currentStatus: updated.currentStatus,
        requesterIndicatedResolved: updated.requesterIndicatedResolved,
      },
    });
  } catch (error) {
    console.error("Indicate resolved error:", error);
    return res.status(500).json({
      error: { code: "SERVER_ERROR", message: "Failed to indicate resolution." },
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
    const requester = await prisma.user.findFirst({
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

// POST /api/tickets/:id/attachments (Upload Attachment)
app.post("/api/tickets/:id/attachments", upload.single("file"), async (req, res) => {
  try {
    const requesterHeader = req.headers["x-requester-id"];
    const requesterId = req.query.requesterId
      ? Number(req.query.requesterId)
      : requesterHeader
      ? Number(requesterHeader)
      : undefined;

    if (!requesterId || isNaN(requesterId)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: {
          code: "UNAUTHORIZED_REQUESTER",
          message: "Valid x-requester-id header or requesterId query parameter is required.",
        },
      });
    }

    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "Invalid ticket ID.",
        },
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found.",
        },
      });
    }

    // Ownership check (AC-09)
    if (ticket.requesterId !== requesterId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to attach files to this ticket.",
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: {
          code: "FILE_REQUIRED",
          message: "No file was uploaded.",
        },
      });
    }

    // MIME type whitelist check
    if (!isAllowedMimeType(req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      return res.status(415).json({
        error: {
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "Unsupported file format. Allowed formats: JPG, PNG, WEBP, PDF.",
        },
      });
    }

    // Max active attachments check (limit: 5)
    const activeCount = await prisma.attachment.count({
      where: {
        ticketId,
        isRemoved: false,
      },
    });

    if (activeCount >= MAX_ACTIVE_ATTACHMENTS_PER_TICKET) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: {
          code: "ATTACHMENT_LIMIT_EXCEEDED",
          message: `Maximum of ${MAX_ACTIVE_ATTACHMENTS_PER_TICKET} active attachments allowed per ticket.`,
        },
      });
    }

    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: req.file.originalname,
        storedFileName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });

    res.status(201).json({ data: attachment });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Failed to upload attachment:", error);
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Failed to upload attachment.",
      },
    });
  }
});

// GET /api/attachments/:id/download (Download Attachment)
app.get("/api/attachments/:id/download", async (req, res) => {
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

    const attachmentId = parseInt(req.params.id, 10);
    if (isNaN(attachmentId)) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "Invalid attachment ID.",
        },
      });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Attachment not found.",
        },
      });
    }

    // Ownership check (AC-09)
    if (attachment.ticket.requesterId !== requesterId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to download this attachment.",
        },
      });
    }

    // Block download if attachment was removed (AC-10, BR-06)
    if (attachment.isRemoved) {
      return res.status(410).json({
        error: {
          code: "ATTACHMENT_REMOVED",
          message: "This attachment has been removed and cannot be downloaded.",
        },
      });
    }

    const filePath = path.join(uploadDir, attachment.storedFileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: {
          code: "FILE_NOT_FOUND",
          message: "Attachment file missing from disk storage.",
        },
      });
    }

    res.download(filePath, attachment.fileName);
  } catch (error) {
    console.error("Failed to download attachment:", error);
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Failed to download attachment.",
      },
    });
  }
});

// DELETE /api/attachments/:id (Soft-remove Attachment)
app.delete("/api/attachments/:id", async (req, res) => {
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

    const reasonValidation = validateRemovalReason(req.body?.reason);
    if (!reasonValidation.isValid) {
      return res.status(400).json({
        error: {
          code: "INVALID_REASON",
          message: reasonValidation.message || "Removal reason is invalid.",
        },
      });
    }

    const attachmentId = parseInt(req.params.id, 10);
    if (isNaN(attachmentId)) {
      return res.status(400).json({
        error: {
          code: "INVALID_ID",
          message: "Invalid attachment ID.",
        },
      });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Attachment not found.",
        },
      });
    }

    // Ownership check (AC-09)
    if (attachment.ticket.requesterId !== requesterId) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to remove this attachment.",
        },
      });
    }

    if (attachment.isRemoved) {
      return res.status(409).json({
        error: {
          code: "ALREADY_REMOVED",
          message: "This attachment is already removed.",
        },
      });
    }

    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removalReason: reasonValidation.sanitizedReason,
        removedAt: new Date(),
      },
    });

    res.status(200).json({ data: updated });
  } catch (error) {
    console.error("Failed to remove attachment:", error);
    res.status(500).json({
      error: {
        code: "SERVER_ERROR",
        message: "Failed to remove attachment.",
      },
    });
  }
});

export default app;
