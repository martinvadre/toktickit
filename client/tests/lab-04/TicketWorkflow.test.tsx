import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

const mockStaffUser: api.AuthUser = {
  id: 6,
  name: "Supachai Techavichit",
  email: "staff.supachai@kmutt.ac.th",
  department: "IT Operations",
  role: "STAFF",
  isActive: true,
  mustChangePassword: false,
};

const mockOpenTicket: api.StaffTicket = {
  id: 101,
  ticketNumber: "TCK-20260924-0010",
  summary: "Laptop monitor flickering intermittently",
  description: "Display blinks black every few minutes when connected to external dock.",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: "OPEN",
  requesterIndicatedResolved: false,
  resolutionSummary: null,
  resolvedAt: null,
  closedAt: null,
  createdAt: "2026-09-24T08:00:00.000Z",
  updatedAt: "2026-09-24T08:30:00.000Z",
  requester: {
    id: 1,
    name: "Somchai Prasert",
    email: "somchai.pra@kmutt.ac.th",
    department: "Computer Engineering",
    isActive: true,
  },
  assignedStaff: {
    id: 6,
    name: "Supachai Techavichit",
    email: "staff.supachai@kmutt.ac.th",
    role: "STAFF",
  },
  category: { id: 2, name: "Hardware" },
  relatedSystem: { id: 7, name: "Corporate Laptop" },
  attachments: [],
  attachmentCount: 0,
  comments: [],
  commentCount: 0,
  actionsTaken: [],
};

const mockStaffMembers: api.StaffMember[] = [
  { id: 6, name: "Supachai Techavichit", email: "staff.supachai@kmutt.ac.th", role: "STAFF" },
];

describe("UI-05 to UI-07: Ticket Workflow & Resolution Gate Component Tests (Lab 4)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_auth_token", "mock-staff-token");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));

    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue(mockOpenTicket);
    vi.spyOn(api, "fetchStaffMembers").mockResolvedValue(mockStaffMembers);
  });

  it("UI-05 (AC-06): Displays only permitted status transition options based on current ticket status", async () => {
    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status-select")).toBeInTheDocument();
    });

    const statusSelect = screen.getByTestId("status-select") as HTMLSelectElement;
    const optionValues = Array.from(statusSelect.options).map((opt) => opt.value);

    // Permitted transitions for OPEN: OPEN (current), IN_PROGRESS, PENDING_REQUESTER, RESOLVED, CANCELLED
    expect(optionValues).toContain("OPEN");
    expect(optionValues).toContain("IN_PROGRESS");
    expect(optionValues).toContain("RESOLVED");
    expect(optionValues).toContain("CANCELLED");

    // Illegal transitions from OPEN (e.g. CLOSED, NEW) must NOT be present
    expect(optionValues).not.toContain("CLOSED");
    expect(optionValues).not.toContain("NEW");
  });

  it("UI-06 (AC-08): Opens resolution modal when selecting RESOLVED, enforcing minimum 10-character input", async () => {
    const updateSpy = vi.spyOn(api, "updateStaffTicketStatus").mockResolvedValue({
      ...mockOpenTicket,
      currentStatus: "RESOLVED",
      resolutionSummary: "Replaced faulty Thunderbolt 4 cable and updated dock firmware.",
    });

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status-select")).toBeInTheDocument();
    });

    // Select RESOLVED
    fireEvent.change(screen.getByTestId("status-select"), { target: { value: "RESOLVED" } });

    // Resolution modal should appear
    await waitFor(() => {
      expect(screen.getByText("Resolution Summary Required")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByTestId("confirm-resolution-btn") as HTMLButtonElement;
    const input = screen.getByTestId("resolution-summary-input") as HTMLTextAreaElement;

    // Disabled initially (< 10 chars)
    expect(confirmBtn).toBeDisabled();

    // Type short text (< 10 chars)
    fireEvent.change(input, { target: { value: "Fixed it" } });
    expect(confirmBtn).toBeDisabled();

    // Type valid resolution statement (>= 10 chars)
    const validSummary = "Replaced faulty Thunderbolt 4 cable and updated dock firmware.";
    fireEvent.change(input, { target: { value: validSummary } });
    expect(confirmBtn).not.toBeDisabled();

    // Submit resolution
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        101,
        "RESOLVED",
        validSummary,
        mockOpenTicket.updatedAt
      );
    });
  });

  it("UI-07 (AC-10): Displays conflict alert banner if API returns 409 Conflict", async () => {
    const conflictError: any = new Error("This ticket has been modified by another user. Please refresh.");
    conflictError.status = 409;
    conflictError.code = "STALE_UPDATE_CONFLICT";

    vi.spyOn(api, "updateStaffTicketStatus").mockRejectedValue(conflictError);

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status-select")).toBeInTheDocument();
    });

    // Trigger status transition to IN_PROGRESS
    fireEvent.change(screen.getByTestId("status-select"), { target: { value: "IN_PROGRESS" } });

    // Expect conflict alert banner to appear
    await waitFor(() => {
      expect(screen.getByTestId("conflict-alert-banner")).toBeInTheDocument();
    });

    expect(screen.getByText(/Stale Update Conflict/i)).toBeInTheDocument();
    expect(screen.getByText(/This ticket has been modified by another user/i)).toBeInTheDocument();

    // Clicking Refresh button should clear conflict banner and reload data
    const refreshBtn = screen.getByTestId("refresh-conflict-btn");
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(screen.queryByTestId("conflict-alert-banner")).not.toBeInTheDocument();
    });
  });
});
