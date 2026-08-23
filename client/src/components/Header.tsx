import React from "react";
import { useRequester } from "../context/RequesterContext";

interface HeaderProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab = "my-tickets", onSelectTab }) => {
  const { currentRequester, clearRequester } = useRequester();

  return (
    <header className="zen-header py-2 px-3 px-md-4 shadow-sm">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between">
        {/* Brand Logo & Navigation */}
        <div className="d-flex align-items-center">
          <div className="d-flex align-items-center me-4">
            <span className="fs-4 me-2">🕒</span>
            <span className="h4 fw-bold mb-0 text-white tracking-wide">TokTickIT</span>
          </div>

          <nav className="nav d-none d-sm-flex">
            <button
              type="button"
              className={`nav-link btn btn-link text-decoration-none ${
                activeTab === "my-tickets" ? "active text-white fw-bold" : "text-white-50"
              }`}
              onClick={() => onSelectTab && onSelectTab("my-tickets")}
            >
              📋 My Tickets
            </button>
            <button
              type="button"
              className={`nav-link btn btn-link text-decoration-none ${
                activeTab === "create-ticket" ? "active text-white fw-bold" : "text-white-50"
              }`}
              onClick={() => onSelectTab && onSelectTab("create-ticket")}
            >
              ➕ Create Ticket
            </button>
          </nav>
        </div>

        {/* Requester Identity & Action */}
        {currentRequester && (
          <div className="d-flex align-items-center mt-2 mt-sm-0">
            <div className="d-flex align-items-center bg-white bg-opacity-10 rounded-pill px-3 py-1 me-2 text-white">
              <span className="me-2 small">👤</span>
              <span className="small fw-medium me-1">Logged in as:</span>
              <span className="small fw-bold">{currentRequester.name}</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-light rounded-pill px-3"
              onClick={clearRequester}
              title="Change the active development requester"
            >
              Change Requester
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
