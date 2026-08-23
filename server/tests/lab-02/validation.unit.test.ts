import { describe, it, expect } from "vitest";
import { validateTicketInput } from "../../src/utils/validation";

describe("UNIT-02: Ticket Input Validation Helper (BR-05)", () => {
  it("rejects summary shorter than 5 characters", () => {
    const result = validateTicketInput({
      requesterId: 1,
      categoryId: 1,
      relatedSystemId: 1,
      summary: "Help",
      description: "My laptop is not turning on at all.",
      requestedPriority: "MEDIUM",
    });

    expect(result.isValid).toBe(false);
    const summaryError = result.fieldErrors.find((e) => e.field === "summary");
    expect(summaryError).toBeDefined();
    expect(summaryError?.message).toContain("between 5 and 150 characters");
  });

  it("rejects summary longer than 150 characters", () => {
    const longSummary = "A".repeat(151);
    const result = validateTicketInput({
      requesterId: 1,
      categoryId: 1,
      relatedSystemId: 1,
      summary: longSummary,
      description: "My laptop is not turning on at all.",
    });

    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.some((e) => e.field === "summary")).toBe(true);
  });

  it("rejects description shorter than 10 characters", () => {
    const result = validateTicketInput({
      requesterId: 1,
      categoryId: 1,
      relatedSystemId: 1,
      summary: "Cannot login to VPN",
      description: "Broken",
    });

    expect(result.isValid).toBe(false);
    const descError = result.fieldErrors.find((e) => e.field === "description");
    expect(descError).toBeDefined();
    expect(descError?.message).toContain("between 10 and 3000 characters");
  });

  it("passes validation for valid inputs and assigns default priority", () => {
    const result = validateTicketInput({
      requesterId: 1,
      categoryId: 2,
      relatedSystemId: 7,
      summary: "Battery draining quickly",
      description: "The laptop battery drains within 30 minutes.",
    });

    expect(result.isValid).toBe(true);
    expect(result.fieldErrors.length).toBe(0);
    expect(result.sanitizedData?.requestedPriority).toBe("MEDIUM");
  });
});
