import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CreateTicket } from "../../src/components/CreateTicket";
import { RequesterProvider } from "../../src/context/RequesterContext";
import * as api from "../../src/api";

const mockRequester: api.RequesterUser = {
  id: 1,
  name: "Somchai Prasert",
  email: "somchai.pra@kmutt.ac.th",
  department: "Computer Engineering",
  isActive: true,
};

describe("UI-02 & UI-03: Create Ticket Form Component", () => {
  beforeEach(() => {
    vi.spyOn(api, "fetchCategories").mockResolvedValue([
      { id: 1, name: "Account and Access", isActive: true },
      { id: 2, name: "Hardware", isActive: true },
    ]);
    vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue([
      { id: 1, name: "Email System", isActive: true },
      { id: 7, name: "Corporate Laptop", isActive: true },
    ]);
    vi.spyOn(api, "fetchRequesters").mockResolvedValue([mockRequester]);
    localStorage.setItem("toktickit_current_requester", JSON.stringify(mockRequester));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("UI-02: shows field-level inline error messages on invalid empty submit", async () => {
    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    // Wait for reference data to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Submit Ticket/i });
    fireEvent.click(submitBtn);

    // Verify inline field error messages
    await waitFor(() => {
      expect(screen.getByText(/Please select a Category/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a Related System/i)).toBeInTheDocument();
      expect(screen.getByText(/Summary is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
    });
  });

  it("UI-03: displays error banner and preserves form values when API fails", async () => {
    vi.spyOn(api, "createTicket").mockRejectedValue(new Error("Database connection timed out."));

    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    // Fill form fields
    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: "2" } });

    const systemSelect = screen.getByLabelText(/Related System/i);
    fireEvent.change(systemSelect, { target: { value: "7" } });

    const summaryInput = screen.getByLabelText(/Summary/i);
    fireEvent.change(summaryInput, { target: { value: "Laptop screen flickering intermittently" } });

    const descInput = screen.getByLabelText(/Detailed Description/i);
    fireEvent.change(descInput, { target: { value: "The screen flickers every time brightness is adjusted above 50%." } });

    const submitBtn = screen.getByRole("button", { name: /Submit Ticket/i });
    fireEvent.click(submitBtn);

    // Verify error banner is displayed
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Database connection timed out/i);
    });

    // Verify all input values are preserved!
    expect((summaryInput as HTMLInputElement).value).toBe("Laptop screen flickering intermittently");
    expect((descInput as HTMLTextAreaElement).value).toBe(
      "The screen flickers every time brightness is adjusted above 50%."
    );
    expect((categorySelect as HTMLSelectElement).value).toBe("2");
    expect((systemSelect as HTMLSelectElement).value).toBe("7");
  });
});
