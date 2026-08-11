import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../../src/App";
import * as api from "../../src/api";

describe("TokTickIT App Component", () => {
  it("TokTickIT heading renders", () => {
    render(<App />);
    expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Check System/i })).toBeInTheDocument();
  });

  it("Loading state changes to category list on success", async () => {
    vi.spyOn(api, "checkSystem").mockResolvedValue({
      status: "Online",
      categories: [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
        { id: 3, name: "Software" },
        { id: 4, name: "Network" },
      ],
    });

    render(<App />);
    const checkBtn = screen.getByRole("button", { name: /Check System/i });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText("Online")).toBeInTheDocument();
      expect(screen.getByText("Account and Access")).toBeInTheDocument();
      expect(screen.getByText("Hardware")).toBeInTheDocument();
      expect(screen.getByText("Software")).toBeInTheDocument();
      expect(screen.getByText("Network")).toBeInTheDocument();
    });
  });

  it("API failure displays a useful error message", async () => {
    vi.spyOn(api, "checkSystem").mockResolvedValue({
      status: "Offline",
      categories: [],
      error: "Unable to connect to TokTickIT API",
    });

    render(<App />);
    const checkBtn = screen.getByRole("button", { name: /Check System/i });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText("Offline")).toBeInTheDocument();
      expect(screen.getByText("Unable to connect to TokTickIT API")).toBeInTheDocument();
    });
  });
});
