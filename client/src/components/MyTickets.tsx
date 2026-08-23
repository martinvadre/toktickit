import React, { useState, useEffect, useCallback } from "react";
import { useRequester } from "../context/RequesterContext";
import {
  Category,
  TicketListItem,
  PaginationMetadata,
  fetchCategories,
  fetchMyTickets,
} from "../api";

interface MyTicketsProps {
  onCreateTicket?: () => void;
  onSelectTicket?: (ticketId: number) => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({
  onCreateTicket,
  onSelectTicket,
}) => {
  const { currentRequester } = useRequester();

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Data states
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load Categories for filter dropdown
  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    }
    loadCats();
  }, []);

  // Fetch Tickets
  const loadTickets = useCallback(async () => {
    if (!currentRequester) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetchMyTickets({
        requesterId: currentRequester.id,
        search: searchTerm.trim() || undefined,
        categoryId: selectedCategory ? parseInt(selectedCategory, 10) : undefined,
        status: selectedStatus || undefined,
        priority: selectedPriority || undefined,
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setTickets(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [
    currentRequester,
    searchTerm,
    selectedCategory,
    selectedStatus,
    selectedPriority,
    page,
    limit,
  ]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedStatus("");
    setSelectedPriority("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() || selectedCategory || selectedStatus || selectedPriority
  );

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

  return (
    <div className="container py-4">
      {/* Header Bar */}
      <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between mb-4 gap-2">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1">My Tickets</h1>
          <p className="text-muted small mb-0">
            View, search, and track all IT requests submitted under your account.
          </p>
        </div>
        {onCreateTicket && (
          <button
            type="button"
            className="zen-btn-primary d-inline-flex align-items-center"
            onClick={onCreateTicket}
          >
            <span className="me-1 fw-bold">+</span> Create Ticket
          </button>
        )}
      </div>

      {/* Filter & Search Card */}
      <div className="zen-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          {/* Search Input */}
          <div className="col-12 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-white text-muted border-end-0">🔍</span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by ticket number or summary..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                aria-label="Search tickets"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Category"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <select
              className="form-select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Status"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_REQUESTER">Pending Requester</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <select
              className="form-select"
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Priority"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="col-6 col-md-3 col-lg-2 text-end">
            <button
              type="button"
              className="btn btn-outline-secondary w-100"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4" role="alert">
          <div>
            <strong>Error:</strong> {error}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={loadTickets}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="text-center py-5 zen-card">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading tickets...</span>
          </div>
          <p className="text-muted small mt-2">Loading your support tickets...</p>
        </div>
      )}

      {/* Empty State: No tickets submitted yet */}
      {!loading && !error && tickets.length === 0 && !hasActiveFilters && (
        <div className="zen-card text-center py-5 p-4">
          <div className="fs-1 mb-3">🎫</div>
          <h2 className="h5 fw-bold text-dark mb-2">You haven't submitted any tickets yet.</h2>
          <p className="text-muted small mb-4" style={{ maxWidth: "450px", margin: "0 auto" }}>
            Whenever you experience an IT issue, submit a ticket to get support from the IT team.
          </p>
          {onCreateTicket && (
            <button type="button" className="zen-btn-primary" onClick={onCreateTicket}>
              + Create Your First Ticket
            </button>
          )}
        </div>
      )}

      {/* No Results State: Filter match failure */}
      {!loading && !error && tickets.length === 0 && hasActiveFilters && (
        <div className="zen-card text-center py-5 p-4">
          <div className="fs-1 mb-3">🔍</div>
          <h2 className="h5 fw-bold text-dark mb-2">No matching tickets found</h2>
          <p className="text-muted small mb-3">
            No tickets match your search criteria. Try adjusting or clearing your filters.
          </p>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Ticket List View (Desktop Table & Mobile Cards) */}
      {!loading && !error && tickets.length > 0 && (
        <div className="zen-card overflow-hidden">
          {/* Desktop Table View (>= 768px) */}
          <div className="table-responsive d-none d-md-block">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" style={{ width: "160px" }}>Ticket No.</th>
                  <th scope="col" style={{ width: "170px" }}>Created Date</th>
                  <th scope="col">Summary</th>
                  <th scope="col">Category</th>
                  <th scope="col">Related System</th>
                  <th scope="col" style={{ width: "100px" }}>Priority</th>
                  <th scope="col" style={{ width: "120px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    style={{ cursor: onSelectTicket ? "pointer" : "default" }}
                    onClick={() => onSelectTicket && onSelectTicket(ticket.id)}
                  >
                    <td>
                      <span className="text-success fw-bold font-monospace">
                        {ticket.ticketNumber}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td>
                      <span className="fw-medium text-dark">
                        {ticket.summary}
                      </span>
                    </td>
                    <td>
                      <span className="small text-secondary">
                        {ticket.category?.name || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="small text-secondary">
                        {ticket.relatedSystem?.name || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={getPriorityBadgeClass(ticket.requestedPriority)}>
                        {ticket.requestedPriority}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(ticket.currentStatus)}>
                        {ticket.currentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="d-md-none p-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="card mb-3 p-3 border shadow-none"
                style={{ cursor: onSelectTicket ? "pointer" : "default" }}
                onClick={() => onSelectTicket && onSelectTicket(ticket.id)}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-success fw-bold font-monospace small">
                    {ticket.ticketNumber}
                  </span>
                  <span className={getStatusBadgeClass(ticket.currentStatus)}>
                    {ticket.currentStatus}
                  </span>
                </div>
                <h3 className="h6 fw-bold text-dark mb-2">{ticket.summary}</h3>
                <div className="d-flex flex-wrap gap-2 small text-muted mb-2">
                  <span>📂 {ticket.category?.name || "Uncategorized"}</span>
                  <span>🖥️ {ticket.relatedSystem?.name || "General"}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <span className="text-muted small">{formatDate(ticket.createdAt)}</span>
                  <span className={getPriorityBadgeClass(ticket.requestedPriority)}>
                    {ticket.requestedPriority}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="p-3 border-top d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
            <div className="small text-muted">
              Showing{" "}
              <strong>
                {pagination.totalItems === 0
                  ? 0
                  : (pagination.currentPage - 1) * pagination.limit + 1}
              </strong>{" "}
              to{" "}
              <strong>
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalItems
                )}
              </strong>{" "}
              of <strong>{pagination.totalItems}</strong> tickets
            </div>

            <div className="d-flex align-items-center gap-3">
              {/* Limit Selector */}
              <div className="d-flex align-items-center gap-1">
                <span className="small text-muted">Show:</span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "70px" }}
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  aria-label="Items per page"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>

              {/* Page Buttons */}
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPreviousPage}
                >
                  ‹ Previous
                </button>
                <button type="button" className="btn btn-secondary disabled text-white">
                  {pagination.currentPage} / {pagination.totalPages}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage}
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
