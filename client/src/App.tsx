import React, { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext";
import { RequesterSelect } from "./components/RequesterSelect";
import { Header } from "./components/Header";
import { checkSystem, Category } from "./api";
import "./styles/theme.css";

function AppContent() {
  const { currentRequester } = useRequester();
  const [activeTab, setActiveTab] = useState("my-tickets");

  // System check state for diagnostic / Lab 1 compatibility
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [checkStatus, setCheckStatus] = useState<"Idle" | "Online" | "Offline">("Idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCheckSystem = async () => {
    setLoadingCheck(true);
    setErrorMsg(null);
    const result = await checkSystem();
    setLoadingCheck(false);
    setCheckStatus(result.status);
    if (result.status === "Online") {
      setCategories(result.categories);
    } else {
      setCategories([]);
      setErrorMsg(result.error || "Unable to connect to TokTickIT API");
    }
  };

  if (!currentRequester) {
    return (
      <div>
        <RequesterSelect />
        <div className="container pb-5">
          <div className="card shadow-sm p-4 mx-auto" style={{ maxWidth: "600px" }}>
            <h2 className="h6 text-muted mb-3">System Diagnostics</h2>
            <div className="mb-3">
              <button
                className="btn btn-outline-success font-weight-medium"
                onClick={handleCheckSystem}
                disabled={loadingCheck}
              >
                {loadingCheck ? "Checking System..." : "Check System"}
              </button>
            </div>

            {loadingCheck && (
              <div className="alert alert-info py-2" role="status">
                Loading system status and request categories...
              </div>
            )}

            {!loadingCheck && checkStatus !== "Idle" && (
              <div className="mt-2">
                <div className="mb-2 fs-6">
                  <strong>System Status:</strong>{" "}
                  <span className={checkStatus === "Online" ? "text-success fw-bold" : "text-danger fw-bold"}>
                    {checkStatus}
                  </span>
                </div>

                {checkStatus === "Online" && (
                  <div>
                    <h3 className="h6 text-secondary mb-2">Supported Request Categories</h3>
                    <ol className="list-group list-group-numbered">
                      {categories.map((cat) => (
                        <li key={cat.id} className="list-group-item py-1">
                          {cat.name}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {checkStatus === "Offline" && (
                  <div className="alert alert-danger" role="alert">
                    {errorMsg}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />
      <main className="container py-4 flex-grow-1">
        <div className="zen-card p-4 text-center py-5">
          <h2 className="h4 fw-bold mb-2">Welcome, {currentRequester.name}!</h2>
          <p className="text-muted mb-4">
            Development Requester context is active ({currentRequester.email} &bull;{" "}
            {currentRequester.department || "General Requester"}).
          </p>
          <div className="alert alert-success d-inline-block px-4 py-2" role="status">
            Active Testing Context ID: <strong>{currentRequester.id}</strong>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <AppContent />
    </RequesterProvider>
  );
}
