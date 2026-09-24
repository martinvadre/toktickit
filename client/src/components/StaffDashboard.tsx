import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  StaffDashboardData,
  AdminDashboardData,
  fetchStaffDashboard,
  fetchAdminDashboard,
} from "../api";

interface StaffDashboardProps {
  onNavigateToQueue?: (filterKey?: string, filterVal?: string) => void;
  onSelectTicket?: (ticketId: number) => void;
  onNavigateToUsers?: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onNavigateToQueue,
  onSelectTicket,
  onNavigateToUsers,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [staffData, setStaffData] = useState<StaffDashboardData | null>(null);
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const data = await fetchAdminDashboard();
        setAdminData(data);
        setStaffData({
          metrics: data.staffMetrics,
          urgentTickets: data.urgentTickets,
          recentTickets: data.recentTickets,
        });
      } else {
        const data = await fetchStaffDashboard();
        setStaffData(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load operational dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <span className="badge bg-info-subtle text-info-emphasis border">New</span>;
      case "OPEN":
        return <span className="badge bg-primary-subtle text-primary-emphasis border">Open</span>;
      case "ASSIGNED":
        return <span className="badge bg-primary-subtle text-primary-emphasis border">Assigned</span>;
      case "IN_PROGRESS":
        return <span className="badge bg-warning-subtle text-warning-emphasis border">In Progress</span>;
      case "WAITING_FOR_REQUESTER":
      case "PENDING_REQUESTER":
        return <span className="badge bg-purple-subtle text-purple border" style={{ backgroundColor: "#f3e8ff", color: "#6b21a8" }}>Waiting</span>;
      case "RESOLVED":
        return <span className="badge bg-success text-white">Resolved</span>;
      case "CLOSED":
        return <span className="badge bg-secondary text-white">Closed</span>;
      case "CANCELLED":
        return <span className="badge bg-danger-subtle text-danger border">Cancelled</span>;
      default:
        return <span className="badge bg-light text-dark border">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center" data-testid="dashboard-loading">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading IT Staff dashboard...</span>
        </div>
        <p className="text-muted mt-2 small">Aggregating real-time queue metrics...</p>
      </div>
    );
  }

  if (error || !staffData) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger shadow-sm p-4 text-center mx-auto" style={{ maxWidth: "600px" }} role="alert">
          <h2 className="h5 fw-bold mb-2">Error Loading Operational Dashboard</h2>
          <p className="mb-3 text-muted">{error || "Failed to load dashboard data."}</p>
          <button className="btn btn-sm btn-outline-danger" onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { metrics, urgentTickets, recentTickets } = staffData;

  return (
    <div className="container-fluid px-3 px-md-4 py-4" data-testid="staff-dashboard">
      {/* Top Banner */}
      <div className="card shadow-sm border-0 bg-white p-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h1 className="h4 fw-bold text-dark mb-0">
                {isAdmin ? "Administrator Operations Hub" : "IT Staff Operational Dashboard"}
              </h1>
              <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">
                Live Queue
              </span>
            </div>
            <p className="text-muted small mb-0">
              Welcome back, <strong>{user?.name}</strong>. Here is the operational overview of service requests.
            </p>
          </div>
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={loadData}
              data-testid="refresh-dashboard-btn"
            >
              <span>🔄</span> Refresh
            </button>
            {onNavigateToQueue && (
              <button
                type="button"
                className="btn btn-success btn-sm d-flex align-items-center gap-1 shadow-sm"
                onClick={() => onNavigateToQueue()}
                data-testid="view-full-queue-btn"
              >
                View Full Queue →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Operational KPI Cards (UI-11, UI-12) */}
      <div className="row g-3 mb-4">
        {/* Unassigned Tickets */}
        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card shadow-sm border-0 p-3 h-100 cursor-pointer hover-shadow transition"
            onClick={() => onNavigateToQueue && onNavigateToQueue("assignedStaffId", "unassigned")}
            data-testid="metric-unassigned"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer", borderTop: "4px solid #fd7e14" }}
          >
            <div className="text-muted small fw-medium mb-1">Unassigned</div>
            <div className="h3 fw-bold text-warning mb-0" data-testid="count-unassigned">
              {metrics.unassignedTickets}
            </div>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>Needs triage</div>
          </div>
        </div>

        {/* My Assigned Tickets */}
        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card shadow-sm border-0 p-3 h-100 cursor-pointer hover-shadow transition"
            onClick={() => onNavigateToQueue && onNavigateToQueue("assignedStaffId", String(user?.id))}
            data-testid="metric-my-assigned"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer", borderTop: "4px solid #20c997" }}
          >
            <div className="text-muted small fw-medium mb-1">My Assigned</div>
            <div className="h3 fw-bold text-teal mb-0" data-testid="count-my-assigned" style={{ color: "#0f766e" }}>
              {metrics.myAssignedTickets}
            </div>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>Active on you</div>
          </div>
        </div>

        {/* In Progress */}
        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card shadow-sm border-0 p-3 h-100 cursor-pointer hover-shadow transition"
            onClick={() => onNavigateToQueue && onNavigateToQueue("status", "IN_PROGRESS")}
            data-testid="metric-in-progress"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer", borderTop: "4px solid #006B3C" }}
          >
            <div className="text-muted small fw-medium mb-1">In Progress</div>
            <div className="h3 fw-bold text-success mb-0" data-testid="count-in-progress">
              {metrics.inProgressTickets}
            </div>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>Active work</div>
          </div>
        </div>

        {/* Waiting for Requester */}
        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card shadow-sm border-0 p-3 h-100 cursor-pointer hover-shadow transition"
            onClick={() => onNavigateToQueue && onNavigateToQueue("status", "WAITING_FOR_REQUESTER")}
            data-testid="metric-waiting"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer", borderTop: "4px solid #6f42c1" }}
          >
            <div className="text-muted small fw-medium mb-1">Waiting on Req</div>
            <div className="h3 fw-bold text-purple mb-0" data-testid="count-waiting" style={{ color: "#6f42c1" }}>
              {metrics.waitingForRequesterTickets}
            </div>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>Pending user</div>
          </div>
        </div>

        {/* High / Urgent */}
        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card shadow-sm border-0 p-3 h-100 cursor-pointer hover-shadow transition"
            onClick={() => onNavigateToQueue && onNavigateToQueue("itPriority", "URGENT")}
            data-testid="metric-high-urgent"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer", borderTop: "4px solid #dc3545" }}
          >
            <div className="text-muted small fw-medium mb-1">High / Urgent</div>
            <div className="h3 fw-bold text-danger mb-0" data-testid="count-high-urgent">
              {metrics.highOrUrgentTickets}
            </div>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>Escalations</div>
          </div>
        </div>

        {/* Total Active */}
        <div className="col-6 col-md-4 col-xl-2">
          <div
            className="card shadow-sm border-0 p-3 h-100 cursor-pointer hover-shadow transition"
            onClick={() => onNavigateToQueue && onNavigateToQueue()}
            data-testid="metric-total-active"
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer", borderTop: "4px solid #0d6efd" }}
          >
            <div className="text-muted small fw-medium mb-1">Total Active</div>
            <div className="h3 fw-bold text-primary mb-0" data-testid="count-total-active">
              {metrics.totalActiveTickets}
            </div>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>Open workload</div>
          </div>
        </div>
      </div>

      {/* Admin User Management Summary Extension (UI-13 / AC-13) */}
      {isAdmin && adminData?.userSummary && (
        <div className="card shadow-sm border-0 bg-white p-4 mb-4" data-testid="admin-user-summary-card">
          <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <div>
              <h2 className="h5 fw-bold text-dark mb-0">System User Accounts Summary</h2>
              <span className="text-muted small">Global identity breakdown across all roles</span>
            </div>
            {onNavigateToUsers && (
              <button
                type="button"
                className="btn btn-sm btn-outline-success"
                onClick={onNavigateToUsers}
                data-testid="admin-manage-users-btn"
              >
                Manage Users →
              </button>
            )}
          </div>
          <div className="row g-3 text-center">
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded">
                <div className="text-muted small mb-1">Total Users</div>
                <div className="h4 fw-bold text-dark mb-0" data-testid="admin-total-users">
                  {adminData.userSummary.totalUsers}
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded">
                <div className="text-muted small mb-1">Active IT Staff</div>
                <div className="h4 fw-bold text-success mb-0" data-testid="admin-active-staff">
                  {adminData.userSummary.activeStaff}
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded">
                <div className="text-muted small mb-1">Active Admins</div>
                <div className="h4 fw-bold text-primary mb-0" data-testid="admin-active-admins">
                  {adminData.userSummary.activeAdmins}
                </div>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-light rounded">
                <div className="text-muted small mb-1">Active Requesters</div>
                <div className="h4 fw-bold text-info mb-0" data-testid="admin-active-requesters">
                  {adminData.userSummary.activeRequesters}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Urgent Tickets Queue */}
      <div className="card shadow-sm border-0 bg-white p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="h5 fw-bold text-dark mb-0">Urgent & High Priority Incidents</h2>
            <span className="text-muted small">Immediate attention required</span>
          </div>
          {onNavigateToQueue && (
            <button
              type="button"
              className="btn btn-sm btn-link text-danger p-0 text-decoration-none fw-medium"
              onClick={() => onNavigateToQueue("itPriority", "URGENT")}
            >
              Filter urgent in queue →
            </button>
          )}
        </div>

        {(!urgentTickets || urgentTickets.length === 0) ? (
          <div className="text-center py-4 text-muted small" data-testid="empty-urgent-tickets">
            No urgent or high priority tickets at this time. All clear! 🎉
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" data-testid="urgent-tickets-table">
              <thead className="table-light small text-muted">
                <tr>
                  <th>Ticket #</th>
                  <th>Summary</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Requester</th>
                  <th>Assigned Staff</th>
                  <th>Actions</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {urgentTickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => onSelectTicket && onSelectTicket(t.id)}
                    style={{ cursor: onSelectTicket ? "pointer" : "default" }}
                    data-testid={`urgent-ticket-row-${t.id}`}
                  >
                    <td className="fw-semibold text-dark">{t.ticketNumber}</td>
                    <td className="text-truncate" style={{ maxWidth: "260px" }}>
                      {t.summary}
                    </td>
                    <td>{getPriorityBadge(t.itPriority || t.requestedPriority)}</td>
                    <td>{getStatusBadge(t.currentStatus)}</td>
                    <td className="small">{t.requester?.name || "Unknown"}</td>
                    <td className="small">
                      {t.assignedStaff ? (
                        <span className="badge bg-light text-dark border">
                          {t.assignedStaff.name}
                        </span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      {t.actionCount && t.actionCount > 0 ? (
                        <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">
                          {t.actionCount}
                        </span>
                      ) : (
                        <span className="text-muted small">0</span>
                      )}
                    </td>
                    <td className="text-muted small">
                      {new Date(t.createdAt).toLocaleDateString("en-US", {
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

      {/* Recent Activity Queue */}
      <div className="card shadow-sm border-0 bg-white p-4">
        <h2 className="h5 fw-bold text-dark mb-3">Recently Updated Tickets</h2>
        {(!recentTickets || recentTickets.length === 0) ? (
          <div className="text-center py-4 text-muted small" data-testid="empty-recent-tickets">
            No recently updated tickets.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" data-testid="recent-tickets-table">
              <thead className="table-light small text-muted">
                <tr>
                  <th>Ticket #</th>
                  <th>Summary</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Staff</th>
                  <th>Last Updated</th>
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
                    <td className="text-truncate" style={{ maxWidth: "280px" }}>
                      {t.summary}
                    </td>
                    <td>{getPriorityBadge(t.itPriority || t.requestedPriority)}</td>
                    <td>{getStatusBadge(t.currentStatus)}</td>
                    <td className="small">
                      {t.assignedStaff?.name || <span className="text-muted">Unassigned</span>}
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
