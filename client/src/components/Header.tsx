import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRequester } from "../context/RequesterContext";

interface HeaderProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = "my-tickets",
  onSelectTab,
}) => {
  const { user, logout } = useAuth();
  const { currentRequester, clearRequester } = useRequester();

  const activeUser = user || (currentRequester ? {
    name: currentRequester.name,
    email: currentRequester.email,
    role: "REQUESTER" as const,
  } : null);

  const isStaffOrAdmin = activeUser?.role === "STAFF" || activeUser?.role === "ADMIN";
  const isAdmin = activeUser?.role === "ADMIN";

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span
            className="badge rounded-pill ms-2 px-2 py-1 small fw-semibold"
            style={{
              backgroundColor: "#FFF5F5",
              color: "#C53030",
              border: "1px solid #FEB2B2",
            }}
          >
            Administrator
          </span>
        );
      case "STAFF":
        return (
          <span
            className="badge rounded-pill ms-2 px-2 py-1 small fw-semibold"
            style={{
              backgroundColor: "#E6F4EA",
              color: "#006B3C",
              border: "1px solid #A3E0BF",
            }}
          >
            IT Staff
          </span>
        );
      case "REQUESTER":
      default:
        return (
          <span
            className="badge rounded-pill ms-2 px-2 py-1 small fw-semibold"
            style={{
              backgroundColor: "#EBF8FF",
              color: "#2B6CB0",
              border: "1px solid #BEE3F8",
            }}
          >
            Requester
          </span>
        );
    }
  };

  return (
    <header className="zen-header py-2 px-3 px-md-4 shadow-sm">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between">
        {/* Brand Logo & Role-Aware Navigation */}
        <div className="d-flex align-items-center">
          <div className="d-flex align-items-center me-4">
            <span className="fs-4 me-2">🕒</span>
            <span className="h4 fw-bold mb-0 text-white tracking-wide">
              TokTickIT
            </span>
          </div>

          <nav className="nav d-none d-sm-flex gap-1">
            {/* IT Staff & Admin: Staff Queue */}
            {isStaffOrAdmin && (
              <button
                type="button"
                className={`nav-link btn btn-link text-decoration-none ${
                  activeTab === "staff-queue"
                    ? "active text-white fw-bold bg-white bg-opacity-20 rounded"
                    : "text-white-50"
                }`}
                onClick={() => onSelectTab && onSelectTab("staff-queue")}
              >
                📥 IT Staff Queue
              </button>
            )}

            {/* Admin Only: User Management */}
            {isAdmin && (
              <button
                type="button"
                className={`nav-link btn btn-link text-decoration-none ${
                  activeTab === "admin-users"
                    ? "active text-white fw-bold bg-white bg-opacity-20 rounded"
                    : "text-white-50"
                }`}
                onClick={() => onSelectTab && onSelectTab("admin-users")}
              >
                👥 User Management
              </button>
            )}

            {/* Requesters, Staff & Admin: My Tickets */}
            <button
              type="button"
              className={`nav-link btn btn-link text-decoration-none ${
                activeTab === "my-tickets"
                  ? "active text-white fw-bold bg-white bg-opacity-20 rounded"
                  : "text-white-50"
              }`}
              onClick={() => onSelectTab && onSelectTab("my-tickets")}
            >
              📋 My Tickets
            </button>

            {/* Create Ticket */}
            <button
              type="button"
              className={`nav-link btn btn-link text-decoration-none ${
                activeTab === "create-ticket"
                  ? "active text-white fw-bold bg-white bg-opacity-20 rounded"
                  : "text-white-50"
              }`}
              onClick={() => onSelectTab && onSelectTab("create-ticket")}
            >
              ➕ Create Ticket
            </button>
          </nav>
        </div>

        {/* Active User Identity & Actions */}
        {activeUser && (
          <div className="d-flex align-items-center mt-2 mt-sm-0 gap-2">
            <div className="d-flex align-items-center bg-white bg-opacity-10 rounded-pill px-3 py-1 text-white">
              <span className="me-2 small">👤</span>
              <span className="small fw-bold">{activeUser.name}</span>
              {renderRoleBadge(activeUser.role)}
            </div>

            {user ? (
              <button
                type="button"
                className="btn btn-sm btn-outline-light rounded-pill px-3"
                onClick={logout}
                title="Sign out of TokTickIT"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-outline-light rounded-pill px-3"
                onClick={clearRequester}
                title="Change active development requester"
              >
                Change Requester
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
