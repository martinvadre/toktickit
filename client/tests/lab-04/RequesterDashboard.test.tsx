import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RequesterDashboard } from "../../src/components/RequesterDashboard";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

const mockRequesterUser: api.AuthUser = {
  id: 1,
  name: "Somchai Prasert",
  email: "somchai.pra@kmutt.ac.th",
  department: "Computer Engineering",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: false,
};

const mockDashboardData: api.RequesterDashboardData = {
  metrics: {
    openTickets: 3,
    inProgressTickets: 2,
    waitingForRequesterTickets: 1,
    resolvedTickets: 5,
    closedTickets: 4,
    totalSubmitted: 15,
  },
  recentTickets: [
    {
      id: 101,
      ticketNumber: "TCK-20260924-0001",
      summary: "Laptop battery drains quickly",
      currentStatus: "IN_PROGRESS",
      requestedPriority: "HIGH",
      createdAt: "2026-09-24T08:00:00.000Z",
      updatedAt: "2026-09-24T09:00:00.000Z",
      category: { id: 2, name: "Hardware" },
      actionCount: 2,
    },
    {
      id: 102,
      ticketNumber: "TCK-20260924-0002",
      summary: "VPN access timeout",
      currentStatus: "OPEN",
      requestedPriority: "MEDIUM",
      createdAt: "2026-09-24T09:15:00.000Z",
      updatedAt: "2026-09-24T09:15:00.000Z",
      category: { id: 4, name: "Network" },
      actionCount: 0,
    },
  ],
  quickActions: [
    { id: "create-ticket", label: "Create Ticket", action: "create-ticket" },
    { id: "my-tickets", label: "View My Tickets", action: "my-tickets" },
  ],
};

describe("UI-08 to UI-10: Requester Dashboard Component Tests (Lab 4)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_auth_token", "mock-token");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockRequesterUser));

    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockRequesterUser);
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);
  });

  it("UI-08 (AC-11): Renders Requester metric cards with correct values", async () => {
    render(
      <AuthProvider>
        <RequesterDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("requester-dashboard")).toBeInTheDocument();
    });

    expect(screen.getByTestId("count-open")).toHaveTextContent("3");
    expect(screen.getByTestId("count-in-progress")).toHaveTextContent("2");
    expect(screen.getByTestId("count-waiting")).toHaveTextContent("1");
    expect(screen.getByTestId("count-resolved")).toHaveTextContent("5");
    expect(screen.getByTestId("count-total")).toHaveTextContent("15");
  });

  it("UI-09 (AC-11): Clicking metric card triggers drill-down to My Tickets with appropriate filter", async () => {
    const navigateSpy = vi.fn();

    render(
      <AuthProvider>
        <RequesterDashboard onNavigateToTickets={navigateSpy} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("requester-dashboard")).toBeInTheDocument();
    });

    // Click Open Tickets card
    fireEvent.click(screen.getByTestId("metric-open"));
    expect(navigateSpy).toHaveBeenCalledWith("OPEN");

    // Click In Progress card
    fireEvent.click(screen.getByTestId("metric-in-progress"));
    expect(navigateSpy).toHaveBeenCalledWith("IN_PROGRESS");

    // Click Resolved card
    fireEvent.click(screen.getByTestId("metric-resolved"));
    expect(navigateSpy).toHaveBeenCalledWith("RESOLVED");
  });

  it("UI-10 (AC-11): Renders recent tickets list and quick action buttons", async () => {
    const createTicketSpy = vi.fn();
    const selectTicketSpy = vi.fn();

    render(
      <AuthProvider>
        <RequesterDashboard
          onCreateTicket={createTicketSpy}
          onSelectTicket={selectTicketSpy}
        />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("recent-tickets-table")).toBeInTheDocument();
    });

    expect(screen.getByText("TCK-20260924-0001")).toBeInTheDocument();
    expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();
    expect(screen.getByText("2 actions")).toBeInTheDocument();
    expect(screen.getByText("TCK-20260924-0002")).toBeInTheDocument();

    // Quick action button triggers callback
    const createBtn = screen.getByTestId("quick-create-ticket");
    fireEvent.click(createBtn);
    expect(createTicketSpy).toHaveBeenCalled();

    // Clicking ticket row triggers select
    const ticketRow = screen.getByTestId("recent-ticket-row-101");
    fireEvent.click(ticketRow);
    expect(selectTicketSpy).toHaveBeenCalledWith(101);
  });
});
