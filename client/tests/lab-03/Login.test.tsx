import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Login } from "../../src/components/Login";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

describe("UI-01 to UI-04: Login Component (client/tests/lab-03/Login.test.tsx)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("UI-01 (AC-01): renders Login form with email/password inputs, sign-in button, and demo shortcuts", () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    expect(screen.getByText("TokTickIT")).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/somchai.pra@kmutt.ac.th/i)).toBeInTheDocument();
    expect(screen.getByText(/staff.supachai@kmutt.ac.th/i)).toBeInTheDocument();
  });

  it("UI-02 (AC-01): displays inline validation error when submitting empty fields", async () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
    });
  });

  it("UI-03 (AC-01): successfully submits valid credentials and triggers onSuccess callback", async () => {
    const onSuccessMock = vi.fn();
    vi.spyOn(api, "loginUser").mockResolvedValue({
      token: "mock-jwt-token-12345",
      user: {
        id: 6,
        name: "Supachai Techavichit",
        email: "staff.supachai@kmutt.ac.th",
        department: "IT Operations",
        role: "STAFF",
        isActive: true,
        mustChangePassword: false,
      },
    });

    render(
      <AuthProvider>
        <Login onSuccess={onSuccessMock} />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "staff.supachai@kmutt.ac.th" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "Password123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(api.loginUser).toHaveBeenCalledWith(
        "staff.supachai@kmutt.ac.th",
        "Password123!"
      );
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it("UI-04 (AC-05): renders server error banner upon invalid credentials or deactivated account", async () => {
    vi.spyOn(api, "loginUser").mockRejectedValue(
      new Error("Invalid email or password.")
    );

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "somchai.pra@kmutt.ac.th" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "WrongPassword!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it("UI-05: clicking quick-fill button automatically populates email and default password", () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const staffShortcut = screen.getByText(/staff.supachai@kmutt.ac.th/i);
    fireEvent.click(staffShortcut);

    expect(screen.getByLabelText(/email address/i)).toHaveValue(
      "staff.supachai@kmutt.ac.th"
    );
    expect(screen.getByLabelText(/password/i)).toHaveValue("Password123!");
  });
});
