import { describe, it, expect } from "vitest";
import {
  isAllowedMimeType,
  isAllowedFileSize,
  validateRemovalReason,
} from "../../src/utils/attachmentValidator";

describe("UNIT-03: Attachment Validator Utility", () => {
  it("validates allowed MIME types (JPG, PNG, WEBP, PDF)", () => {
    expect(isAllowedMimeType("image/jpeg")).toBe(true);
    expect(isAllowedMimeType("image/png")).toBe(true);
    expect(isAllowedMimeType("image/webp")).toBe(true);
    expect(isAllowedMimeType("application/pdf")).toBe(true);

    expect(isAllowedMimeType("application/zip")).toBe(false);
    expect(isAllowedMimeType("application/x-msdownload")).toBe(false);
    expect(isAllowedMimeType("text/plain")).toBe(false);
  });

  it("validates file size limits (<= 5 MB)", () => {
    expect(isAllowedFileSize(1024)).toBe(true);
    expect(isAllowedFileSize(5 * 1024 * 1024)).toBe(true);
    expect(isAllowedFileSize(5 * 1024 * 1024 + 1)).toBe(false);
    expect(isAllowedFileSize(0)).toBe(false);
  });

  it("validates removal reason string length (3 - 255 chars)", () => {
    expect(validateRemovalReason("Wrong screenshot uploaded").isValid).toBe(true);
    expect(validateRemovalReason("No").isValid).toBe(false);
    expect(validateRemovalReason("").isValid).toBe(false);
    expect(validateRemovalReason(null).isValid).toBe(false);
    expect(validateRemovalReason("A".repeat(256)).isValid).toBe(false);
  });
});
