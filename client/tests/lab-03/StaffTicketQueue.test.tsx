import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StaffTicketQueue } from "../../src/components/StaffTicketQueue";
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
  department: "Computer Engineering",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: false,
};

const mockTickets: api.StaffTicket[] = [
  {
    id: 101,
    ticketNumber: "TCK-20260915-0001",
    summary: "VPN authentication timeout error",
    description: "Cannot connect to VPN from home network",
    requestedPriority: "HIGH",
    itPriority: "URGENT",
    currentStatus: "IN_PROGRESS",
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
    attachmentCount: 1,
    commentCount: 2,
  },
  {
    id: 102,
    ticketNumber: "TCK-20260915-0002",
    summary: "Laptop battery bulging and overheating",
    description: "Hardware defect on corporate laptop",
    requestedPriority: "URGENT",
    itPriority: "HIGH",
    currentStatus: "NEW",
    createdAt: "2026-09-15T11:00:00.000Z",
    updatedAt: "2026-09-15T11:00:00.000Z",
    requester: {
      id: 2,
      name: "Anan Sukjai",
      email: "anan.suk@kmutt.ac.th",
      department: "Civil Engineering",
      isActive: true,
    },
    assignedStaff: null,
    category: { id: 2, name: "Hardware" },
    relatedSystem: { id: 7, name: "Corporate Laptop" },
    attachmentCount: 0,
    commentCount: 0,
  },
];

const mockStaffMembers: api.StaffMember[] = [
  {
    id: 6,
    name: "Supachai Techavichit",
    email: "staff.supachai@kmutt.ac.th",
    role: "STAFF",
  },
  {
    id: 7,
    name: "Wichai IT",
    email: "wichai.it@kmutt.ac.th",
    role: "STAFF",
  },
];

const mockCategories: api.Category[] = [
  { id: 2, name: "Hardware" },
  { id: 4, name: "Network" },
];

const mockSystems: api.RelatedSystem[] = [
  { id: 3, name: "VPN Access" },
  { id: 7, name: "Corporate Laptop" },
];

describe("UI-08 to UI-10: StaffTicketQueue Component (client/tests/lab-03/StaffTicketQueue.test.tsx)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_auth_token", "mock-staff-token");
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockStaffUser));

    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockStaffUser);
    vi.spyOn(api, "fetchStaffMembers").mockResolvedValue(mockStaffMembers);
    vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue(mockSystems);

    vi.spyOn(api, "fetchStaffTickets").mockResolvedValue({
      data: mockTickets,
      pagination: {
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      counts: {
        total: 2,
        unassigned: 1,
        inProgress: 1,
        resolved: 0,
      },
    });
  });

  it("UI-08 (AC-06): fetches and renders ticket rows with Status and IT Priority badges and summary counters", async () => {
    render(
      <AuthProvider>
        <StaffTicketQueue />
      </AuthProvider>
    );

    // Verify title and KPI counters
    expect(screen.getByText(/IT Staff Ticket Queue/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("count-total")).toHaveTextContent("2");
      expect(screen.getByTestId("count-unassigned")).toHaveTextContent("1");
      expect(screen.getByTestId("count-in-progress")).toHaveTextContent("1");
    });

    // Verify rendered tickets
    expect(screen.getAllByText("TCK-20260915-0001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TCK-20260915-0002").length).toBeGreaterThan(0);
    expect(screen.getAllByText("VPN authentication timeout error").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Laptop battery bulging and overheating").length).toBeGreaterThan(0);

    // Verify badges
    expect(screen.getAllByText(/URGENT/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/IN PROGRESS/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Unassigned/i).length).toBeGreaterThan(0);
  });

  it("UI-09 (AC-06): filters table items dynamically when search terms or filter dropdowns change", async () => {
    const fetchSpy = vi.spyOn(api, "fetchStaffTickets");

    render(
      <AuthProvider>
        <StaffTicketQueue />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    // Type in search box
    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "VPN" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "VPN",
        })
      );
    });

    // Change status dropdown to IN_PROGRESS
    const statusSelect = screen.getByTestId("status-filter");
    fireEvent.change(statusSelect, { target: { value: "IN_PROGRESS" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "IN_PROGRESS",
        })
      );
    });

    // Change category dropdown to 4 (Network)
    const categorySelect = screen.getByTestId("category-filter");
    fireEvent.change(categorySelect, { target: { value: "4" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: "4",
        })
      );
    });

    // Change assignee dropdown to unassigned
    const assigneeSelect = screen.getByTestId("assignee-filter");
    fireEvent.change(assigneeSelect, { target: { value: "unassigned" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedStaffId: "unassigned",
        })
      );
    });
  });

  it("UI-10 (AC-06): renders pagination controls and responds to page change clicks", async () => {
    const fetchSpy = vi.spyOn(api, "fetchStaffTickets").mockResolvedValue({
      data: mockTickets,
      pagination: {
        totalItems: 25,
        totalPages: 3,
        currentPage: 1,
        limit: 10,
        hasNextPage: true,
        hasPreviousPage: false,
      },
      counts: {
        total: 25,
        unassigned: 5,
        inProgress: 10,
        resolved: 10,
      },
    });

    render(
      <AuthProvider>
        <StaffTicketQueue />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/i)).toBeInTheDocument();
    });

    const nextBtn = screen.getByTestId("next-page-btn");
    expect(nextBtn).toBeEnabled();

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });
  });

  it("UI-10b (AC-06): clears all filters when clicking Clear Filters", async () => {
    const fetchSpy = vi.spyOn(api, "fetchStaffTickets");

    render(
      <AuthProvider>
        <StaffTicketQueue />
      </AuthProvider>
    );

    const searchInput = screen.getByTestId("search-input");
    fireEvent.change(searchInput, { target: { value: "Hardware" } });

    await waitFor(() => {
      expect(screen.getByTestId("clear-filters-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("clear-filters-btn"));

    await waitFor(() => {
      expect(searchInput).toHaveValue("");
      expect(fetchSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: undefined,
          status: "ALL",
          categoryId: "ALL",
        })
      );
    });
  });

  it("UI-10c (AC-06): invokes onSelectTicket callback when clicking ticket link or action button", async () => {
    const onSelectTicketMock = vi.fn();

    render(
      <AuthProvider>
        <StaffTicketQueue onSelectTicket={onSelectTicketMock} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("TCK-20260915-0001").length).toBeGreaterThan(0);
    });

    const ticketLink = screen.getAllByText("TCK-20260915-0001")[0];
    fireEvent.click(ticketLink);

    expect(onSelectTicketMock).toHaveBeenCalledWith(101);
  });

  it("UI-10d (AC-06): renders Access Denied message if the active user is a Requester", async () => {
    localStorage.setItem("toktickit_auth_user", JSON.stringify(mockRequesterUser));
    vi.spyOn(api, "fetchCurrentUser").mockResolvedValue(mockRequesterUser);

    render(
      <AuthProvider>
        <StaffTicketQueue />
      </AuthProvider>
    );

    expect(await screen.findByText(/Access Denied/i)).toBeInTheDocument();
    expect(
      screen.getByText(/restricted to IT Staff and Administrators/i)
    ).toBeInTheDocument();
  });

  it("UI-10e (AC-06): renders empty state message when no tickets are returned", async () => {
    vi.spyOn(api, "fetchStaffTickets").mockResolvedValue({
      data: [],
      pagination: {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      counts: {
        total: 0,
        unassigned: 0,
        inProgress: 0,
        resolved: 0,
      },
    });

    render(
      <AuthProvider>
        <StaffTicketQueue />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("No Tickets Found")).toBeInTheDocument();
    });
  });
});
