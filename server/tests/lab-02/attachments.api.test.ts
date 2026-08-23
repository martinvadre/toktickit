import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs";
import app from "../../src/app";
import prisma from "../../src/prisma";

describe("API-08 to API-11: Attachment Lifecycle (Upload, Download, Soft-Removal)", () => {
  let testTicketId: number;
  const sampleFileName = "test-sample.png";
  const dummyFilePath = path.join(process.cwd(), "uploads", sampleFileName);

  beforeEach(async () => {
    // Ensure test sample file exists on disk
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(dummyFilePath, Buffer.from("dummy-png-content"));

    await prisma.attachment.deleteMany({});
    await prisma.ticket.deleteMany({});

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: "TCK-20260823-4001",
        requesterId: 1,
        categoryId: 2,
        relatedSystemId: 7,
        summary: "Hardware replacement request",
        description: "Need new power adapter for laptop.",
        requestedPriority: "MEDIUM",
        currentStatus: "NEW",
      },
    });
    testTicketId = ticket.id;
  });

  it("API-08: uploads valid attachment and returns 201 Created", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/attachments`)
      .set("x-requester-id", "1")
      .attach("file", Buffer.from("fake image bytes"), {
        filename: "screenshot.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("id");
    expect(res.body.data.fileName).toBe("screenshot.png");
    expect(res.body.data.mimeType).toBe("image/png");
    expect(res.body.data.isRemoved).toBe(false);
  });

  it("API-09: rejects upload with invalid file format (415 Unsupported Media Type)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/attachments`)
      .set("x-requester-id", "1")
      .attach("file", Buffer.from("fake exe bytes"), {
        filename: "malware.exe",
        contentType: "application/x-msdownload",
      });

    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("API-09: rejects upload when exceeding 5 active attachments (400 Bad Request)", async () => {
    // Seed 5 active attachments
    for (let i = 1; i <= 5; i++) {
      await prisma.attachment.create({
        data: {
          ticketId: testTicketId,
          fileName: `attachment-${i}.png`,
          storedFileName: sampleFileName,
          fileSize: 1024,
          mimeType: "image/png",
          isRemoved: false,
        },
      });
    }

    const res = await request(app)
      .post(`/api/tickets/${testTicketId}/attachments`)
      .set("x-requester-id", "1")
      .attach("file", Buffer.from("6th file"), {
        filename: "attachment-6.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("ATTACHMENT_LIMIT_EXCEEDED");
  });

  it("API-10: soft-removes attachment with required reason", async () => {
    const attachment = await prisma.attachment.create({
      data: {
        ticketId: testTicketId,
        fileName: "accidental-upload.pdf",
        storedFileName: sampleFileName,
        fileSize: 2048,
        mimeType: "application/pdf",
        isRemoved: false,
      },
    });

    // Test rejection without reason
    const invalidRes = await request(app)
      .delete(`/api/attachments/${attachment.id}`)
      .set("x-requester-id", "1")
      .send({ reason: "" });

    expect(invalidRes.status).toBe(400);

    // Test valid soft removal
    const validRes = await request(app)
      .delete(`/api/attachments/${attachment.id}`)
      .set("x-requester-id", "1")
      .send({ reason: "Uploaded by mistake, wrong document attached." });

    expect(validRes.status).toBe(200);
    expect(validRes.body.data.isRemoved).toBe(true);
    expect(validRes.body.data.removalReason).toBe("Uploaded by mistake, wrong document attached.");
    expect(validRes.body.data.removedAt).toBeDefined();
  });

  it("API-11: download succeeds for active attachments and returns 410 Gone for removed attachments (AC-10)", async () => {
    const activeAtt = await prisma.attachment.create({
      data: {
        ticketId: testTicketId,
        fileName: "active-doc.png",
        storedFileName: sampleFileName,
        fileSize: 1024,
        mimeType: "image/png",
        isRemoved: false,
      },
    });

    const removedAtt = await prisma.attachment.create({
      data: {
        ticketId: testTicketId,
        fileName: "removed-doc.png",
        storedFileName: sampleFileName,
        fileSize: 1024,
        mimeType: "image/png",
        isRemoved: true,
        removalReason: "Document deprecated",
        removedAt: new Date(),
      },
    });

    // Active download -> 200
    const activeRes = await request(app)
      .get(`/api/attachments/${activeAtt.id}/download`)
      .set("x-requester-id", "1");
    expect(activeRes.status).toBe(200);

    // Removed download -> 410 Gone
    const removedRes = await request(app)
      .get(`/api/attachments/${removedAtt.id}/download`)
      .set("x-requester-id", "1");
    expect(removedRes.status).toBe(410);
    expect(removedRes.body.error.code).toBe("ATTACHMENT_REMOVED");
  });
});
