import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MyTickets } from "../../src/components/MyTickets";
import { RequesterProvider } from "../../src/context/RequesterContext";
import * as api from "../../src/api";

const mockRequester: api.RequesterUser = {
  id: 1,
  name: "Somchai Prasert",
  email: "somchai.pra@kmutt.ac.th",
  department: "Computer Engineering",
  isActive: true,
};

const mockTickets: api.TicketListItem[] = [
  {
    id: 1,
    ticketNumber: "TCK-20260823-0001",
    requesterId: 1,
    summary: "Laptop battery draining fast",
    requestedPriority: "HIGH",
    currentStatus: "NEW",
    createdAt: "2026-08-23T07:15:00.000Z",
    updatedAt: "2026-08-23T07:15:00.000Z",
    category: { id: 2, name: "Hardware" },
    relatedSystem: { id: 7, name: "Corporate Laptop" },
    attachmentCount: 1,
  },
  {
    id: 2,
    ticketNumber: "TCK-20260823-0002",
    requesterId: 1,
    summary: "Wi-Fi connection error on 3rd floor",
    requestedPriority: "LOW",
    currentStatus: "RESOLVED",
    createdAt: "2026-08-23T07:20:00.000Z",
    updatedAt: "2026-08-23T07:20:00.000Z",
    category: { id: 4, name: "Network" },
    relatedSystem: { id: 2, name: "Campus Wi-Fi" },
    attachmentCount: 0,
  },
];

describe("UI-05: My Tickets Component (Search, Filter, Sort, Pagination)", () => {
  beforeEach(() => {
    vi.spyOn(api, "fetchCategories").mockResolvedValue([
      { id: 1, name: "Account and Access", isActive: true },
      { id: 2, name: "Hardware", isActive: true },
      { id: 4, name: "Network", isActive: true },
    ]);
    vi.spyOn(api, "fetchRequesters").mockResolvedValue([mockRequester]);
    localStorage.setItem("toktickit_current_requester", JSON.stringify(mockRequester));
  });

  it("renders tickets in table and cards with ticket numbers and badges", async () => {
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      data: mockTickets,
      pagination: {
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    render(
      <RequesterProvider>
        <MyTickets />
      </RequesterProvider>
    );

    await waitFor(() => {
      const tck1 = screen.getAllByText("TCK-20260823-0001");
      expect(tck1.length).toBeGreaterThanOrEqual(1);

      const summary1 = screen.getAllByText("Laptop battery draining fast");
      expect(summary1.length).toBeGreaterThanOrEqual(1);

      const tck2 = screen.getAllByText("TCK-20260823-0002");
      expect(tck2.length).toBeGreaterThanOrEqual(1);

      const summary2 = screen.getAllByText("Wi-Fi connection error on 3rd floor");
      expect(summary2.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("triggers search and filter queries on input change", async () => {
    const fetchSpy = vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      data: [mockTickets[0]],
      pagination: {
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    render(
      <RequesterProvider>
        <MyTickets />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search by ticket number or summary/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by ticket number or summary/i);
    fireEvent.change(searchInput, { target: { value: "battery" } });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "battery",
        })
      );
    });
  });

  it("displays empty state message when requester has no tickets", async () => {
    vi.spyOn(api, "fetchMyTickets").mockResolvedValue({
      data: [],
      pagination: {
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });

    render(
      <RequesterProvider>
        <MyTickets />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/You haven't submitted any tickets yet/i)
      ).toBeInTheDocument();
    });
  });
});
