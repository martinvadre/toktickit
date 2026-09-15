import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChangePassword } from "../../src/components/ChangePassword";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

describe("UI-05 to UI-07: ChangePassword Component (client/tests/lab-03/ChangePassword.test.tsx)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem("toktickit_auth_token", "mock-token-abc");
    localStorage.setItem(
      "toktickit_auth_user",
      JSON.stringify({
        id: 11,
        name: "First Login User",
        email: "firstlogin@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: true,
      })
    );
  });

  it("UI-05 (AC-02): renders Change Password screen with current, new, and confirm fields and rules checklist", () => {
    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>
    );

    expect(screen.getByText("Change Your Password")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/current \(temporary\) password/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByText(/be at least 8 characters/i)).toBeInTheDocument();
    expect(
      screen.getByText(/include upper and lower case letters/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/include a number and a special character/i)
    ).toBeInTheDocument();
  });

  it("UI-06 (AC-02): disables Continue button until all complexity rules and password match are satisfied", () => {
    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>
    );

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeDisabled();

    // Fill current password only
    fireEvent.change(screen.getByLabelText(/current \(temporary\) password/i), {
      target: { value: "Password123!" },
    });
    expect(continueBtn).toBeDisabled();

    // Fill weak new password
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "weak" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "weak" },
    });
    expect(continueBtn).toBeDisabled();

    // Fill compliant new password
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "BrandNewPass123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "BrandNewPass123!" },
    });
    expect(continueBtn).toBeEnabled();
  });

  it("UI-07 (AC-02): submits password change request and triggers onSuccess callback", async () => {
    const onSuccessMock = vi.fn();
    vi.spyOn(api, "changeUserPassword").mockResolvedValue({
      message: "Password changed successfully.",
      user: {
        id: 11,
        name: "First Login User",
        email: "firstlogin@kmutt.ac.th",
        role: "REQUESTER",
        isActive: true,
        mustChangePassword: false,
      },
    });

    render(
      <AuthProvider>
        <ChangePassword onSuccess={onSuccessMock} />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/current \(temporary\) password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "BrandNewPass123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "BrandNewPass123!" },
    });

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(api.changeUserPassword).toHaveBeenCalledWith(
        "Password123!",
        "BrandNewPass123!",
        "BrandNewPass123!"
      );
      expect(onSuccessMock).toHaveBeenCalledTimes(1);
    });
  });

  it("UI-08 (AC-02): displays server error message if change password fails", async () => {
    vi.spyOn(api, "changeUserPassword").mockRejectedValue(
      new Error("Current password is incorrect.")
    );

    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/current \(temporary\) password/i), {
      target: { value: "WrongCurrentPass!" },
    });
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "BrandNewPass123!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: "BrandNewPass123!" },
    });

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/current password is incorrect/i)
      ).toBeInTheDocument();
    });
  });
});
