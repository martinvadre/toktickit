import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StaffDashboard } from "../../src/components/StaffDashboard";
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

const mockAdminUser: api.AuthUser = {
  id: 10,
  name: "Admin System",
  email: "admin@kmutt.ac.th",
  department: "IT Operations",
  role: "ADMIN",
  isActive: true,
  mustChangePassword: false,
};

const mockStaffData: api.StaffDashboardData = {
  metrics: {
    unassignedTickets: 4,
    myAssignedTickets: 3,
    newTickets: 2,
    openTickets: 5,
    inProgressTickets: 6,
    waitingForRequesterTickets: 2,
    resolvedTickets: 12,
    highOrUrgentTickets: 5,
    totalActiveTickets: 15,
  },
  urgentTickets: [
    {
      id: 201,
      ticketNumber: "TCK-20260924-0021",
      summary: "Core data switch failure in datacenter",
      currentStatus: "IN_PROGRESS",
      requestedPriority: "URGENT",
      itPriority: "URGENT",
      assignedStaff: { id: 6, name: "Supachai Techavichit" },
      requester: { id: 1, name: "Somchai Prasert" },
      createdAt: "2026-09-24T07:00:00.000Z",
      updatedAt: "2026-09-24T08:00:00.000Z",
      actionCount: 2,
    },
  ],
  recentTickets: [
    {
      id: 202,
      ticketNumber: "TCK-20260924-0022",
      summary: "Workstation memory upgrade request",
      currentStatus: "OPEN",
      requestedPriority: "LOW",
      itPriority: "LOW",
      assignedStaff: null,
      requester: { id: 2, name: "Apinya Sukcharoen" },
      createdAt: "2026-09-24T08:30:00.000Z",
      updatedAt: "2026-09-24T08:45:00.000Z",
    },
  ],
};

const mockAdminData: api.AdminDashboardData = {
  staffMetrics: mockStaffData.metrics,
  urgentTickets: mockStaffData.urgentTickets,
  recentTickets: mockStaffData.recentTickets,
  userSummary: {
    totalUsers: 30,
    activeStaff: 6,
    activeAdmins: 2,
    activeRequesters: 21,
    inactiveUsers: 1,
  },
};

describe("UI-11 to UI-13: Staff Dashboard Component Tests (Lab 4)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("UI-11 (AC-12): Renders IT Staff operational metric cards", async () => {
    localStorage.setItem("toktickit_auth_token", "mock-staff-token");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));

    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffData);

    render(
      <AuthProvider>
        <StaffDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("staff-dashboard")).toBeInTheDocument();
    });

    expect(screen.getByTestId("count-unassigned")).toHaveTextContent("4");
    expect(screen.getByTestId("count-my-assigned")).toHaveTextContent("3");
    expect(screen.getByTestId("count-in-progress")).toHaveTextContent("6");
    expect(screen.getByTestId("count-waiting")).toHaveTextContent("2");
    expect(screen.getByTestId("count-high-urgent")).toHaveTextContent("5");
    expect(screen.getByTestId("count-total-active")).toHaveTextContent("15");

    // Urgent tickets rendered
    expect(screen.getByText("TCK-20260924-0021")).toBeInTheDocument();
    expect(screen.getByText("Core data switch failure in datacenter")).toBeInTheDocument();

    // Admin card should NOT be present for STAFF role
    expect(screen.queryByTestId("admin-user-summary-card")).not.toBeInTheDocument();
  });

  it("UI-12 (AC-12): Clicking Unassigned card navigates to queue with unassigned filter", async () => {
    localStorage.setItem("toktickit_auth_token", "mock-staff-token");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));

    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(mockStaffData);

    const navigateSpy = vi.fn();

    render(
      <AuthProvider>
        <StaffDashboard onNavigateToQueue={navigateSpy} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("staff-dashboard")).toBeInTheDocument();
    });

    // Click Unassigned card
    fireEvent.click(screen.getByTestId("metric-unassigned"));
    expect(navigateSpy).toHaveBeenCalledWith("assignedStaffId", "unassigned");

    // Click My Assigned card
    fireEvent.click(screen.getByTestId("metric-my-assigned"));
    expect(navigateSpy).toHaveBeenCalledWith("assignedStaffId", "6");
  });

  it("UI-13 (AC-13): When user is Admin, renders User Management Summary card", async () => {
    localStorage.setItem("toktickit_auth_token", "mock-admin-token");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockAdminUser));

    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockAdminUser);
    vi.spyOn(api, "fetchAdminDashboard").mockResolvedValue(mockAdminData);

    const manageUsersSpy = vi.fn();

    render(
      <AuthProvider>
        <StaffDashboard onNavigateToUsers={manageUsersSpy} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("admin-user-summary-card")).toBeInTheDocument();
    });

    expect(screen.getByTestId("admin-total-users")).toHaveTextContent("30");
    expect(screen.getByTestId("admin-active-staff")).toHaveTextContent("6");
    expect(screen.getByTestId("admin-active-admins")).toHaveTextContent("2");
    expect(screen.getByTestId("admin-active-requesters")).toHaveTextContent("21");

    // Clicking Manage Users button
    const manageBtn = screen.getByTestId("admin-manage-users-btn");
    fireEvent.click(manageBtn);
    expect(manageUsersSpy).toHaveBeenCalled();
  });
});
