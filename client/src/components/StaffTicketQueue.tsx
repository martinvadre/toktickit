import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  StaffTicket,
  StaffMember,
  Category,
  RelatedSystem,
  fetchStaffTickets,
  fetchStaffMembers,
  fetchCategories,
  fetchRelatedSystems,
} from "../api";

interface StaffTicketQueueProps {
  onSelectTicket?: (ticketId: number) => void;
}

export const StaffTicketQueue: React.FC<StaffTicketQueueProps> = ({ onSelectTicket }) => {
  const { user } = useAuth();

  // Filters & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSystem, setSelectedSystem] = useState("ALL");
  const [selectedAssignee, setSelectedAssignee] = useState("ALL");
  const [selectedReqPriority, setSelectedReqPriority] = useState("ALL");
  const [selectedItPriority, setSelectedItPriority] = useState("ALL");

  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Data State
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [systems, setSystems] = useState<RelatedSystem[]>([]);

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({
    total: 0,
    unassigned: 0,
    inProgress: 0,
    resolved: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaffOrAdmin = user?.role === "STAFF" || user?.role === "ADMIN";

  // Load reference metadata (staff members, categories, related systems)
  useEffect(() => {
    if (!isStaffOrAdmin) return;

    async function loadMetadata() {
      try {
        const [membersRes, catsRes, sysRes] = await Promise.all([
          fetchStaffMembers().catch(() => []),
          fetchCategories().catch(() => []),
          fetchRelatedSystems().catch(() => []),
        ]);
        setStaffMembers(membersRes);
        setCategories(catsRes);
        setSystems(sysRes);
      } catch (err) {
        console.error("Failed to load filter reference data", err);
      }
    }

    loadMetadata();
  }, [isStaffOrAdmin]);

  // Load staff tickets
  const loadTickets = useCallback(async () => {
    if (!isStaffOrAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchStaffTickets({
        search: searchTerm.trim() || undefined,
        status: selectedStatus,
        categoryId: selectedCategory,
        relatedSystemId: selectedSystem,
        assignedStaffId: selectedAssignee,
        requestedPriority: selectedReqPriority,
        itPriority: selectedItPriority,
        page,
        limit,
        sortBy,
        sortOrder,
      });

      setTickets(res.data);
      setTotalItems(res.pagination.totalItems);
      setTotalPages(res.pagination.totalPages);
      setCounts(res.counts);
    } catch (err: any) {
      setError(err.message || "Failed to load IT Staff tickets");
    } finally {
      setLoading(false);
    }
  }, [
    isStaffOrAdmin,
    searchTerm,
    selectedStatus,
    selectedCategory,
    selectedSystem,
    selectedAssignee,
    selectedReqPriority,
    selectedItPriority,
    page,
    limit,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("ALL");
    setSelectedCategory("ALL");
    setSelectedSystem("ALL");
    setSelectedAssignee("ALL");
    setSelectedReqPriority("ALL");
    setSelectedItPriority("ALL");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    selectedStatus !== "ALL" ||
    selectedCategory !== "ALL" ||
    selectedSystem !== "ALL" ||
    selectedAssignee !== "ALL" ||
    selectedReqPriority !== "ALL" ||
    selectedItPriority !== "ALL"
  );

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return " ↕";
    return sortOrder === "asc" ? " ↑" : " ↓";
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
      });
    } catch {
      return dateStr;
    }
  };

  // Guardrail: Non-Staff / Non-Admin Access Forbidden
  if (!isStaffOrAdmin) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger shadow-sm p-4 text-center mx-auto" style={{ maxWidth: "600px" }} role="alert">
          <span className="fs-1 d-block mb-2">🚫</span>
          <h2 className="h4 fw-bold mb-2">Access Denied</h2>
          <p className="mb-0 text-muted">
            The IT Staff Ticket Queue is restricted to IT Staff and Administrators.
          </p>
        </div>
      </div>
    );
  }

  const startRecord = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalItems);

  return (
    <div className="container-fluid px-3 px-md-4 py-4" data-testid="staff-ticket-queue">
      {/* Header & Title */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">📥 IT Staff Ticket Queue</h1>
          <p className="text-muted small mb-0">
            Global ticket triage, multi-criteria filtering, and lifecycle management
          </p>
        </div>
        <button
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
          onClick={loadTickets}
          disabled={loading}
          title="Refresh Queue"
        >
          <span>🔄</span> {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-4 border-success p-3 h-100">
            <div className="text-muted small fw-medium">Total Tickets</div>
            <div className="h3 fw-bold text-dark mt-1 mb-0" data-testid="count-total">
              {counts.total}
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-4 border-warning p-3 h-100">
            <div className="text-muted small fw-medium">Unassigned</div>
            <div className="h3 fw-bold text-warning mt-1 mb-0" data-testid="count-unassigned">
              {counts.unassigned}
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-4 border-primary p-3 h-100">
            <div className="text-muted small fw-medium">In Progress</div>
            <div className="h3 fw-bold text-primary mt-1 mb-0" data-testid="count-in-progress">
              {counts.inProgress}
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card shadow-sm border-0 border-start border-4 border-info p-3 h-100">
            <div className="text-muted small fw-medium">Resolved</div>
            <div className="h3 fw-bold text-info mt-1 mb-0" data-testid="count-resolved">
              {counts.resolved}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Criteria Filter Toolbar */}
      <div className="card shadow-sm border-0 p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          {/* Keyword Search */}
          <div className="col-12 col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">🔍</span>
              <input
                type="text"
                className="form-control form-control-sm border-start-0"
                placeholder="Search ticket #, summary, requester..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                data-testid="search-input"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-sm-4 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              data-testid="status-filter"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_REQUESTER">Pending Requester</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-sm-4 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              data-testid="category-filter"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Related System Filter */}
          <div className="col-6 col-sm-4 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedSystem}
              onChange={(e) => {
                setSelectedSystem(e.target.value);
                setPage(1);
              }}
              data-testid="system-filter"
            >
              <option value="ALL">All Systems</option>
              {systems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="col-6 col-sm-4 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedAssignee}
              onChange={(e) => {
                setSelectedAssignee(e.target.value);
                setPage(1);
              }}
              data-testid="assignee-filter"
            >
              <option value="ALL">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {staffMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* IT Priority Filter */}
          <div className="col-6 col-sm-4 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedItPriority}
              onChange={(e) => {
                setSelectedItPriority(e.target.value);
                setPage(1);
              }}
              data-testid="it-priority-filter"
            >
              <option value="ALL">All IT Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Requested Priority Filter */}
          <div className="col-6 col-sm-4 col-md-2">
            <select
              className="form-select form-select-sm"
              value={selectedReqPriority}
              onChange={(e) => {
                setSelectedReqPriority(e.target.value);
                setPage(1);
              }}
              data-testid="req-priority-filter"
            >
              <option value="ALL">All Req Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={handleClearFilters}
                data-testid="clear-filters-btn"
              >
                ✕ Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger py-3 small d-flex justify-content-between align-items-center mb-4" role="alert">
          <div>
            <strong>Error:</strong> {error}
          </div>
          <button className="btn btn-sm btn-outline-danger" onClick={loadTickets}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading IT Staff queue...</span>
          </div>
          <div className="text-muted small mt-2">Loading tickets...</div>
        </div>
      )}

      {/* Empty State: No items match */}
      {!loading && !error && tickets.length === 0 && (
        <div className="card shadow-sm border-0 p-5 text-center bg-white my-3">
          <span className="fs-1 mb-2">📭</span>
          <h2 className="h5 fw-bold mb-1">No Tickets Found</h2>
          <p className="text-muted small mb-3">
            {hasActiveFilters
              ? "No tickets match your current filter and search criteria."
              : "There are currently no tickets in the IT service queue."}
          </p>
          {hasActiveFilters && (
            <div>
              <button className="btn btn-sm btn-outline-success" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Data View: Desktop Table & Mobile Cards */}
      {!loading && !error && tickets.length > 0 && (
        <div className="card shadow-sm border-0 bg-white overflow-hidden mb-4">
          {/* Desktop Table View (>= 992px) */}
          <div className="table-responsive d-none d-lg-block">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted small">
                <tr>
                  <th
                    style={{ cursor: "pointer", width: "160px" }}
                    onClick={() => handleSort("ticketNumber")}
                  >
                    Ticket No.{getSortIcon("ticketNumber")}
                  </th>
                  <th
                    style={{ cursor: "pointer", width: "130px" }}
                    onClick={() => handleSort("createdAt")}
                  >
                    Created{getSortIcon("createdAt")}
                  </th>
                  <th>Summary & Requester</th>
                  <th>Category / System</th>
                  <th
                    style={{ cursor: "pointer", width: "120px" }}
                    onClick={() => handleSort("requestedPriority")}
                  >
                    Req Priority{getSortIcon("requestedPriority")}
                  </th>
                  <th
                    style={{ cursor: "pointer", width: "120px" }}
                    onClick={() => handleSort("itPriority")}
                  >
                    IT Priority{getSortIcon("itPriority")}
                  </th>
                  <th
                    style={{ cursor: "pointer", width: "130px" }}
                    onClick={() => handleSort("currentStatus")}
                  >
                    Status{getSortIcon("currentStatus")}
                  </th>
                  <th style={{ width: "160px" }}>Assigned Staff</th>
                  <th style={{ width: "90px" }} className="text-end">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none fw-bold text-success"
                        onClick={() => onSelectTicket && onSelectTicket(t.id)}
                      >
                        {t.ticketNumber}
                      </button>
                    </td>
                    <td className="small text-muted">{formatDate(t.createdAt)}</td>
                    <td>
                      <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: "300px" }}>
                        {t.summary}
                      </div>
                      <div className="small text-muted">
                        👤 {t.requester.name} ({t.requester.department || t.requester.email})
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border me-1">
                        {t.category.name}
                      </span>
                      <span className="small text-muted">/ {t.relatedSystem.name}</span>
                    </td>
                    <td>
                      <span className={getPriorityBadgeClass(t.requestedPriority)}>
                        {t.requestedPriority}
                      </span>
                    </td>
                    <td>
                      <span className={getPriorityBadgeClass(t.itPriority)}>
                        {t.itPriority}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(t.currentStatus)}>
                        {t.currentStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      {t.assignedStaff ? (
                        <span className="badge bg-light text-dark border">
                          👨‍💻 {t.assignedStaff.name}
                        </span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={() => onSelectTicket && onSelectTicket(t.id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (< 992px) */}
          <div className="d-block d-lg-none p-3">
            <div className="row g-3">
              {tickets.map((t) => (
                <div key={t.id} className="col-12">
                  <div className="card shadow-sm border p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none fw-bold text-success"
                        onClick={() => onSelectTicket && onSelectTicket(t.id)}
                      >
                        {t.ticketNumber}
                      </button>
                      <span className="small text-muted">{formatDate(t.createdAt)}</span>
                    </div>

                    <div className="fw-semibold text-dark mb-1">{t.summary}</div>
                    <div className="small text-muted mb-2">
                      👤 {t.requester.name} ({t.requester.email})
                    </div>

                    <div className="d-flex flex-wrap gap-1 mb-2">
                      <span className="badge bg-light text-dark border">
                        {t.category.name}
                      </span>
                      <span className="badge bg-light text-secondary border">
                        {t.relatedSystem.name}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <div className="d-flex gap-1">
                        <span className={getStatusBadgeClass(t.currentStatus)}>
                          {t.currentStatus.replace("_", " ")}
                        </span>
                        <span className={getPriorityBadgeClass(t.itPriority)}>
                          {t.itPriority}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={() => onSelectTicket && onSelectTicket(t.id)}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Footer */}
          <div className="d-flex flex-wrap justify-content-between align-items-center p-3 border-top bg-light">
            <div className="small text-muted mb-2 mb-sm-0">
              Showing <span className="fw-semibold">{startRecord}</span> to{" "}
              <span className="fw-semibold">{endRecord}</span> of{" "}
              <span className="fw-semibold">{totalItems}</span> tickets
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
    </div>
  );
};
