import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  RequesterDashboardData,
  fetchRequesterDashboard,
} from "../api";

interface RequesterDashboardProps {
  onNavigateToTickets?: (filterStatus?: string) => void;
  onSelectTicket?: (ticketId: number) => void;
  onCreateTicket?: () => void;
}

export const RequesterDashboard: React.FC<RequesterDashboardProps> = ({
  onNavigateToTickets,
  onSelectTicket,
  onCreateTicket,
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<RequesterDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchRequesterDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load requester dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <span className="badge bg-primary-subtle text-primary-emphasis border">Open</span>;
      case "IN_PROGRESS":
        return <span className="badge bg-warning-subtle text-warning-emphasis border">In Progress</span>;
      case "WAITING_FOR_REQUESTER":
      case "PENDING_REQUESTER":
        return <span className="badge bg-info-subtle text-info-emphasis border">Waiting on You</span>;
      case "RESOLVED":
        return <span className="badge bg-success-subtle text-success-emphasis border">Resolved</span>;
      case "CLOSED":
        return <span className="badge bg-secondary-subtle text-secondary-emphasis border">Closed</span>;
      default:
        return <span className="badge bg-light text-dark border">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <span className="badge bg-danger text-white">Urgent</span>;
      case "HIGH":
        return <span className="badge bg-warning text-dark">High</span>;
      case "MEDIUM":
        return <span className="badge bg-info text-dark">Medium</span>;
      case "LOW":
        return <span className="badge bg-light text-secondary border">Low</span>;
      default:
        return <span className="badge bg-light text-dark border">{priority}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" data-testid="dashboard-loading">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
        <p className="text-muted mt-2 small">Loading your IT request metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger shadow-sm p-4 text-center mx-auto" style={{ maxWidth: "600px" }} role="alert">
          <h2 className="h5 fw-bold mb-2">Error Loading Dashboard</h2>
          <p className="mb-3 text-muted">{error || "Failed to load dashboard data."}</p>
          <button className="btn btn-sm btn-outline-danger" onClick={loadDashboard}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { metrics, recentTickets } = data;

  return (
    <div className="container-fluid px-3 px-md-4 py-4" data-testid="requester-dashboard">
      {/* Welcome Banner */}
      <div className="card shadow-sm border-0 bg-white p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h1 className="h4 fw-bold text-dark mb-1">
              Welcome back, {user?.name || "Requester"} 👋
            </h1>
            <p className="text-muted small mb-0">
              Here is an authoritative summary of your IT service requests and recent activity.
            </p>
          </div>
          <div className="d-flex gap-2">
            {onCreateTicket && (
              <button
                type="button"
                className="btn btn-success btn-sm d-flex align-items-center gap-1 shadow-sm"
                onClick={onCreateTicket}
                data-testid="quick-create-ticket"
              >
                <span>➕</span> Create New Ticket
              </button>
            )}
            {onNavigateToTickets && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => onNavigateToTickets()}
                data-testid="quick-my-tickets"
              >
                View All My Tickets
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Authoritative KPI Metric Cards (UI-08, UI-09) */}
      <div className="row g-3 mb-4">
        {/* Open Tickets */}
        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card shadow-sm border-0 p-3 h-100 cursor-pointer hover-shadow transition"
            onClick={() => onNavigateToTickets && onNavigateToTickets("OPEN")}
            data-testid="metric-open"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer", borderTop: "4px solid #0d6efd" }}
          >
            <div className="text-muted small fw-medium mb-1">Open Tickets</div>
            <div className="h3 fw-bold text-primary mb-0" data-testid="count-open">
              {metrics.openTickets}
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card shadow-sm border-0 p-3 h-100 cursor-pointer hover-shadow transition"
            onClick={() => onNavigateToTickets && onNavigateToTickets("IN_PROGRESS")}
            data-testid="metric-in-progress"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer", borderTop: "4px solid #ffc107" }}
          >
            <div className="text-muted small fw-medium mb-1">In Progress</div>
            <div className="h3 fw-bold text-warning-emphasis mb-0" data-testid="count-in-progress">
              {metrics.inProgressTickets}
            </div>
          </div>
        </div>

        {/* Waiting on You */}
        <div className="col-6 col-md-4 col-xl-3">
          <div
            className="card shadow-sm border-0 p-3 h-100 cursor-pointer hover-shadow transition"
            onClick={() => onNavigateToTickets && onNavigateToTickets("WAITING_FOR_REQUESTER")}
            data-testid="metric-waiting"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer", borderTop: "4px solid #0dcaf0" }}
          >
            <div className="text-muted small fw-medium mb-1">Waiting on You</div>
            <div className="h3 fw-bold text-info-emphasis mb-0" data-testid="count-waiting">
              {metrics.waitingForRequesterTickets}
            </div>
          </div>
        </div>

        {/* Resolved */}
        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card shadow-sm border-0 p-3 h-100 cursor-pointer hover-shadow transition"
            onClick={() => onNavigateToTickets && onNavigateToTickets("RESOLVED")}
            data-testid="metric-resolved"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer", borderTop: "4px solid #006B3C" }}
          >
            <div className="text-muted small fw-medium mb-1">Resolved</div>
            <div className="h3 fw-bold text-success mb-0" data-testid="count-resolved">
              {metrics.resolvedTickets}
            </div>
          </div>
        </div>

        {/* Total Submitted */}
        <div className="col-12 col-md-8 col-xl-3">
          <div
            className="card shadow-sm border-0 p-3 h-100 cursor-pointer hover-shadow transition"
            onClick={() => onNavigateToTickets && onNavigateToTickets()}
            data-testid="metric-total"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer", borderTop: "4px solid #6c757d" }}
          >
            <div className="text-muted small fw-medium mb-1">Total Submitted</div>
            <div className="h3 fw-bold text-secondary mb-0" data-testid="count-total">
              {metrics.totalSubmitted}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets Section (UI-10) */}
      <div className="card shadow-sm border-0 bg-white p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 fw-bold text-dark mb-0">Recent Tickets</h2>
          {onNavigateToTickets && (
            <button
              type="button"
              className="btn btn-sm btn-link text-success p-0 text-decoration-none fw-medium"
              onClick={() => onNavigateToTickets()}
            >
              View all tickets →
            </button>
          )}
        </div>

        {(!recentTickets || recentTickets.length === 0) ? (
          <div className="text-center py-4 text-muted small" data-testid="empty-recent-tickets">
            You haven't submitted any tickets yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" data-testid="recent-tickets-table">
              <thead className="table-light small text-muted">
                <tr>
                  <th>Ticket #</th>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions Taken</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket && onSelectTicket(t.id)}
                    style={{ cursor: onSelectTicket ? "pointer" : "default" }}
                    data-testid={`recent-ticket-row-${t.id}`}
                  >
                    <td className="fw-semibold text-dark">{t.ticketNumber}</td>
                    <td className="text-truncate" style={{ maxWidth: "260px" }}>
                      {t.summary}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {t.category?.name || "General"}
                      </span>
                    </td>
                    <td>{getPriorityBadge(t.requestedPriority)}</td>
                    <td>{getStatusBadge(t.currentStatus)}</td>
                    <td>
                      {t.actionCount > 0 ? (
                        <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">
                          {t.actionCount} action{t.actionCount > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-muted small">None</span>
                      )}
                    </td>
                    <td className="text-muted small">
                      {new Date(t.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
