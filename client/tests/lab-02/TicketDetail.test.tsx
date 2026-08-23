import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TicketDetail } from "../../src/components/TicketDetail";
import { RequesterProvider } from "../../src/context/RequesterContext";
import * as api from "../../src/api";

const mockRequester: api.RequesterUser = {
  id: 1,
  name: "Somchai Prasert",
  email: "somchai.pra@kmutt.ac.th",
  department: "Computer Engineering",
  isActive: true,
};

const mockTicketWithAttachments: api.Ticket = {
  id: 1,
  ticketNumber: "TCK-20260823-0001",
  requesterId: 1,
  categoryId: 2,
  relatedSystemId: 7,
  summary: "Laptop battery draining fast",
  description: "The laptop battery drains within 30 minutes of unplugging.",
  requestedPriority: "HIGH",
  currentStatus: "NEW",
  createdAt: "2026-08-23T07:15:00.000Z",
  updatedAt: "2026-08-23T07:15:00.000Z",
  category: { id: 2, name: "Hardware" },
  relatedSystem: { id: 7, name: "Corporate Laptop" },
  requester: mockRequester,
  attachments: [
    {
      id: 101,
      ticketId: 1,
      fileName: "error-screenshot.png",
      fileSize: 1024 * 500, // 500 KB
      mimeType: "image/png",
      isRemoved: false,
      createdAt: "2026-08-23T07:16:00.000Z",
    },
  ],
};

describe("UI-06: Ticket Detail & Attachment Management Component", () => {
  beforeEach(() => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue([mockRequester]);
    localStorage.setItem("toktickit_current_requester", JSON.stringify(mockRequester));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders read-only ticket details and active attachments", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValue(mockTicketWithAttachments);

    render(
      <RequesterProvider>
        <TicketDetail ticketId={1} onBack={() => {}} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("TCK-20260823-0001").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Laptop battery draining fast")).toBeInTheDocument();
      expect(screen.getByText("error-screenshot.png")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Download/i })).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /Remove/i })).toBeInTheDocument();
    });
  });

  it("UI-06: handles attachment soft removal with mandatory reason and disables download", async () => {
    vi.spyOn(api, "fetchTicketDetail")
      .mockResolvedValueOnce(mockTicketWithAttachments)
      .mockResolvedValueOnce({
        ...mockTicketWithAttachments,
        attachments: [
          {
            ...mockTicketWithAttachments.attachments![0],
            isRemoved: true,
            removalReason: "Uploaded wrong screenshot",
            removedAt: "2026-08-23T07:20:00.000Z",
          },
        ],
      });

    const removeSpy = vi.spyOn(api, "removeAttachment").mockResolvedValue({
      ...mockTicketWithAttachments.attachments![0],
      isRemoved: true,
      removalReason: "Uploaded wrong screenshot",
      removedAt: "2026-08-23T07:20:00.000Z",
    });

    render(
      <RequesterProvider>
        <TicketDetail ticketId={1} onBack={() => {}} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("error-screenshot.png")).toBeInTheDocument();
    });

    // Click Remove button
    const removeBtn = screen.getByRole("button", { name: /Remove/i });
    fireEvent.click(removeBtn);

    // Modal should appear
    expect(screen.getByText(/Remove Attachment/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Confirm Removal/i });
    expect(confirmBtn).toBeDisabled();

    // Fill reason
    const reasonInput = screen.getByPlaceholderText(/Provide a mandatory reason/i);
    fireEvent.change(reasonInput, { target: { value: "Uploaded wrong screenshot" } });

    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith(101, "Uploaded wrong screenshot", 1);
      expect(screen.getByText("Removed")).toBeInTheDocument();
      expect(screen.getByText(/Uploaded wrong screenshot/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Download/i })).toBeDisabled();
    });
  });

  it("displays 403 Forbidden Access Denied card for unauthorized tickets", async () => {
    const forbiddenError: any = new Error("Forbidden");
    forbiddenError.status = 403;
    forbiddenError.code = "FORBIDDEN";
    vi.spyOn(api, "fetchTicketDetail").mockRejectedValue(forbiddenError);

    render(
      <RequesterProvider>
        <TicketDetail ticketId={999} onBack={() => {}} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Access Denied \(403 Forbidden\)/i)).toBeInTheDocument();
    });
  });
});
