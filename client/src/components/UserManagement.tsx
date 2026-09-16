import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  AdminUser,
  UserRole,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
} from "../api";

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AdminUser | null>(null);

  // Create Form state
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createDepartment, setCreateDepartment] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("REQUESTER");
  const [createPassword, setCreatePassword] = useState("Password123!");
  const [createIsActive, setCreateIsActive] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Edit Form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("REQUESTER");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset Password Form state
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const isAdmin = currentUser?.role === "ADMIN";

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchAdminUsers({
        search: searchTerm.trim() || undefined,
        role: selectedRole !== "ALL" ? selectedRole : undefined,
        isActive: selectedStatus !== "ALL" ? selectedStatus : undefined,
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setUsers(res.data);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
    } catch (err: any) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, searchTerm, selectedRole, selectedStatus, page, limit]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Open Edit modal with pre-populated values
  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditDepartment(user.department || "");
    setEditRole(user.role);
    setEditIsActive(user.isActive);
    setEditError(null);
  };

  // Open Reset modal
  const handleOpenReset = (user: AdminUser) => {
    setResettingUser(user);
    setNewPassword("NewSecurePassword456!");
    setResetError(null);
    setResetSuccess(null);
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createName.trim()) {
      setCreateError("Name is required.");
      return;
    }
    if (!createEmail.trim() || !createEmail.includes("@")) {
      setCreateError("Valid email is required.");
      return;
    }
    if (createPassword.length < 8) {
      setCreateError("Initial password must be at least 8 characters.");
      return;
    }

    setCreating(true);
    try {
      await createAdminUser({
        name: createName.trim(),
        email: createEmail.trim().toLowerCase(),
        department: createDepartment.trim() || undefined,
        role: createRole,
        password: createPassword,
        isActive: createIsActive,
      });

      setShowCreateModal(false);
      setCreateName("");
      setCreateEmail("");
      setCreateDepartment("");
      setCreateRole("REQUESTER");
      setCreatePassword("Password123!");
      setCreateIsActive(true);
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    if (!editName.trim()) {
      setEditError("Name is required.");
      return;
    }
    if (!editEmail.trim() || !editEmail.includes("@")) {
      setEditError("Valid email is required.");
      return;
    }

    setSaving(true);
    try {
      await updateAdminUser(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        department: editDepartment.trim() || null,
        role: editRole,
        isActive: editIsActive,
      });

      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    setResetError(null);

    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }

    setResetting(true);
    try {
      const res = await resetAdminUserPassword(resettingUser.id, newPassword);
      setResetSuccess(res.message || "Password successfully reset.");
      setTimeout(() => {
        setResettingUser(null);
        setResetSuccess(null);
      }, 1500);
      await loadUsers();
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setResetting(false);
    }
  };

  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return (
          <span
            className="badge rounded-pill px-2 py-1 small fw-semibold"
            style={{ backgroundColor: "#FFF5F5", color: "#C53030", border: "1px solid #FEB2B2" }}
            data-testid="role-badge-admin"
          >
            Administrator
          </span>
        );
      case "STAFF":
        return (
          <span
            className="badge rounded-pill px-2 py-1 small fw-semibold"
            style={{ backgroundColor: "#E6F4EA", color: "#006B3C", border: "1px solid #A3E0BF" }}
            data-testid="role-badge-staff"
          >
            IT Staff
          </span>
        );
      case "REQUESTER":
      default:
        return (
          <span
            className="badge rounded-pill px-2 py-1 small fw-semibold"
            style={{ backgroundColor: "#EBF8FF", color: "#2B6CB0", border: "1px solid #BEE3F8" }}
            data-testid="role-badge-requester"
          >
            Requester
          </span>
        );
    }
  };

  if (!isAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger shadow-sm p-4 text-center mx-auto" style={{ maxWidth: "600px" }} role="alert">
          <span className="fs-1 d-block mb-2">🚫</span>
          <h2 className="h4 fw-bold mb-2">Access Denied</h2>
          <p className="mb-0 text-muted">
            User Management is restricted to Administrators only.
          </p>
        </div>
      </div>
    );
  }

  const startRecord = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalItems);

  return (
    <div className="container-fluid px-3 px-md-4 py-4" data-testid="user-management-page">
      {/* Header & Title */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">👥 User Management</h1>
          <p className="text-muted small mb-0">
            Create user accounts, assign roles, manage active status, and reset credentials
          </p>
        </div>
        <button
          type="button"
          className="btn btn-success d-flex align-items-center gap-1 shadow-sm"
          onClick={() => {
            setShowCreateModal(true);
            setCreateError(null);
          }}
          data-testid="create-user-btn"
        >
          <span>➕</span> Create User
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="card shadow-sm border-0 p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          {/* Search by Name or Email */}
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">🔍</span>
              <input
                type="text"
                className="form-control form-control-sm border-start-0"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                data-testid="user-search-input"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              data-testid="role-filter-select"
            >
              <option value="ALL">All Roles</option>
              <option value="REQUESTER">Requester</option>
              <option value="STAFF">IT Staff</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              data-testid="status-filter-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Refresh / Reset */}
          <div className="col-12 col-md-1 text-end">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={() => {
                setSearchTerm("");
                setSelectedRole("ALL");
                setSelectedStatus("ALL");
                setPage(1);
              }}
              title="Reset Filters"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger py-2 small mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading users...</span>
          </div>
        </div>
      )}

      {/* Users Table */}
      {!loading && (
        <div className="card shadow-sm border-0 bg-white overflow-hidden mb-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" data-testid="users-table">
              <thead className="table-light text-muted small">
                <tr>
                  <th>User Name</th>
                  <th>Email Address</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted small">
                      No users match the search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} data-testid={`user-row-${u.id}`}>
                      <td>
                        <div className="fw-semibold text-dark d-flex align-items-center gap-2">
                          <span>👤</span>
                          <span>{u.name}</span>
                          {currentUser && currentUser.id === u.id && (
                            <span className="badge bg-light text-secondary border small">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="small text-muted">{u.email}</td>
                      <td className="small text-muted">{u.department || "—"}</td>
                      <td>{renderRoleBadge(u.role)}</td>
                      <td>
                        {u.isActive ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small">
                            Active
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 small">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleOpenEdit(u)}
                            data-testid={`edit-user-btn-${u.id}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleOpenReset(u)}
                            data-testid={`reset-pwd-btn-${u.id}`}
                          >
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="d-flex flex-wrap justify-content-between align-items-center p-3 border-top bg-light">
            <div className="small text-muted mb-2 mb-sm-0">
              Showing <span className="fw-semibold">{startRecord}</span> to{" "}
              <span className="fw-semibold">{endRecord}</span> of{" "}
              <span className="fw-semibold">{totalItems}</span> users
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-1">
                <span className="small text-muted">Per page:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "70px" }}
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  data-testid="per-page-select"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  data-testid="prev-page-btn"
                >
                  Previous
                </button>
                <span className="btn btn-outline-secondary disabled bg-white text-dark">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  data-testid="next-page-btn"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Create User */}
      {showCreateModal && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content zen-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">Create New User Account</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body py-3">
                  {createError && (
                    <div className="alert alert-danger py-2 small mb-3">{createError}</div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-medium">Full Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="e.g. Kanya Ratana"
                      required
                      data-testid="create-name-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-medium">Email Address <span className="text-danger">*</span></label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="user@kmutt.ac.th"
                      required
                      data-testid="create-email-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-medium">Department</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={createDepartment}
                      onChange={(e) => setCreateDepartment(e.target.value)}
                      placeholder="e.g. Computer Engineering"
                      data-testid="create-dept-input"
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-medium">Role <span className="text-danger">*</span></label>
                      <select
                        className="form-select form-select-sm"
                        value={createRole}
                        onChange={(e) => setCreateRole(e.target.value as UserRole)}
                        data-testid="create-role-select"
                      >
                        <option value="REQUESTER">Requester</option>
                        <option value="STAFF">IT Staff</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-medium">Initial Password <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-monospace"
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        placeholder="Min 8 characters"
                        required
                        data-testid="create-password-input"
                      />
                    </div>
                  </div>

                  <div className="form-check form-switch mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="create-active-check"
                      checked={createIsActive}
                      onChange={(e) => setCreateIsActive(e.target.checked)}
                      data-testid="create-active-toggle"
                    />
                    <label className="form-check-label small fw-medium" htmlFor="create-active-check">
                      Account Active & Enabled
                    </label>
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success btn-sm" disabled={creating} data-testid="submit-create-user-btn">
                    {creating ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit User */}
      {editingUser && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content zen-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">Edit User Account</h5>
                <button type="button" className="btn-close" onClick={() => setEditingUser(null)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body py-3">
                  {editError && (
                    <div className="alert alert-danger py-2 small mb-3">{editError}</div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-medium">Full Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      data-testid="edit-name-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-medium">Email Address</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                      data-testid="edit-email-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-medium">Department</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      data-testid="edit-dept-input"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-medium">Assigned Role</label>
                    <select
                      className="form-select form-select-sm"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      data-testid="edit-role-select"
                    >
                      <option value="REQUESTER">Requester</option>
                      <option value="STAFF">IT Staff</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>

                  {/* Safety Guardrail Alert for Self-Account */}
                  {currentUser && currentUser.id === editingUser.id ? (
                    <div className="alert alert-info py-2 small mb-0">
                      ℹ️ You are currently signed in as this Administrator. Self-deactivation is prevented.
                    </div>
                  ) : (
                    <div className="form-check form-switch mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="edit-active-check"
                        checked={editIsActive}
                        onChange={(e) => setEditIsActive(e.target.checked)}
                        data-testid="edit-active-toggle"
                      />
                      <label className="form-check-label small fw-medium" htmlFor="edit-active-check">
                        Account Active & Enabled
                      </label>
                    </div>
                  )}
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingUser(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success btn-sm" disabled={saving} data-testid="submit-edit-user-btn">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Reset Password */}
      {resettingUser && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }} role="dialog" aria-modal="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content zen-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">Reset User Password</h5>
                <button type="button" className="btn-close" onClick={() => setResettingUser(null)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleResetSubmit}>
                <div className="modal-body py-3">
                  <p className="small text-muted mb-3">
                    Assign a new initial password for <strong>{resettingUser.name}</strong> ({resettingUser.email}).
                  </p>

                  <div className="alert alert-warning py-2 small mb-3">
                    ⚠️ The user will be flagged with <code>mustChangePassword = true</code> and forced to change this password immediately on their next login.
                  </div>

                  {resetError && (
                    <div className="alert alert-danger py-2 small mb-3">{resetError}</div>
                  )}
                  {resetSuccess && (
                    <div className="alert alert-success py-2 small mb-3">{resetSuccess}</div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-medium">New Initial Password <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-monospace"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                      data-testid="reset-password-input"
                    />
                  </div>
                </div>

                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setResettingUser(null)} disabled={resetting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger btn-sm" disabled={resetting || newPassword.length < 8} data-testid="submit-reset-password-btn">
                    {resetting ? "Resetting..." : "Set Initial Password"}
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
