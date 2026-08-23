import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RequesterSelect } from "../../src/components/RequesterSelect";
import { RequesterProvider } from "../../src/context/RequesterContext";
import * as api from "../../src/api";

describe("UI-01: Development Requester Selection Screen", () => {
  it("renders active requesters in dropdown and allows selection", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue([
      {
        id: 1,
        name: "Somchai Prasert",
        email: "somchai.pra@kmutt.ac.th",
        department: "Computer Engineering",
        isActive: true,
      },
      {
        id: 2,
        name: "Apinya Sukcharoen",
        email: "apinya.suk@kmutt.ac.th",
        department: "Information Technology",
        isActive: true,
      },
    ]);

    const onContinueMock = vi.fn();

    render(
      <RequesterProvider>
        <RequesterSelect onContinue={onContinueMock} />
      </RequesterProvider>
    );

    // Initial loading state
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Wait for dropdown to be populated
    await waitFor(() => {
      expect(screen.getByLabelText(/Development Requester/i)).toBeInTheDocument();
    });

    // Select requester 1
    const select = screen.getByRole("combobox", { name: /Development Requester/i });
    fireEvent.change(select, { target: { value: "1" } });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /Continue/i });
    fireEvent.click(submitBtn);

    expect(onContinueMock).toHaveBeenCalledTimes(1);
  });

  it("shows validation message when submitting without selecting a requester", async () => {
    vi.spyOn(api, "fetchRequesters").mockResolvedValue([
      {
        id: 1,
        name: "Somchai Prasert",
        email: "somchai.pra@kmutt.ac.th",
        isActive: true,
      },
    ]);

    render(
      <RequesterProvider>
        <RequesterSelect />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Development Requester/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Continue/i });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText(/Please select a development requester to continue/i)
    ).toBeInTheDocument();
  });
});
