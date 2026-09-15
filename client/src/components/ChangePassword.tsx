import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface ChangePasswordProps {
  onSuccess?: () => void;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({ onSuccess }) => {
  const { user, changePassword, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password rules validation
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isComplex = hasMinLen && hasUpper && hasLower && hasNumber && hasSpecial;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentPassword) {
      setErrorMsg("Current password is required.");
      return;
    }

    if (!isComplex) {
      setErrorMsg("New password does not meet the complexity requirements.");
      return;
    }

    if (!isMatch) {
      setErrorMsg("New password and confirmation password do not match.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center py-5 px-3 bg-light">
      <div
        className="card shadow-sm border-0 w-100 p-4 p-sm-5"
        style={{ maxWidth: "480px", borderRadius: "8px" }}
      >
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-warning bg-opacity-10 rounded-circle p-3 mb-2 text-warning">
            <span className="fs-1">🔐</span>
          </div>
          <h1 className="h4 fw-bold text-dark mb-1">Change Your Password</h1>
          <p className="text-muted small">
            {user?.mustChangePassword
              ? "You are signing in with an initial password. You must choose a new password before entering the application."
              : "Update your account password."}
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger py-2 small d-flex align-items-center mb-3" role="alert">
            <span className="me-2">⚠️</span>
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Current Password */}
          <div className="mb-3">
            <label htmlFor="current-password" className="form-label small fw-medium">
              Current (Temporary) Password
            </label>
            <div className="input-group">
              <input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                className="form-control"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowCurrent(!showCurrent)}
                tabIndex={-1}
              >
                {showCurrent ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-3">
            <label htmlFor="new-password" className="form-label small fw-medium">
              New Password
            </label>
            <div className="input-group">
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                className="form-control"
                placeholder="Create a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowNew(!showNew)}
                tabIndex={-1}
              >
                {showNew ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="mb-3">
            <label htmlFor="confirm-password" className="form-label small fw-medium">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              className={`form-control ${
                confirmPassword.length > 0 && !isMatch ? "is-invalid" : ""
              }`}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              required
            />
            {confirmPassword.length > 0 && !isMatch && (
              <div className="invalid-feedback">Passwords do not match.</div>
            )}
          </div>

          {/* Password Rules Checklist */}
          <div className="bg-white border rounded p-3 mb-4 small">
            <div className="fw-semibold text-muted mb-2">Password must:</div>
            <div className={`d-flex align-items-center mb-1 ${hasMinLen ? "text-success fw-medium" : "text-muted"}`}>
              <span className="me-2">{hasMinLen ? "✓" : "○"}</span>
              Be at least 8 characters
            </div>
            <div className={`d-flex align-items-center mb-1 ${hasUpper && hasLower ? "text-success fw-medium" : "text-muted"}`}>
              <span className="me-2">{hasUpper && hasLower ? "✓" : "○"}</span>
              Include upper and lower case letters
            </div>
            <div className={`d-flex align-items-center ${hasNumber && hasSpecial ? "text-success fw-medium" : "text-muted"}`}>
              <span className="me-2">{hasNumber && hasSpecial ? "✓" : "○"}</span>
              Include a number and a special character
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success w-100 py-2 fw-semibold shadow-sm mb-2"
            style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
            disabled={loading || !isComplex || !isMatch || !currentPassword}
          >
            {loading ? "Updating Password..." : "Continue"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary w-100 py-1 small"
            onClick={logout}
            disabled={loading}
          >
            Sign Out & Return Later
          </button>
        </form>
      </div>
    </div>
  );
};
