import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  StaffTicket,
  StaffMember,
  fetchStaffTicketDetail,
  fetchStaffMembers,
  updateStaffTicketStatus,
  assignTicketStaff,
  updateTicketPriority,
  addStaffComment,
  downloadAttachment,
  Attachment,
} from "../api";
import { ActionsTakenSection } from "./ActionsTakenSection";

interface StaffTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

export const StaffTicketDetail: React.FC<StaffTicketDetailProps> = ({
  ticketId,
  onBack,
}) => {
  const { user } = useAuth();

  const [ticket, setTicket] = useState<StaffTicket | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Operations state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAssignee, setUpdatingAssignee] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  // Resolution Modal state
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const isStaffOrAdmin = user?.role === "STAFF" || user?.role === "ADMIN";

  const loadData = useCallback(async () => {
    if (!isStaffOrAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const [ticketData, staffData] = await Promise.all([
        fetchStaffTicketDetail(ticketId),
        fetchStaffMembers().catch(() => []),
      ]);
      setTicket(ticketData);
      setStaffList(staffData);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  }, [ticketId, isStaffOrAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle status selection
  const handleStatusSelect = async (nextStatus: string) => {
    if (!ticket) return;

    if (nextStatus === "RESOLVED" || nextStatus === "CLOSED") {
      setPendingStatus(nextStatus);
      setResolutionSummary(ticket.resolutionSummary || "");
      setResolutionError(null);
      return;
    }

    setUpdatingStatus(true);
    try {
      await updateStaffTicketStatus(ticket.id, nextStatus);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Confirm resolution modal
  const handleConfirmResolution = async () => {
    if (!ticket || !pendingStatus) return;

    if (resolutionSummary.trim().length < 10) {
      setResolutionError("Resolution summary must be at least 10 characters.");
      return;
    }

    setUpdatingStatus(true);
    setResolutionError(null);

    try {
      await updateStaffTicketStatus(ticket.id, pendingStatus, resolutionSummary.trim());
      setPendingStatus(null);
      setResolutionSummary("");
      await loadData();
    } catch (err: any) {
      setResolutionError(err.message || "Failed to submit resolution.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Assignee change
  const handleAssigneeChange = async (staffIdStr: string) => {
    if (!ticket) return;

    setUpdatingAssignee(true);
    try {
      const staffId = staffIdStr === "unassigned" ? null : Number(staffIdStr);
      await assignTicketStaff(ticket.id, staffId);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update assignee.");
    } finally {
      setUpdatingAssignee(false);
    }
  };

  // Claim ticket (assign to self)
  const handleClaimTicket = async () => {
    if (!ticket || !user) return;
    await handleAssigneeChange(String(user.id));
  };

  // Handle IT Priority change
  const handlePriorityChange = async (priority: string) => {
    if (!ticket) return;

    setUpdatingPriority(true);
    try {
      await updateTicketPriority(ticket.id, priority);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to update IT priority.");
    } finally {
      setUpdatingPriority(false);
    }
  };

  // Handle comment submit
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !commentText.trim()) return;

    setSubmittingComment(true);
    setCommentError(null);

    try {
      await addStaffComment(ticket.id, commentText.trim(), isInternalNote);
      setCommentText("");
      setIsInternalNote(false);
      await loadData();
    } catch (err: any) {
      setCommentError(err.message || "Failed to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    if (!user) return;
    try {
      await downloadAttachment(attachment.id, user.id, attachment.fileName);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "NEW":
        return "badge bg-info-subtle text-info-emphasis border border-info-subtle";
      case "ASSIGNED":
        return "badge bg-primary-subtle text-primary-emphasis border border-primary-subtle";
      case "IN_PROGRESS":
        return "badge bg-warning-subtle text-warning-emphasis border border-warning-subtle";
      case "PENDING_REQUESTER":
        return "badge bg-warning text-dark";
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

  if (!isStaffOrAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger shadow-sm p-4 text-center mx-auto" style={{ maxWidth: "600px" }} role="alert">
          <span className="fs-1 d-block mb-2">🚫</span>
          <h2 className="h4 fw-bold mb-2">Access Denied</h2>
          <p className="mb-0 text-muted">
            IT Staff Operations are restricted to IT Staff and Administrators.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading ticket details...</span>
        </div>
        <div className="text-muted small mt-2">Loading ticket #{ticketId}...</div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger shadow-sm p-4 text-center mx-auto" style={{ maxWidth: "600px" }} role="alert">
          <h2 className="h5 fw-bold mb-2">Error Loading Ticket</h2>
          <p className="mb-3 text-muted">{error || "Ticket not found."}</p>
          <button className="btn btn-sm btn-outline-danger" onClick={onBack}>
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 px-md-4 py-4" data-testid="staff-ticket-detail">
      {/* Top Navigation & Header */}
      <div className="mb-4">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary mb-3 d-inline-flex align-items-center gap-1"
          onClick={onBack}
          data-testid="back-to-queue-btn"
        >
          <span>←</span> Back to Queue
        </button>

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="h4 fw-bold text-dark mb-0">{ticket.ticketNumber}</span>
              <span className={getStatusBadgeClass(ticket.currentStatus)} data-testid="ticket-status-badge">
                {ticket.currentStatus.replace("_", " ")}
              </span>
              <span className={getPriorityBadgeClass(ticket.itPriority)} data-testid="ticket-it-priority-badge">
                IT: {ticket.itPriority}
              </span>
            </div>
            <h1 className="h5 text-secondary fw-normal mb-0">{ticket.summary}</h1>
          </div>

          <div className="text-muted small">
            Created: {formatDate(ticket.createdAt)}
          </div>
        </div>
      </div>

      {/* Requester Indicated Resolved Banner (BR-05 / AC-12) */}
      {ticket.requesterIndicatedResolved && (
        <div className="alert alert-warning border-start border-4 border-warning shadow-sm py-3 px-4 mb-4 d-flex align-items-center gap-3" role="alert">
          <span className="fs-2">🔔</span>
          <div>
            <strong className="d-block text-dark">Requester Indicated Problem Appears Resolved</strong>
            <span className="small text-muted">
              The requester marked this ticket as resolved. Please verify the resolution and formally transition the ticket status to Resolved or Closed.
            </span>
          </div>
        </div>
      )}

      {/* Quick Operations Action Bar */}
      <div className="card shadow-sm border-0 bg-white p-3 mb-4">
        <div className="row g-3 align-items-center">
          {/* Status Progression */}
          <div className="col-12 col-sm-6 col-lg-4">
            <label className="form-label small fw-semibold text-muted mb-1">
              Change Ticket Status
            </label>
            <select
              className="form-select form-select-sm"
              value={ticket.currentStatus}
              onChange={(e) => handleStatusSelect(e.target.value)}
              disabled={updatingStatus || ticket.currentStatus === "CLOSED" || ticket.currentStatus === "CANCELLED"}
              data-testid="status-select"
            >
              <option value="NEW">New</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_REQUESTER">Pending Requester</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Staff Assignment */}
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold text-muted mb-0">
                Assigned Staff Member
              </label>
              {user && ticket.assignedStaff?.id !== user.id && (
                <button
                  type="button"
                  className="btn btn-link p-0 small text-success text-decoration-none fw-semibold"
                  onClick={handleClaimTicket}
                  disabled={updatingAssignee}
                  data-testid="claim-ticket-btn"
                >
                  ⚡ Claim Ticket
                </button>
              )}
            </div>
            <select
              className="form-select form-select-sm"
              value={ticket.assignedStaff ? ticket.assignedStaff.id : "unassigned"}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              disabled={updatingAssignee}
              data-testid="assignee-select"
            >
              <option value="unassigned">Unassigned</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          {/* IT Priority Override */}
          <div className="col-12 col-sm-6 col-lg-4">
            <label className="form-label small fw-semibold text-muted mb-1">
              IT Priority (Req: {ticket.requestedPriority})
            </label>
            <select
              className="form-select form-select-sm"
              value={ticket.itPriority}
              onChange={(e) => handlePriorityChange(e.target.value)}
              disabled={updatingPriority}
              data-testid="priority-select"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Details & Attachments */}
        <div className="col-12 col-lg-7">
          {/* Ticket Description */}
          <div className="card shadow-sm border-0 bg-white p-4 mb-4">
            <h2 className="h6 fw-bold text-dark mb-3 border-bottom pb-2">
              Ticket Description
            </h2>
            <div className="text-dark mb-4" style={{ whiteSpace: "pre-wrap" }}>
              {ticket.description}
            </div>

            {/* Resolution Statement (if resolved) */}
            {ticket.resolutionSummary && (
              <div className="alert alert-success border-start border-4 border-success py-2 px-3 mb-0">
                <strong className="d-block small text-success-emphasis">Resolution Summary:</strong>
                <span className="small text-dark">{ticket.resolutionSummary}</span>
              </div>
            )}
          </div>

          {/* Actions Taken Section (Lab 4 / BR-01, BR-02, BR-03, BR-04) */}
          <ActionsTakenSection
            ticketId={ticket.id}
            actions={ticket.actionsTaken || []}
            isStaff={true}
            currentUserId={user?.id}
            staffList={staffList}
            onActionSaved={loadData}
          />

          {/* Attachments Section */}
          <div className="card shadow-sm border-0 bg-white p-4 mb-4">
            <h2 className="h6 fw-bold text-dark mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center">
              <span>Attachments ({ticket.attachments?.length || 0})</span>
            </h2>

            {(!ticket.attachments || ticket.attachments.length === 0) ? (
              <p className="text-muted small mb-0">No active attachments for this ticket.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {ticket.attachments.map((att) => (
                  <li key={att.id} className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                    <div>
                      <span className="me-2">📎</span>
                      <strong className="small text-dark">{att.fileName}</strong>
                      <span className="badge bg-light text-muted border ms-2 small">
                        {(att.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleDownload(att)}
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Requester Meta & Comments Timeline */}
        <div className="col-12 col-lg-5">
          {/* Requester Metadata Card */}
          <div className="card shadow-sm border-0 bg-white p-3 mb-4">
            <h2 className="h6 fw-bold text-dark mb-2 border-bottom pb-2">
              Requester Information
            </h2>
            <div className="small mb-1">
              <strong>Name:</strong> {ticket.requester.name}
            </div>
            <div className="small mb-1">
              <strong>Email:</strong> {ticket.requester.email}
            </div>
            <div className="small mb-1">
              <strong>Department:</strong> {ticket.requester.department || "N/A"}
            </div>
            <div className="small mb-1">
              <strong>Category:</strong> {ticket.category.name}
            </div>
            <div className="small">
              <strong>Related System:</strong> {ticket.relatedSystem.name}
            </div>
          </div>

          {/* Comments & Collaboration Timeline */}
          <div className="card shadow-sm border-0 bg-white p-3 mb-4">
            <h2 className="h6 fw-bold text-dark mb-3 border-bottom pb-2">
              Activity & Comments Feed
            </h2>

            {/* Existing Comments Timeline */}
            <div className="comments-timeline mb-3" style={{ maxHeight: "350px", overflowY: "auto" }}>
              {(!ticket.comments || ticket.comments.length === 0) ? (
                <p className="text-muted small mb-0 text-center py-3">
                  No comments or notes yet.
                </p>
              ) : (
                ticket.comments.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded mb-3 border ${
                      c.isInternal
                        ? "bg-danger-subtle border-danger"
                        : "bg-light border-light-subtle"
                    }`}
                    data-testid={c.isInternal ? "internal-note-card" : "public-comment-card"}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div className="d-flex align-items-center gap-1">
                        <strong className="small text-dark">{c.author.name}</strong>
                        {c.isInternal ? (
                          <span
                            className="badge rounded-pill px-2 py-0 text-danger bg-white border border-danger small fw-semibold ms-1"
                            data-testid="internal-note-badge"
                          >
                            🔒 Internal Staff Note
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary small ms-1">
                            {c.author.role}
                          </span>
                        )}
                      </div>
                      <span className="text-muted small">{formatDate(c.createdAt)}</span>
                    </div>
                    <div className="small text-dark mt-1" style={{ whiteSpace: "pre-wrap" }}>
                      {c.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment}>
              <div className="mb-2">
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  placeholder="Type public reply or internal staff note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={submittingComment}
                  data-testid="comment-textarea"
                  required
                />
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="internal-note-checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    disabled={submittingComment}
                    data-testid="internal-note-toggle"
                  />
                  <label
                    className="form-check-label small fw-medium text-dark"
                    htmlFor="internal-note-checkbox"
                  >
                    🔒 Internal Staff Note (hidden from requester)
                  </label>
                </div>

                <button
                  type="submit"
                  className={`btn btn-sm ${isInternalNote ? "btn-danger" : "btn-success"}`}
                  disabled={submittingComment || !commentText.trim()}
                  data-testid="submit-comment-btn"
                >
                  {submittingComment
                    ? "Posting..."
                    : isInternalNote
                    ? "Post Internal Note"
                    : "Post Comment"}
                </button>
              </div>

              {commentError && (
                <div className="alert alert-danger py-1 px-2 small mt-2 mb-0">
                  {commentError}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Mandatory Resolution Summary Modal (BR-09 / UI-12) */}
      {pendingStatus && (
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
                <h5 className="modal-title fw-bold text-dark">
                  Resolution Summary Required
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setPendingStatus(null)}
                  disabled={updatingStatus}
                  aria-label="Close modal"
                ></button>
              </div>
              <div className="modal-body py-3">
                <p className="text-muted small mb-3">
                  Transitioning this ticket to <strong>{pendingStatus}</strong> requires a mandatory resolution summary statement describing how the issue was fixed.
                </p>

                <div className="mb-3">
                  <label htmlFor="resolution-input" className="form-label fw-medium text-dark small">
                    Resolution Summary <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="resolution-input"
                    className={`form-control ${resolutionError ? "is-invalid" : ""}`}
                    rows={4}
                    placeholder="Describe how the problem was resolved (min 10 characters)..."
                    value={resolutionSummary}
                    onChange={(e) => {
                      setResolutionSummary(e.target.value);
                      if (resolutionError) setResolutionError(null);
                    }}
                    disabled={updatingStatus}
                    data-testid="resolution-summary-input"
                  />
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    {resolutionError ? (
                      <div className="invalid-feedback d-block small">{resolutionError}</div>
                    ) : (
                      <small className="text-muted">Minimum 10 characters.</small>
                    )}
                    <small className="text-muted ms-auto">{resolutionSummary.trim().length} chars</small>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPendingStatus(null)}
                  disabled={updatingStatus}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={handleConfirmResolution}
                  disabled={updatingStatus || resolutionSummary.trim().length < 10}
                  data-testid="confirm-resolution-btn"
                >
                  {updatingStatus ? "Saving..." : `Confirm ${pendingStatus}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
