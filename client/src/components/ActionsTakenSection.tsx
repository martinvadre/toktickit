import React, { useState } from "react";
import {
  ActionTaken,
  ActionStatus,
  StaffMember,
  createActionTaken,
  updateActionTaken,
} from "../api";

interface ActionsTakenSectionProps {
  ticketId: number;
  actions: ActionTaken[];
  isStaff: boolean;
  currentUserId?: number;
  staffList?: StaffMember[];
  onActionSaved: () => void;
}

export const ActionsTakenSection: React.FC<ActionsTakenSectionProps> = ({
  ticketId,
  actions,
  isStaff,
  currentUserId,
  staffList = [],
  onActionSaved,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null);

  // Form State
  const [formDateTime, setFormDateTime] = useState<string>("");
  const [formPerformedById, setFormPerformedById] = useState<number>(currentUserId || 6);
  const [formDescription, setFormDescription] = useState<string>("");
  const [formResult, setFormResult] = useState<string>("");
  const [formStatus, setFormStatus] = useState<ActionStatus>("COMPLETED");
  const [formFollowUpRequired, setFormFollowUpRequired] = useState<boolean>(false);
  const [formFollowUpNote, setFormFollowUpNote] = useState<string>("");
  const [formAttachmentNotes, setFormAttachmentNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const resetForm = () => {
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormDateTime(localIso);
    setFormPerformedById(currentUserId || (staffList[0]?.id ?? 6));
    setFormDescription("");
    setFormResult("");
    setFormStatus("COMPLETED");
    setFormFollowUpRequired(false);
    setFormFollowUpNote("");
    setFormAttachmentNotes("");
    setFormError(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (action: ActionTaken) => {
    const d = new Date(action.actionDateTime);
    const localIso = !isNaN(d.getTime())
      ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : "";
    setFormDateTime(localIso);
    setFormPerformedById(action.performedBy.id);
    setFormDescription(action.actionDescription);
    setFormResult(action.result);
    setFormStatus(action.status);
    setFormFollowUpRequired(action.followUpRequired);
    setFormFollowUpNote(action.followUpNote || "");
    setFormAttachmentNotes(action.attachmentNotes || "");
    setFormError(null);
    setEditingAction(action);
  };

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Frontend validation
    if (!formDescription || formDescription.trim().length < 5) {
      setFormError("Action description must be at least 5 characters.");
      return;
    }

    if (!formResult || formResult.trim().length < 3) {
      setFormError("Result must be at least 3 characters.");
      return;
    }

    if (formFollowUpRequired && (!formFollowUpNote || formFollowUpNote.trim().length < 5)) {
      setFormError("Follow-up note of at least 5 characters is required when follow-up is needed.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingAction) {
        await updateActionTaken(ticketId, editingAction.id, {
          actionDateTime: formDateTime ? new Date(formDateTime).toISOString() : undefined,
          actionDescription: formDescription.trim(),
          result: formResult.trim(),
          performedById: formPerformedById,
          status: formStatus,
          followUpRequired: formFollowUpRequired,
          followUpNote: formFollowUpRequired ? formFollowUpNote.trim() : null,
          attachmentNotes: formAttachmentNotes.trim() || null,
        });
        setEditingAction(null);
      } else {
        await createActionTaken(ticketId, {
          actionDateTime: formDateTime ? new Date(formDateTime).toISOString() : undefined,
          actionDescription: formDescription.trim(),
          result: formResult.trim(),
          performedById: formPerformedById,
          status: formStatus,
          followUpRequired: formFollowUpRequired,
          followUpNote: formFollowUpRequired ? formFollowUpNote.trim() : null,
          attachmentNotes: formAttachmentNotes.trim() || null,
        });
        setShowCreateModal(false);
      }
      onActionSaved();
    } catch (err: any) {
      setFormError(err.message || "Failed to save Action Taken.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusTransition = async (action: ActionTaken, nextStatus: ActionStatus) => {
    try {
      await updateActionTaken(ticketId, action.id, { status: nextStatus });
      onActionSaved();
    } catch (err: any) {
      alert(err.message || "Failed to update action status.");
    }
  };

  const renderStatusBadge = (status: ActionStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
            ✓ Completed
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25 px-2 py-1">
            ⚙ In Progress
          </span>
        );
      case "PENDING":
        return (
          <span className="badge bg-info bg-opacity-10 text-info-emphasis border border-info border-opacity-25 px-2 py-1">
            ⏳ Pending
          </span>
        );
      case "CANCELLED":
        return (
          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">
            ✕ Cancelled
          </span>
        );
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4" data-testid="actions-taken-section">
      <div className="card-header bg-white border-bottom py-3 d-flex flex-wrap align-items-center justify-content-between">
        <div>
          <h3 className="h6 fw-bold mb-0 text-success d-flex align-items-center gap-2">
            <span>📋</span> Actions Taken
            <span className="badge rounded-pill bg-light text-dark border ms-1">
              {actions.length}
            </span>
          </h3>
          <p className="small text-muted mb-0 mt-1">
            {isStaff
              ? "Plan, record, and track actual technical labor and resolution steps."
              : "Actions logged by IT Staff to investigate and resolve your request."}
          </p>
        </div>

        {isStaff && (
          <button
            type="button"
            className="btn btn-sm btn-success fw-medium shadow-sm d-inline-flex align-items-center gap-1"
            onClick={handleOpenCreate}
            data-testid="record-action-button"
          >
            <span>➕</span> Record Action
          </button>
        )}
      </div>

      <div className="card-body p-0">
        {actions.length === 0 ? (
          <div className="text-center py-5 px-3 text-muted">
            <span className="fs-1 d-block mb-2 text-secondary opacity-50">📂</span>
            <p className="mb-0 fw-medium">No actions taken recorded yet.</p>
            {isStaff && (
              <p className="small text-muted mt-1">
                Click <strong>"Record Action"</strong> to log work performed on this ticket.
              </p>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" data-testid="actions-table">
              <thead className="table-light small text-muted text-uppercase">
                <tr>
                  <th style={{ minWidth: "150px" }}>Date & Time</th>
                  <th style={{ minWidth: "140px" }}>Performed By</th>
                  <th style={{ minWidth: "200px" }}>Action Description</th>
                  <th style={{ minWidth: "200px" }}>Result</th>
                  <th style={{ minWidth: "110px" }}>Status</th>
                  <th style={{ minWidth: "160px" }}>Follow-up</th>
                  {isStaff && <th style={{ minWidth: "150px" }} className="text-end">Actions</th>}
                </tr>
              </thead>
              <tbody className="small">
                {actions.map((action) => (
                  <tr key={action.id} data-testid={`action-row-${action.id}`}>
                    <td className="fw-medium text-secondary">
                      {new Date(action.actionDateTime).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{action.performedBy?.name}</div>
                      <span className="badge bg-light text-muted border px-1">
                        {action.performedBy?.role || "STAFF"}
                      </span>
                    </td>
                    <td>
                      <div className="text-dark fw-medium">{action.actionDescription}</div>
                      {action.attachmentNotes && (
                        <div className="small text-muted mt-1">
                          <span className="me-1">📎</span>
                          <em>{action.attachmentNotes}</em>
                        </div>
                      )}
                    </td>
                    <td className="text-secondary">{action.result}</td>
                    <td>{renderStatusBadge(action.status)}</td>
                    <td>
                      {action.followUpRequired ? (
                        <div>
                          <span className="badge bg-warning bg-opacity-25 text-warning-emphasis border border-warning border-opacity-50 mb-1">
                            ⚠️ Follow-up
                          </span>
                          {action.followUpNote && (
                            <div className="small text-dark font-monospace bg-light p-1 rounded border">
                              {action.followUpNote}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    {isStaff && (
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => handleOpenEdit(action)}
                            data-testid={`edit-action-${action.id}`}
                            title="Edit Action"
                          >
                            ✏️ Edit
                          </button>
                          {action.status !== "COMPLETED" && (
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm"
                              onClick={() => handleQuickStatusTransition(action, "COMPLETED")}
                              title="Mark as Completed"
                            >
                              ✓ Complete
                            </button>
                          )}
                          {action.status !== "CANCELLED" && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleQuickStatusTransition(action, "CANCELLED")}
                              title="Cancel Action"
                            >
                              ✕ Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Create or Edit Action Taken */}
      {(showCreateModal || editingAction) && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <form onSubmit={handleSaveAction} noValidate>
                <div className="modal-header bg-success text-white py-3">
                  <h4 className="modal-title h6 fw-bold mb-0">
                    {editingAction ? "✏️ Edit Action Taken" : "➕ Record Action Taken"}
                  </h4>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Close"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingAction(null);
                    }}
                  />
                </div>

                <div className="modal-body p-4">
                  {formError && (
                    <div className="alert alert-danger py-2 small" role="alert" data-testid="form-error">
                      ⚠️ {formError}
                    </div>
                  )}

                  <div className="row g-3">
                    {/* Action Date & Time */}
                    <div className="col-md-6">
                      <label htmlFor="actionDateTime" className="form-label small fw-semibold">
                        Action Date & Time <span className="text-danger">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="actionDateTime"
                        className="form-control form-control-sm"
                        value={formDateTime}
                        onChange={(e) => setFormDateTime(e.target.value)}
                        required
                      />
                    </div>

                    {/* Performer / Assignee */}
                    <div className="col-md-6">
                      <label htmlFor="performedById" className="form-label small fw-semibold">
                        Performed By (IT Staff) <span className="text-danger">*</span>
                      </label>
                      <select
                        id="performedById"
                        className="form-select form-select-sm"
                        value={formPerformedById}
                        onChange={(e) => setFormPerformedById(Number(e.target.value))}
                        required
                      >
                        {staffList.length > 0 ? (
                          staffList.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role})
                            </option>
                          ))
                        ) : (
                          <option value={currentUserId || 6}>
                            Current User ({currentUserId || 6})
                          </option>
                        )}
                      </select>
                      <div className="form-text small">
                        Defaults to current user; can be assigned to another active IT Staff member (BR-02).
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-md-6">
                      <label htmlFor="actionStatus" className="form-label small fw-semibold">
                        Action Status
                      </label>
                      <select
                        id="actionStatus"
                        className="form-select form-select-sm"
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as ActionStatus)}
                      >
                        <option value="COMPLETED">Completed</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="PENDING">Pending</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>

                    {/* Attachment / Evidence Notes */}
                    <div className="col-md-6">
                      <label htmlFor="attachmentNotes" className="form-label small fw-semibold">
                        Attachment / Evidence Notes
                      </label>
                      <input
                        type="text"
                        id="attachmentNotes"
                        className="form-control form-control-sm"
                        placeholder="e.g. diag_battery.log, cable_continuity.png"
                        value={formAttachmentNotes}
                        onChange={(e) => setFormAttachmentNotes(e.target.value)}
                      />
                    </div>

                    {/* Action Description */}
                    <div className="col-12">
                      <label htmlFor="actionDescription" className="form-label small fw-semibold">
                        Action Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="actionDescription"
                        className="form-control form-control-sm"
                        rows={3}
                        placeholder="Describe the technical work, troubleshooting, or maintenance performed..."
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        required
                        data-testid="action-description-input"
                      />
                    </div>

                    {/* Result */}
                    <div className="col-12">
                      <label htmlFor="actionResult" className="form-label small fw-semibold">
                        Result / Technical Outcome <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="actionResult"
                        className="form-control form-control-sm"
                        rows={2}
                        placeholder="State the observed outcome or diagnostic findings..."
                        value={formResult}
                        onChange={(e) => setFormResult(e.target.value)}
                        required
                        data-testid="action-result-input"
                      />
                    </div>

                    {/* Follow-up Required Checkbox */}
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          id="followUpRequired"
                          className="form-check-input"
                          checked={formFollowUpRequired}
                          onChange={(e) => setFormFollowUpRequired(e.target.checked)}
                          data-testid="follow-up-checkbox"
                        />
                        <label htmlFor="followUpRequired" className="form-check-label small fw-semibold">
                          Follow-up Required?
                        </label>
                      </div>
                    </div>

                    {/* Follow-up Note (conditionally visible and required) */}
                    {formFollowUpRequired && (
                      <div className="col-12" data-testid="follow-up-note-container">
                        <label htmlFor="followUpNote" className="form-label small fw-semibold text-warning-emphasis">
                          Follow-up Note <span className="text-danger">*</span>
                        </label>
                        <textarea
                          id="followUpNote"
                          className="form-control form-control-sm border-warning"
                          rows={2}
                          placeholder="Specify the next steps, pending vendor parts, or follow-up schedule..."
                          value={formFollowUpNote}
                          onChange={(e) => setFormFollowUpNote(e.target.value)}
                          required={formFollowUpRequired}
                          data-testid="follow-up-note-input"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer bg-light py-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingAction(null);
                    }}
                    disabled={submitting}
                    data-testid="cancel-action-modal-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm btn-success fw-medium"
                    disabled={submitting}
                    data-testid="save-action-button"
                  >
                    {submitting ? "Saving..." : editingAction ? "Update Action" : "Save Action Taken"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
