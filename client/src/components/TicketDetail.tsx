import React, { useState, useEffect, useCallback } from "react";
import { useRequester } from "../context/RequesterContext";
import {
  Ticket,
  Attachment,
  fetchTicketDetail,
  uploadAttachment,
  downloadAttachment,
  removeAttachment,
} from "../api";

interface TicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export const TicketDetail: React.FC<TicketDetailProps> = ({
  ticketId,
  onBack,
}) => {
  const { currentRequester } = useRequester();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Removal Modal state
  const [targetAttachment, setTargetAttachment] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<boolean>(false);

  const loadTicket = useCallback(async () => {
    if (!currentRequester) return;

    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const data = await fetchTicketDetail(ticketId, currentRequester.id);
      setTicket(data);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details.");
      if (err.status === 403 || err.code === "FORBIDDEN") {
        setErrorCode("FORBIDDEN");
      } else if (err.status === 404 || err.code === "NOT_FOUND") {
        setErrorCode("NOT_FOUND");
      }
    } finally {
      setLoading(false);
    }
  }, [ticketId, currentRequester]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!e.target.files || e.target.files.length === 0) {
      setUploadFile(null);
      return;
    }

    const file = e.target.files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const maxSizeBytes = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setUploadError("Unsupported file type. Allowed: JPG, PNG, WEBP, PDF.");
      setUploadFile(null);
      return;
    }

    if (file.size > maxSizeBytes) {
      setUploadError(`File size exceeds 5MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      setUploadFile(null);
      return;
    }

    setUploadFile(file);
  };

  const handleUpload = async () => {
    if (!uploadFile || !currentRequester) return;

    setUploading(true);
    setUploadError(null);

    try {
      await uploadAttachment(ticketId, uploadFile, currentRequester.id);
      setUploadFile(null);
      await loadTicket();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload attachment.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    if (!currentRequester || attachment.isRemoved) return;

    try {
      await downloadAttachment(attachment.id, currentRequester.id, attachment.fileName);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const openRemovalModal = (attachment: Attachment) => {
    setTargetAttachment(attachment);
    setRemovalReason("");
    setRemovalError(null);
  };

  const closeRemovalModal = () => {
    setTargetAttachment(null);
    setRemovalReason("");
    setRemovalError(null);
  };

  const handleConfirmRemoval = async () => {
    if (!targetAttachment || !currentRequester) return;

    const trimmed = removalReason.trim();
    if (!trimmed) {
      setRemovalError("Removal reason is required.");
      return;
    }
    if (trimmed.length < 3) {
      setRemovalError("Removal reason must be at least 3 characters.");
      return;
    }
    if (trimmed.length > 255) {
      setRemovalError("Removal reason must not exceed 255 characters.");
      return;
    }

    setRemoving(true);
    setRemovalError(null);

    try {
      await removeAttachment(targetAttachment.id, trimmed, currentRequester.id);
      closeRemovalModal();
      await loadTicket();
    } catch (err: any) {
      setRemovalError(err.message || "Failed to remove attachment.");
    } finally {
      setRemoving(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "badge bg-danger text-white";
      case "HIGH":
        return "badge bg-warning text-dark";
      case "MEDIUM":
        return "badge bg-info-subtle text-info-emphasis border border-info-subtle";
      case "LOW":
        return "badge bg-light text-secondary border";
      default:
        return "badge bg-secondary text-white";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "NEW":
        return "badge bg-success-subtle text-success-emphasis border border-success-subtle";
      case "ASSIGNED":
      case "IN_PROGRESS":
        return "badge bg-primary-subtle text-primary-emphasis border border-primary-subtle";
      case "PENDING_REQUESTER":
        return "badge bg-warning-subtle text-warning-emphasis border border-warning-subtle";
      case "RESOLVED":
        return "badge bg-success text-white";
      case "CLOSED":
        return "badge bg-secondary text-white";
      case "CANCELLED":
        return "badge bg-danger-subtle text-danger-emphasis border border-danger-subtle";
      default:
        return "badge bg-light text-dark border";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading ticket details...</span>
        </div>
        <p className="text-muted small mt-2">Loading ticket details...</p>
      </div>
    );
  }

  if (errorCode === "FORBIDDEN") {
    return (
      <div className="container py-5">
        <div className="zen-card p-4 p-md-5 text-center mx-auto" style={{ maxWidth: "600px" }}>
          <div className="fs-1 mb-3">🚫</div>
          <h2 className="h4 fw-bold text-danger mb-2">Access Denied (403 Forbidden)</h2>
          <p className="text-muted mb-4">
            You do not have permission to view this ticket. Tickets are strictly confidential to their submitter.
          </p>
          <button type="button" className="zen-btn-primary" onClick={onBack}>
            ← Back to My Tickets
          </button>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error || "Ticket not found."}
        </div>
        <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
          ← Back to My Tickets
        </button>
      </div>
    );
  }

  const activeAttachments = ticket.attachments?.filter((a) => !a.isRemoved) || [];
  const activeCount = activeAttachments.length;
  const isAttachmentLimitReached = activeCount >= 5;

  return (
    <div className="container py-4">
      {/* Navigation Breadcrumb */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <button
                type="button"
                className="btn btn-link p-0 text-decoration-none text-muted small"
                onClick={onBack}
              >
                My Tickets
              </button>
            </li>
            <li className="breadcrumb-item active small text-dark fw-bold" aria-current="page">
              {ticket.ticketNumber}
            </li>
          </ol>
        </nav>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onBack}>
          ← Back to My Tickets
        </button>
      </div>

      {/* Ticket Details Card */}
      <div className="zen-card p-4 p-md-5 mb-4">
        {/* Ticket Header */}
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center pb-3 border-bottom mb-4 gap-2">
          <div>
            <span className="small text-muted d-block">Ticket Number</span>
            <span className="h4 fw-bold text-success font-monospace mb-0">
              {ticket.ticketNumber}
            </span>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <span className={getPriorityBadgeClass(ticket.requestedPriority)}>
              Priority: {ticket.requestedPriority}
            </span>
            <span className={getStatusBadgeClass(ticket.currentStatus)}>
              Status: {ticket.currentStatus}
            </span>
          </div>
        </div>

        {/* Read-only Ticket Metadata Grid */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <label className="form-label small text-muted mb-1">Requester</label>
            <div className="p-2 border rounded bg-light small">
              <strong>{ticket.requester?.name}</strong>
              <div className="text-muted">{ticket.requester?.email}</div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label small text-muted mb-1">Category</label>
            <div className="p-2 border rounded bg-light small fw-medium">
              {ticket.category?.name}
            </div>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label small text-muted mb-1">Related System</label>
            <div className="p-2 border rounded bg-light small fw-medium">
              {ticket.relatedSystem?.name}
            </div>
          </div>

          <div className="col-12">
            <label className="form-label small text-muted mb-1">Summary (Title)</label>
            <div className="p-2 border rounded bg-light fw-bold text-dark">
              {ticket.summary}
            </div>
          </div>

          <div className="col-12">
            <label className="form-label small text-muted mb-1">Detailed Description</label>
            <div
              className="p-3 border rounded bg-light text-dark"
              style={{ whiteSpace: "pre-wrap", minHeight: "100px" }}
            >
              {ticket.description}
            </div>
          </div>

          <div className="col-12 text-muted small">
            <span>Created on: {formatDate(ticket.createdAt)}</span>
            {ticket.updatedAt && (
              <span className="ms-3">&bull; Last updated: {formatDate(ticket.updatedAt)}</span>
            )}
          </div>
        </div>

        {/* Attachments Management Section */}
        <div className="border-top pt-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h5 fw-bold text-dark mb-0">
              📎 Supporting Attachments ({activeCount}/5 active)
            </h3>
          </div>

          {/* Attachments List */}
          {(!ticket.attachments || ticket.attachments.length === 0) ? (
            <div className="p-3 border rounded bg-light text-muted small text-center mb-4">
              No supporting attachments uploaded for this ticket.
            </div>
          ) : (
            <div className="list-group mb-4">
              {ticket.attachments.map((att) => (
                <div
                  key={att.id}
                  className={`list-group-item d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between p-3 gap-2 ${
                    att.isRemoved ? "bg-light text-muted" : ""
                  }`}
                >
                  <div className="d-flex align-items-center gap-3">
                    <span className="fs-4">{att.isRemoved ? "🗑️" : "📄"}</span>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <strong className={att.isRemoved ? "text-decoration-line-through text-muted" : "text-dark"}>
                          {att.fileName}
                        </strong>
                        {att.isRemoved ? (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle small">
                            Removed
                          </span>
                        ) : (
                          <span className="badge bg-light text-secondary border small">
                            {formatFileSize(att.fileSize)}
                          </span>
                        )}
                      </div>
                      <div className="small text-muted mt-1">
                        Uploaded on {formatDate(att.createdAt)}
                      </div>
                      {att.isRemoved && att.removalReason && (
                        <div className="alert alert-warning py-1 px-2 small mb-0 mt-2" role="status">
                          <strong>Removal Reason:</strong> {att.removalReason}{" "}
                          {att.removedAt && (
                            <span className="text-muted">({formatDate(att.removedAt)})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex gap-2 ms-auto">
                    {/* Download Button */}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleDownload(att)}
                      disabled={att.isRemoved}
                      title={att.isRemoved ? "Download disabled (attachment removed)" : "Download attachment"}
                    >
                      Download
                    </button>

                    {/* Remove Button (Active attachments only) */}
                    {!att.isRemoved && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => openRemovalModal(att)}
                        title="Remove attachment"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Attachment Upload Box */}
          <div className="card p-3 bg-light border-dashed">
            <h4 className="h6 fw-bold mb-2">Add New Attachment</h4>
            {isAttachmentLimitReached ? (
              <div className="alert alert-info py-2 small mb-0" role="status">
                Maximum active attachments limit (5) reached. Soft-remove an existing attachment to upload more.
              </div>
            ) : (
              <div>
                <div className="d-flex flex-column flex-sm-row gap-2 align-items-start align-items-sm-center mb-2">
                  <input
                    type="file"
                    className="form-control form-control-sm"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    aria-label="Select attachment file"
                  />
                  <button
                    type="button"
                    className="zen-btn-primary py-1 px-3 text-nowrap"
                    onClick={handleUpload}
                    disabled={!uploadFile || uploading}
                  >
                    {uploading ? "Uploading..." : "Upload File"}
                  </button>
                </div>
                <small className="text-muted">
                  Allowed formats: JPG, PNG, WEBP, PDF up to 5 MB each.
                </small>
                {uploadError && (
                  <div className="alert alert-warning py-1 px-2 small mt-2 mb-0" role="alert">
                    ⚠️ {uploadError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Soft Removal Confirmation Modal */}
      {targetAttachment && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content zen-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">Remove Attachment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeRemovalModal}
                  disabled={removing}
                  aria-label="Close modal"
                ></button>
              </div>
              <div className="modal-body py-3">
                <p className="text-muted small mb-3">
                  Are you sure you want to remove{" "}
                  <strong>{targetAttachment.fileName}</strong>? Once removed, this file will no longer be downloadable.
                </p>

                <div className="mb-3">
                  <label htmlFor="removal-reason-input" className="form-label fw-medium text-dark small">
                    Reason for Removal <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="removal-reason-input"
                    className={`form-control ${removalError ? "is-invalid" : ""}`}
                    rows={3}
                    placeholder="Provide a mandatory reason for removing this attachment (e.g., Uploaded wrong document, Outdated screenshot)..."
                    value={removalReason}
                    maxLength={255}
                    onChange={(e) => {
                      setRemovalReason(e.target.value);
                      if (removalError) setRemovalError(null);
                    }}
                    disabled={removing}
                  />
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    {removalError ? (
                      <div className="invalid-feedback d-block small">{removalError}</div>
                    ) : (
                      <small className="text-muted">Min 3 characters, max 255.</small>
                    )}
                    <small className="text-muted ms-auto">{removalReason.length}/255</small>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={closeRemovalModal}
                  disabled={removing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleConfirmRemoval}
                  disabled={removing || removalReason.trim().length < 3}
                >
                  {removing ? "Removing..." : "Confirm Removal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
