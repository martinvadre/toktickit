import React, { useState } from "react";
import { useRequester } from "../context/RequesterContext";

interface RequesterSelectProps {
  onContinue?: () => void;
}

export const RequesterSelect: React.FC<RequesterSelectProps> = ({ onContinue }) => {
  const { requesters, loading, error, setRequester, reloadRequesters } = useRequester();
  const [selectedId, setSelectedId] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      setValidationError("Please select a development requester to continue.");
      return;
    }
    const found = requesters.find((r) => r.id === parseInt(selectedId, 10));
    if (found) {
      setRequester(found);
      if (onContinue) {
        onContinue();
      }
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="zen-card p-4 p-md-5">
            {/* Header Icon & Title */}
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: "56px",
                  height: "56px",
                  backgroundColor: "var(--zen-pale)",
                  color: "var(--zen-primary)",
                  fontSize: "1.5rem",
                }}
              >
                👤
              </div>
              <h1 className="h3 fw-bold text-dark mb-2">TokTickIT — Select Development Requester</h1>
              <p className="text-muted small mb-0">
                Choose a development requester to simulate the current requester context for Lab 2.
                This is for testing only and is not a login screen.
              </p>
            </div>

            {/* Error / API Failure State */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4" role="alert">
                <div>
                  <strong>Error:</strong> {error}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => reloadRequesters()}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-4" data-testid="loading-spinner">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading requesters...</span>
                </div>
                <p className="text-muted small mt-2">Loading active development requesters...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && requesters.length === 0 && (
              <div className="alert alert-warning text-center py-3" role="alert">
                <p className="mb-0 fw-medium">No active development requesters found in database.</p>
                <small className="text-muted">Please run database seed script to populate testing users.</small>
              </div>
            )}

            {/* Form */}
            {!loading && !error && requesters.length > 0 && (
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="requester-dropdown" className="form-label fw-medium text-dark">
                    Development Requester <span className="required-asterisk">*</span>
                  </label>
                  <select
                    id="requester-dropdown"
                    className={`form-select ${validationError ? "is-invalid" : ""}`}
                    value={selectedId}
                    onChange={(e) => {
                      setSelectedId(e.target.value);
                      setValidationError(null);
                    }}
                    aria-label="Development Requester selection"
                  >
                    <option value="">-- Choose a Requester --</option>
                    {requesters.map((req) => (
                      <option key={req.id} value={req.id}>
                        {req.name} ({req.email}) {req.department ? `— ${req.department}` : ""}
                      </option>
                    ))}
                  </select>
                  {validationError && (
                    <div className="invalid-feedback d-block text-danger small mt-1">
                      {validationError}
                    </div>
                  )}
                </div>

                {/* Explanatory Info Box */}
                <div className="zen-info-box p-3 mb-3 d-flex align-items-center">
                  <span className="me-2 fs-5">ℹ️</span>
                  <span className="small">Only active development requesters are shown.</span>
                </div>

                {/* Authentication Note */}
                <div className="card bg-light border-0 p-3 mb-4">
                  <div className="d-flex align-items-start">
                    <span className="me-2 fs-5">🛡️</span>
                    <div>
                      <h2 className="h6 fw-bold mb-1">Authentication coming in Lab 3</h2>
                      <p className="small text-muted mb-0">
                        In Lab 3, this selection will be replaced with secure authentication so you can access the system with your own account.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="d-grid">
                  <button type="submit" className="zen-btn-primary py-2 fs-6">
                    Continue →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
