import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

interface LoginProps {
  onSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { login, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError(null);

    if (!email.trim()) {
      setFormError("Email address is required.");
      return;
    }

    if (!password) {
      setFormError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      // Error is set in AuthContext and rendered
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    clearError();
    setFormError(null);
  };

  return (
    <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center py-5 px-3 bg-light">
      <div
        className="card shadow-sm border-0 w-100 p-4 p-sm-5"
        style={{ maxWidth: "450px", borderRadius: "8px" }}
      >
        {/* Brand & Title */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle p-3 mb-3 text-success">
            <span className="fs-1">🕒</span>
          </div>
          <h1 className="h3 fw-bold text-dark mb-1">TokTickIT</h1>
          <p className="text-muted small">
            Sign in to your IT Service Desk account
          </p>
        </div>

        {/* Error Alert */}
        {(formError || error) && (
          <div
            className="alert alert-danger py-2 small d-flex align-items-center mb-3"
            role="alert"
          >
            <span className="me-2">⚠️</span>
            <div>{formError || error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="login-email" className="form-label small fw-medium">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-control"
              placeholder="user@kmutt.ac.th"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label
                htmlFor="login-password"
                className="form-label small fw-medium mb-0"
              >
                Password
              </label>
            </div>
            <div className="input-group">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-success w-100 py-2 fw-semibold shadow-sm"
            style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Quick Demo Helper */}
        <div className="mt-4 pt-3 border-top">
          <p className="text-muted small text-center mb-2 fw-medium">
            Demo Test Accounts (Click to Fill):
          </p>
          <div className="d-flex flex-column gap-1">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary text-start py-1"
              onClick={() => handleQuickFill("somchai.pra@kmutt.ac.th")}
            >
              👤 <strong>Requester</strong>: somchai.pra@kmutt.ac.th
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-success text-start py-1"
              onClick={() => handleQuickFill("staff.supachai@kmutt.ac.th")}
            >
              🛠️ <strong>IT Staff</strong>: staff.supachai@kmutt.ac.th
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger text-start py-1"
              onClick={() => handleQuickFill("admin@kmutt.ac.th")}
            >
              👑 <strong>Administrator</strong>: admin@kmutt.ac.th
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-warning text-start py-1 text-dark"
              onClick={() => handleQuickFill("firstlogin@kmutt.ac.th")}
            >
              🔐 <strong>New User (Password Change)</strong>: firstlogin@kmutt.ac.th
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
