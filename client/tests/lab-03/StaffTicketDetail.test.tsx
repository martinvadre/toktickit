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

const mockRequesterUser: api.AuthUser = {
  id: 1,
  name: "Somchai Prasert",
  email: "somchai.pra@kmutt.ac.th",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: false,
};

const mockTicketDetail: api.StaffTicket = {
  id: 101,
  ticketNumber: "TCK-20260915-0001",
  summary: "VPN authentication timeout error",
  description: "Cannot connect to campus VPN from home network during peak hours.",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: "IN_PROGRESS",
  requesterIndicatedResolved: true,
  resolutionSummary: null,
  resolvedAt: null,
  closedAt: null,
  createdAt: "2026-09-15T10:00:00.000Z",
  updatedAt: "2026-09-15T10:30:00.000Z",
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
  category: { id: 4, name: "Network" },
  relatedSystem: { id: 3, name: "VPN Access" },
  attachments: [
    {
      id: 8,
      ticketId: 101,
      fileName: "vpn_diagnostic.log",
      fileSize: 4096,
      mimeType: "text/plain",
      isRemoved: false,
      createdAt: "2026-09-15T10:00:00.000Z",
    },
  ],
  attachmentCount: 1,
  comments: [
    {
      id: 15,
      ticketId: 101,
      authorId: 1,
      content: "Restarted my home router, still times out.",
      isInternal: false,
      createdAt: "2026-09-15T10:15:00.000Z",
      author: { id: 1, name: "Somchai Prasert", role: "REQUESTER" },
    },
    {
      id: 16,
      ticketId: 101,
      authorId: 6,
      content: "Gateway node 3 CPU utilization reached 98%. Rerouting traffic.",
      isInternal: true,
      createdAt: "2026-09-15T10:20:00.000Z",
      author: { id: 6, name: "Supachai Techavichit", role: "STAFF" },
    },
  ],
  commentCount: 2,
};

const mockStaffMembers: api.StaffMember[] = [
  { id: 6, name: "Supachai Techavichit", email: "staff.supachai@kmutt.ac.th", role: "STAFF" },
  { id: 7, name: "Wichai IT", email: "wichai.it@kmutt.ac.th", role: "STAFF" },
];

describe("UI-11 to UI-14: StaffTicketDetail Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_auth_token", "mock-staff-token");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));

    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchStaffTicketDetail").mockResolvedValue(mockTicketDetail);
    vi.spyOn(api, "fetchStaffMembers").mockResolvedValue(mockStaffMembers);
  });

  it("UI-11 (AC-08): renders ticket details, requester info, attachments, and comment timeline", async () => {
    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("TCK-20260915-0001")).toBeInTheDocument();
    });

    expect(screen.getByText("VPN authentication timeout error")).toBeInTheDocument();
    expect(screen.getByText(/Cannot connect to campus VPN/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Somchai Prasert/i).length).toBeGreaterThan(0);
    expect(screen.getByText("vpn_diagnostic.log")).toBeInTheDocument();

    // Verify requester indicated resolved notification banner
    expect(screen.getByText(/Requester Indicated Problem Appears Resolved/i)).toBeInTheDocument();
  });

  it("UI-12 (AC-07): prompts for mandatory resolution summary modal when selecting RESOLVED or CLOSED", async () => {
    const updateStatusSpy = vi.spyOn(api, "updateStaffTicketStatus").mockResolvedValue({
      ...mockTicketDetail,
      currentStatus: "RESOLVED",
      resolutionSummary: "Reconfigured VPN gateway routes and balanced load.",
    });

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("status-select")).toBeInTheDocument();
    });

    const statusSelect = screen.getByTestId("status-select");
    fireEvent.change(statusSelect, { target: { value: "RESOLVED" } });

    // Verify modal appears
    await waitFor(() => {
      expect(screen.getByText("Resolution Summary Required")).toBeInTheDocument();
    });

    const summaryInput = screen.getByTestId("resolution-summary-input");
    const confirmBtn = screen.getByTestId("confirm-resolution-btn");

    // Button disabled when < 10 characters
    fireEvent.change(summaryInput, { target: { value: "Too short" } });
    expect(confirmBtn).toBeDisabled();

    // Provide valid resolution summary
    fireEvent.change(summaryInput, {
      target: { value: "Reconfigured VPN gateway routes and balanced load." },
    });
    expect(confirmBtn).toBeEnabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(updateStatusSpy).toHaveBeenCalledWith(
        101,
        "RESOLVED",
        "Reconfigured VPN gateway routes and balanced load.",
        mockTicketDetail.updatedAt
      );
    });
  });

  it("UI-13 (AC-08): assigns staff member via assignee selector and updates IT Priority", async () => {
    const assignSpy = vi.spyOn(api, "assignTicketStaff").mockResolvedValue({
      ...mockTicketDetail,
      assignedStaff: mockStaffMembers[1],
    });

    const prioritySpy = vi.spyOn(api, "updateTicketPriority").mockResolvedValue({
      ...mockTicketDetail,
      itPriority: "URGENT",
    });

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("assignee-select")).toBeInTheDocument();
    });

    // Change assignee to staff 7 (Wichai IT)
    const assigneeSelect = screen.getByTestId("assignee-select");
    fireEvent.change(assigneeSelect, { target: { value: "7" } });

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith(101, 7);
    });

    // Update IT Priority to URGENT
    const prioritySelect = screen.getByTestId("priority-select");
    fireEvent.change(prioritySelect, { target: { value: "URGENT" } });

    await waitFor(() => {
      expect(prioritySpy).toHaveBeenCalledWith(101, "URGENT");
    });
  });

  it("UI-14 (AC-04): renders internal staff notes with distinct lock icon badge and submits new internal note", async () => {
    const addCommentSpy = vi.spyOn(api, "addStaffComment").mockResolvedValue({
      id: 17,
      ticketId: 101,
      authorId: 6,
      content: "Testing internal operations note.",
      isInternal: true,
      createdAt: "2026-09-15T11:00:00.000Z",
      author: { id: 6, name: "Supachai Techavichit", role: "STAFF" },
    });

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("internal-note-badge")).toBeInTheDocument();
    });

    expect(screen.getByText("🔒 Internal Staff Note")).toBeInTheDocument();
    expect(
      screen.getByText("Gateway node 3 CPU utilization reached 98%. Rerouting traffic.")
    ).toBeInTheDocument();

    // Fill new comment and toggle internal note
    const textarea = screen.getByTestId("comment-textarea");
    fireEvent.change(textarea, { target: { value: "Testing internal operations note." } });

    const toggle = screen.getByTestId("internal-note-toggle");
    fireEvent.click(toggle);

    const submitBtn = screen.getByTestId("submit-comment-btn");
    expect(submitBtn).toHaveTextContent("Post Internal Note");

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(addCommentSpy).toHaveBeenCalledWith(
        101,
        "Testing internal operations note.",
        true
      );
    });
  });

  it("renders Access Denied if the user is not Staff or Admin", async () => {
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockRequesterUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockRequesterUser);

    render(
      <AuthProvider>
        <StaffTicketDetail ticketId={101} onBack={vi.fn()} />
      </AuthProvider>
    );

    expect(await screen.findByText(/Access Denied/i)).toBeInTheDocument();
  });
});
