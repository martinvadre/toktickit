import React, { useState, useEffect } from "react";
import { useRequester } from "../context/RequesterContext";
import {
  Category,
  RelatedSystem,
  Ticket,
  fetchCategories,
  fetchRelatedSystems,
  createTicket,
} from "../api";

interface CreateTicketProps {
  onTicketCreated?: (ticket: Ticket) => void;
  onCancel?: () => void;
}

export const CreateTicket: React.FC<CreateTicketProps> = ({
  onTicketCreated,
  onCancel,
}) => {
  const { currentRequester } = useRequester();

  // Form Field States
  const [categoryId, setCategoryId] = useState<string>("");
  const [relatedSystemId, setRelatedSystemId] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Attachments State (Client-side selection)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Reference Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [loadingRefData, setLoadingRefData] = useState<boolean>(true);

  // Submission / Feedback States
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadReferenceData() {
      setLoadingRefData(true);
      try {
        const [cats, systems] = await Promise.all([
          fetchCategories(),
          fetchRelatedSystems(),
        ]);
        if (isMounted) {
          setCategories(cats);
          setRelatedSystems(systems);
        }
      } catch (err) {
        console.error("Failed to load reference data", err);
      } finally {
        if (isMounted) {
          setLoadingRefData(false);
        }
      }
    }
    loadReferenceData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentError(null);
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    const newFiles: File[] = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setAttachmentError(`Unsupported file type: ${file.name}. Allowed: JPG, PNG, WEBP, PDF.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setAttachmentError(`File size exceeds 5MB: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
        return;
      }
      newFiles.push(file);
    }

    if (selectedFiles.length + newFiles.length > 5) {
      setAttachmentError("Maximum of 5 attachments allowed per ticket.");
      return;
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setAttachmentError(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!categoryId) {
      errors.categoryId = "Please select a Category.";
    }

    if (!relatedSystemId) {
      errors.relatedSystemId = "Please select a Related System.";
    }

    const trimmedSummary = summary.trim();
    if (!trimmedSummary) {
      errors.summary = "Summary is required (min 5 characters).";
    } else if (trimmedSummary.length < 5 || trimmedSummary.length > 150) {
      errors.summary = "Summary must be between 5 and 150 characters.";
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = "Description is required (min 10 characters).";
    } else if (trimmedDesc.length < 10 || trimmedDesc.length > 3000) {
      errors.description = "Description must be between 10 and 3000 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!currentRequester) {
      setApiError("No active Development Requester selected.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const ticket = await createTicket({
        requesterId: currentRequester.id,
        categoryId: parseInt(categoryId, 10),
        relatedSystemId: parseInt(relatedSystemId, 10),
        requestedPriority,
        summary: summary.trim(),
        description: description.trim(),
      });

      setCreatedTicket(ticket);
      if (onTicketCreated) {
        onTicketCreated(ticket);
      }
    } catch (err: any) {
      setApiError(err.message || "Failed to submit ticket. Please try again.");
      if (err.fieldErrors && Array.isArray(err.fieldErrors)) {
        const backendErrors: Record<string, string> = {};
        err.fieldErrors.forEach((fe: any) => {
          backendErrors[fe.field] = fe.message;
        });
        setFieldErrors((prev) => ({ ...prev, ...backendErrors }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategoryId("");
    setRelatedSystemId("");
    setRequestedPriority("MEDIUM");
    setSummary("");
    setDescription("");
    setSelectedFiles([]);
    setAttachmentError(null);
    setFieldErrors({});
    setApiError(null);
    setCreatedTicket(null);
  };

  // SUCCESS CONFIRMATION VIEW
  if (createdTicket) {
    return (
      <div className="container py-4">
        <div className="zen-card p-4 p-md-5 mx-auto" style={{ maxWidth: "720px" }}>
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: "64px",
                height: "64px",
                backgroundColor: "var(--zen-pale)",
                color: "var(--zen-primary)",
                fontSize: "2rem",
              }}
            >
              ✓
            </div>
            <h2 className="h3 fw-bold text-dark mb-2">Ticket Submitted Successfully!</h2>
            <p className="text-muted">
              Your support request has been logged in the system.
            </p>
          </div>

          <div className="zen-info-box p-4 mb-4 text-center">
            <span className="small text-muted d-block mb-1">Official Ticket Number:</span>
            <span className="h3 fw-bold text-success mb-0 d-block tracking-wide">
              {createdTicket.ticketNumber}
            </span>
          </div>

          <div className="border rounded p-3 mb-4 bg-light">
            <div className="row g-2 small">
              <div className="col-12 col-sm-6">
                <strong>Requester:</strong> {currentRequester?.name}
              </div>
              <div className="col-12 col-sm-6">
                <strong>Priority:</strong> <span className="badge bg-secondary">{createdTicket.requestedPriority}</span>
              </div>
              <div className="col-12">
                <strong>Summary:</strong> {createdTicket.summary}
              </div>
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            <button
              type="button"
              className="zen-btn-primary py-2 px-4"
              onClick={() => onCancel && onCancel()}
            >
              View in My Tickets
            </button>
            <button
              type="button"
              className="zen-btn-secondary py-2 px-4"
              onClick={resetForm}
            >
              Submit Another Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CREATE TICKET FORM VIEW
  return (
    <div className="container py-4">
      <div className="zen-card p-4 p-md-5 mx-auto" style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-3">
          <div>
            <h1 className="h3 fw-bold text-dark mb-1">Submit a New IT Ticket</h1>
            <p className="text-muted small mb-0">
              Describe your IT issue and provide classification details.
            </p>
          </div>
          {onCancel && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onCancel}
            >
              ← Back
            </button>
          )}
        </div>

        {/* Safe API Failure Banner (Preserves Form Values) */}
        {apiError && (
          <div className="alert alert-danger mb-4" role="alert">
            <strong>Submission Failed:</strong> {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* 1. Requester (Read-only) */}
          <div className="mb-3">
            <label htmlFor="ticket-requester" className="form-label fw-medium text-dark">
              Requester
            </label>
            <input
              id="ticket-requester"
              type="text"
              className="form-control zen-input-readonly"
              value={currentRequester ? `${currentRequester.name} (${currentRequester.email})` : ""}
              readOnly
              disabled
              aria-label="Requester identity"
            />
            <small className="text-muted">Populated automatically from your active development identity.</small>
          </div>

          {/* 2. Classification Row (Category & Related System) */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label htmlFor="ticket-category" className="form-label fw-medium text-dark">
                Category <span className="required-asterisk">*</span>
              </label>
              <select
                id="ticket-category"
                className={`form-select ${fieldErrors.categoryId ? "is-invalid" : ""}`}
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  if (fieldErrors.categoryId) {
                    setFieldErrors((prev) => ({ ...prev, categoryId: "" }));
                  }
                }}
                disabled={loadingRefData}
                aria-label="Ticket Category"
              >
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && (
                <div className="invalid-feedback d-block text-danger small mt-1">
                  {fieldErrors.categoryId}
                </div>
              )}
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="ticket-related-system" className="form-label fw-medium text-dark">
                Related System <span className="required-asterisk">*</span>
              </label>
              <select
                id="ticket-related-system"
                className={`form-select ${fieldErrors.relatedSystemId ? "is-invalid" : ""}`}
                value={relatedSystemId}
                onChange={(e) => {
                  setRelatedSystemId(e.target.value);
                  if (fieldErrors.relatedSystemId) {
                    setFieldErrors((prev) => ({ ...prev, relatedSystemId: "" }));
                  }
                }}
                disabled={loadingRefData}
                aria-label="Related System"
              >
                <option value="">-- Select Related System --</option>
                {relatedSystems.map((sys) => (
                  <option key={sys.id} value={sys.id}>
                    {sys.name}
                  </option>
                ))}
              </select>
              {fieldErrors.relatedSystemId && (
                <div className="invalid-feedback d-block text-danger small mt-1">
                  {fieldErrors.relatedSystemId}
                </div>
              )}
            </div>
          </div>

          {/* 3. Requested Priority */}
          <div className="mb-3">
            <label htmlFor="ticket-priority" className="form-label fw-medium text-dark">
              Requested Priority <span className="required-asterisk">*</span>
            </label>
            <select
              id="ticket-priority"
              className="form-select"
              value={requestedPriority}
              onChange={(e) =>
                setRequestedPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT")
              }
              aria-label="Requested Priority"
            >
              <option value="LOW">Low — Non-urgent inquiry or minor annoyance</option>
              <option value="MEDIUM">Medium — Standard operational issue (Default)</option>
              <option value="HIGH">High — Significant work disruption or urgent deadline</option>
              <option value="URGENT">Urgent — Critical system outage affecting multiple users</option>
            </select>
          </div>

          {/* 4. Ticket Summary */}
          <div className="mb-3">
            <label htmlFor="ticket-summary" className="form-label fw-medium text-dark">
              Summary (Title) <span className="required-asterisk">*</span>
            </label>
            <input
              id="ticket-summary"
              type="text"
              className={`form-control ${fieldErrors.summary ? "is-invalid" : ""}`}
              placeholder="Brief description of the problem (e.g. Laptop battery drains quickly)"
              value={summary}
              maxLength={150}
              onChange={(e) => {
                setSummary(e.target.value);
                if (fieldErrors.summary) {
                  setFieldErrors((prev) => ({ ...prev, summary: "" }));
                }
              }}
              aria-label="Ticket Summary"
            />
            <div className="d-flex justify-content-between align-items-center mt-1">
              {fieldErrors.summary ? (
                <div className="invalid-feedback d-block text-danger small">
                  {fieldErrors.summary}
                </div>
              ) : (
                <small className="text-muted">Between 5 and 150 characters.</small>
              )}
              <small className="text-muted ms-auto">{summary.length}/150</small>
            </div>
          </div>

          {/* 5. Detailed Description */}
          <div className="mb-4">
            <label htmlFor="ticket-description" className="form-label fw-medium text-dark">
              Detailed Description <span className="required-asterisk">*</span>
            </label>
            <textarea
              id="ticket-description"
              rows={5}
              className={`form-control ${fieldErrors.description ? "is-invalid" : ""}`}
              placeholder="Provide specific details about the issue, error messages, steps to reproduce, or affected hardware/software..."
              value={description}
              maxLength={3000}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) {
                  setFieldErrors((prev) => ({ ...prev, description: "" }));
                }
              }}
              aria-label="Ticket Description"
            />
            <div className="d-flex justify-content-between align-items-center mt-1">
              {fieldErrors.description ? (
                <div className="invalid-feedback d-block text-danger small">
                  {fieldErrors.description}
                </div>
              ) : (
                <small className="text-muted">Minimum 10 characters.</small>
              )}
              <small className="text-muted ms-auto">{description.length}/3000</small>
            </div>
          </div>

          {/* 6. Attachments Section */}
          <div className="mb-4 border-top pt-3">
            <label htmlFor="ticket-attachments" className="form-label fw-medium text-dark d-flex align-items-center justify-content-between">
              <span>📎 Supporting Attachments <span className="text-muted small fw-normal">(Optional)</span></span>
              <span className="badge bg-light text-dark">{selectedFiles.length}/5 files</span>
            </label>
            <input
              id="ticket-attachments"
              type="file"
              className="form-control"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              disabled={selectedFiles.length >= 5}
              aria-label="Upload supporting attachments"
            />
            <small className="text-muted d-block mt-1">
              Allowed: JPG, PNG, WEBP, PDF up to 5 MB each. Max 5 active attachments.
            </small>

            {attachmentError && (
              <div className="alert alert-warning py-2 small mt-2" role="alert">
                ⚠️ {attachmentError}
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="mt-3">
                <span className="small fw-medium text-secondary">Selected files:</span>
                <ul className="list-group list-group-flush mt-1">
                  {selectedFiles.map((file, idx) => (
                    <li key={idx} className="list-group-item d-flex align-items-center justify-content-between py-2 px-0 bg-transparent">
                      <span className="small text-truncate me-2">
                        📄 {file.name} <span className="text-muted">({(file.size / 1024).toFixed(1)} KB)</span>
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={() => removeFile(idx)}
                        title="Remove file"
                      >
                        ✕ Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            {onCancel && (
              <button
                type="button"
                className="zen-btn-secondary"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="zen-btn-primary d-flex align-items-center justify-content-center"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Submitting Ticket...
                </>
              ) : (
                "Submit Ticket"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
