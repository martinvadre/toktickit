import React, { useState } from "react";
import { checkSystem, Category } from "./api";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"Idle" | "Online" | "Offline">("Idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCheckSystem = async () => {
    setLoading(true);
    setErrorMsg(null);
    const result = await checkSystem();
    setLoading(false);
    setStatus(result.status);
    if (result.status === "Online") {
      setCategories(result.categories);
    } else {
      setCategories([]);
      setErrorMsg(result.error || "Unable to connect to TokTickIT API");
    }
  };

  return (
    <div className="container py-5">
      <div className="card shadow-sm max-w-lg mx-auto p-4">
        <h1 className="h3 mb-4 text-dark font-weight-bold">
          TokTickIT <span className="text-success small fs-5">IT Service Desk</span>
        </h1>

        <div className="mb-4">
          <button
            className="btn btn-success px-4 font-weight-medium"
            onClick={handleCheckSystem}
            disabled={loading}
          >
            {loading ? "Checking System..." : "Check System"}
          </button>
        </div>

        {loading && (
          <div className="alert alert-info py-2" role="status">
            Loading system status and request categories...
          </div>
        )}

        {!loading && status !== "Idle" && (
          <div className="mt-3">
            <div className="mb-3 fs-5">
              <strong>System Status:</strong>{" "}
              <span className={status === "Online" ? "text-success fw-bold" : "text-danger fw-bold"}>
                {status}
              </span>
            </div>

            {status === "Online" && (
              <div>
                <h2 className="h5 text-secondary mb-2">Supported Request Categories</h2>
                <ol className="list-group list-group-numbered">
                  {categories.map((cat) => (
                    <li key={cat.id} className="list-group-item">
                      {cat.name}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {status === "Offline" && (
              <div className="alert alert-danger" role="alert">
                {errorMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
