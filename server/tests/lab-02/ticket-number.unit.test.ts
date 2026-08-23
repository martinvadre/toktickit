import { describe, it, expect } from "vitest";
import { generateTicketNumber } from "../../src/utils/ticketNumber";

describe("UNIT-01: Ticket Number Generator Format (BR-01)", () => {
  it("returns ticket number matching format ^TCK-\\d{8}-\\d{4}$", () => {
    const fixedDate = new Date(2026, 7, 23); // Aug 23, 2026
    const ticketNumber = generateTicketNumber(fixedDate, 1);

    expect(ticketNumber).toBe("TCK-20260823-0001");
    expect(ticketNumber).toMatch(/^TCK-\d{8}-\d{4}$/);
  });

  it("pads sequence numbers with leading zeroes up to 4 digits", () => {
    const fixedDate = new Date(2026, 0, 5); // Jan 5, 2026
    expect(generateTicketNumber(fixedDate, 42)).toBe("TCK-20260105-0042");
    expect(generateTicketNumber(fixedDate, 9999)).toBe("TCK-20260105-9999");
  });
});
