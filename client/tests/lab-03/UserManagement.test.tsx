import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserManagement } from "../../src/components/UserManagement";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

const mockAdminUser: api.AuthUser = {
  id: 10,
  name: "Admin System",
  email: "admin@kmutt.ac.th",
  role: "ADMIN",
  isActive: true,
  mustChangePassword: false,
};

const mockStaffUser: api.AuthUser = {
  id: 6,
  name: "Supachai Techavichit",
  email: "staff.supachai@kmutt.ac.th",
  department: "IT Operations",
  role: "STAFF",
  isActive: true,
  mustChangePassword: false,
};

const mockUsersList: api.AdminUser[] = [
  {
    id: 10,
    name: "Admin System",
    email: "admin@kmutt.ac.th",
    role: "ADMIN",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-08-01T08:00:00.000Z",
  },
  {
    id: 6,
    name: "Supachai Techavichit",
    email: "staff.supachai@kmutt.ac.th",
    department: "IT Operations",
    role: "STAFF",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-08-05T08:00:00.000Z",
  },
  {
    id: 1,
    name: "Somchai Prasert",
    email: "somchai.pra@kmutt.ac.th",
    department: "Computer Engineering",
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-08-10T08:00:00.000Z",
  },
];

describe("UI-15 to UI-18: UserManagement Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_auth_token", "mock-admin-token");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockAdminUser));

    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockAdminUser);
    vi.spyOn(api, "fetchAdminUsers").mockResolvedValue({
      data: mockUsersList,
      pagination: {
        totalItems: 3,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  it("UI-15 (AC-09): renders user table with search and role filter dropdowns", async () => {
    const fetchSpy = vi.spyOn(api, "fetchAdminUsers");

    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    expect(screen.getByText("👥 User Management")).toBeInTheDocument();
    expect(screen.getByTestId("user-search-input")).toBeInTheDocument();
    expect(screen.getByTestId("role-filter-select")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Admin System")).toBeInTheDocument();
      expect(screen.getByText("Supachai Techavichit")).toBeInTheDocument();
      expect(screen.getByText("Somchai Prasert")).toBeInTheDocument();
    });

    // Test search filter input change
    const searchInput = screen.getByTestId("user-search-input");
    fireEvent.change(searchInput, { target: { value: "Supachai" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Supachai",
        })
      );
    });

    // Test role filter change
    const roleSelect = screen.getByTestId("role-filter-select");
    fireEvent.change(roleSelect, { target: { value: "STAFF" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "STAFF",
        })
      );
    });
  });

  it("UI-16 (AC-11): creates a new user via modal form with client validation", async () => {
    const createSpy = vi.spyOn(api, "createAdminUser").mockResolvedValue({
      id: 20,
      name: "Kanya Ratana",
      email: "kanya.rat@kmutt.ac.th",
      department: "Network Engineering",
      role: "STAFF",
      isActive: true,
      mustChangePassword: true,
      createdAt: "2026-09-15T12:00:00.000Z",
    });

    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("create-user-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("create-user-btn"));

    // Modal appears
    expect(screen.getByText("Create New User Account")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("create-name-input"), {
      target: { value: "Kanya Ratana" },
    });
    fireEvent.change(screen.getByTestId("create-email-input"), {
      target: { value: "kanya.rat@kmutt.ac.th" },
    });
    fireEvent.change(screen.getByTestId("create-dept-input"), {
      target: { value: "Network Engineering" },
    });
    fireEvent.change(screen.getByTestId("create-role-select"), {
      target: { value: "STAFF" },
    });
    fireEvent.change(screen.getByTestId("create-password-input"), {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByTestId("submit-create-user-btn"));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith({
        name: "Kanya Ratana",
        email: "kanya.rat@kmutt.ac.th",
        department: "Network Engineering",
        role: "STAFF",
        password: "Password123!",
        isActive: true,
      });
    });
  });

  it("UI-17 (AC-10): modifies user role, updates active status toggle, and respects self-deactivation guardrail", async () => {
    const updateSpy = vi.spyOn(api, "updateAdminUser").mockResolvedValue({
      ...mockUsersList[1],
      department: "Infrastructure Support",
      role: "ADMIN",
    });

    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("edit-user-btn-6")).toBeInTheDocument();
    });

    // 1. Edit Staff user 6
    fireEvent.click(screen.getByTestId("edit-user-btn-6"));

    expect(screen.getByText("Edit User Account")).toBeInTheDocument();
    expect(screen.getByTestId("edit-name-input")).toHaveValue("Supachai Techavichit");

    fireEvent.change(screen.getByTestId("edit-dept-input"), {
      target: { value: "Infrastructure Support" },
    });
    fireEvent.change(screen.getByTestId("edit-role-select"), {
      target: { value: "ADMIN" },
    });

    fireEvent.click(screen.getByTestId("submit-edit-user-btn"));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(6, {
        name: "Supachai Techavichit",
        email: "staff.supachai@kmutt.ac.th",
        department: "Infrastructure Support",
        role: "ADMIN",
        isActive: true,
      });
    });

    // 2. Edit Admin user 10 (self) -> verify self-deactivation guardrail message
    fireEvent.click(screen.getByTestId("edit-user-btn-10"));
    expect(
      screen.getByText(/Self-deactivation is prevented/i)
    ).toBeInTheDocument();
  });

  it("UI-18 (AC-02): triggers initial password reset modal and completes password reset", async () => {
    const resetSpy = vi.spyOn(api, "resetAdminUserPassword").mockResolvedValue({
      message: "Password reset successfully for user Supachai Techavichit.",
      data: {
        ...mockUsersList[1],
        mustChangePassword: true,
      },
    });

    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("reset-pwd-btn-6")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("reset-pwd-btn-6"));

    expect(screen.getByText("Reset User Password")).toBeInTheDocument();
    expect(
      screen.getByText(/forced to change this password immediately on their next login/i)
    ).toBeInTheDocument();

    const pwdInput = screen.getByTestId("reset-password-input");
    fireEvent.change(pwdInput, { target: { value: "TemporaryPass456!" } });

    fireEvent.click(screen.getByTestId("submit-reset-password-btn"));

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith(6, "TemporaryPass456!");
    });
  });

  it("renders Access Denied message if the active user is not an Administrator", async () => {
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);

    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    expect(await screen.findByText(/Access Denied/i)).toBeInTheDocument();
    expect(
      screen.getByText(/restricted to Administrators only/i)
    ).toBeInTheDocument();
  });
});
