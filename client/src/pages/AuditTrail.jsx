import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const API_BASE_URL = "http://localhost:5000/api";

const eventConfig = {
  CASE_DETECTED: {
    label: "Case Detected",
    icon: "⚠",
    className: "audit-warning",
  },
  AI_ANALYZED: {
    label: "AI Analyzed",
    icon: "✦",
    className: "audit-ai",
  },
  POLICY_ALLOWED: {
    label: "Policy Allowed",
    icon: "✓",
    className: "audit-success",
  },
  POLICY_ESCALATED: {
    label: "Policy Escalated",
    icon: "↗",
    className: "audit-warning",
  },
  POLICY_STOPPED: {
    label: "Policy Stopped",
    icon: "■",
    className: "audit-danger",
  },
  PAYMENT_LINK_CREATED: {
    label: "Payment Link Created",
    icon: "↗",
    className: "audit-action",
  },
  PAYMENT_SUCCESS: {
    label: "Payment Recovered",
    icon: "✓",
    className: "audit-success",
  },
  PAYMENT_FAILED: {
    label: "Payment Failed",
    icon: "×",
    className: "audit-danger",
  },
};

//DATE FORMAT
const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

//AMOUNT FORMAT
const formatAmount = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};

//METADATA KEY FORMAT
const formatMetadataKey = (key) => {
  if (!key) return "—";

  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bId\b/g, "ID")
    .replace(/\bUrl\b/g, "URL")
    .replace(/\bApi\b/g, "API")
    .trim();
};

//METADATA VALUE FORMAT
const formatMetadataValue = (value) => {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

export default function AuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState(null);

  //FETCH AUDIT LOGS
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/audit`);

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const result = await response.json();

      setLogs(result.data || []);
    } catch (err) {
      console.error("Audit trail error:", err);
      setError("Unable to load audit trail.");
    } finally {
      setLoading(false);
    }
  };

  //INITIAL LOAD
  useEffect(() => {
    fetchAuditLogs();
  }, []);

  //FILTER LOGS
  const filteredLogs = logs.filter((log) => {
    const matchesEvent =
      eventFilter === "ALL" || log.event === eventFilter;

    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      log.event?.toLowerCase().includes(searchText) ||
      log.description?.toLowerCase().includes(searchText) ||
      log.recoveryCaseId?._id?.toLowerCase().includes(searchText);

    return matchesEvent && matchesSearch;
  });

  //KPI CALCULATIONS
  const totalEvents = logs.length;

  const successfulRecoveries = logs.filter(
    (log) => log.event === "PAYMENT_SUCCESS"
  ).length;

  const linksCreated = logs.filter(
    (log) => log.event === "PAYMENT_LINK_CREATED"
  ).length;

  const totalRecovered = logs
    .filter((log) => log.event === "PAYMENT_SUCCESS")
    .reduce(
      (sum, log) => sum + Number(log.amount || 0),
      0
    );

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <main className="audit-page">
          {/* HEADER */}
          <div className="audit-header">
            <div>
              <div className="page-eyebrow">
                GOVERNANCE & OBSERVABILITY
              </div>

              <h1>Audit Trail</h1>

              <p>
                Complete history of AI decisions, policy actions and
                revenue recovery events.
              </p>
            </div>

            <button
              className="audit-refresh-btn"
              onClick={fetchAuditLogs}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>

          {/* KPI CARDS */}
          <section className="audit-stats">
            <div className="audit-stat-card">
              <div className="audit-stat-label">Total Events</div>

              <div className="audit-stat-value">
                {totalEvents}
              </div>

              <div className="audit-stat-sub">
                Recorded system events
              </div>
            </div>

            <div className="audit-stat-card">
              <div className="audit-stat-label">
                Payment Links
              </div>

              <div className="audit-stat-value">
                {linksCreated}
              </div>

              <div className="audit-stat-sub">
                Recovery actions executed
              </div>
            </div>

            <div className="audit-stat-card">
              <div className="audit-stat-label">
                Successful Recoveries
              </div>

              <div className="audit-stat-value audit-value-success">
                {successfulRecoveries}
              </div>

              <div className="audit-stat-sub">
                Payments successfully recovered
              </div>
            </div>

            <div className="audit-stat-card">
              <div className="audit-stat-label">
                Revenue Recovered
              </div>

              <div className="audit-stat-value audit-value-success">
                {formatAmount(totalRecovered)}
              </div>

              <div className="audit-stat-sub">
                Confirmed through Razorpay
              </div>
            </div>
          </section>

          {/* FILTER TOOLBAR */}
          <section className="audit-toolbar">
            <div className="audit-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder="Search events, descriptions or case ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="audit-filter"
            >
              <option value="ALL">All Events</option>
              <option value="CASE_DETECTED">Case Detected</option>
              <option value="AI_ANALYZED">AI Analyzed</option>
              <option value="POLICY_ALLOWED">Policy Allowed</option>
              <option value="POLICY_ESCALATED">
                Policy Escalated
              </option>
              <option value="POLICY_STOPPED">Policy Stopped</option>
              <option value="PAYMENT_LINK_CREATED">
                Payment Link Created
              </option>
              <option value="PAYMENT_SUCCESS">
                Payment Recovered
              </option>
              <option value="PAYMENT_FAILED">
                Payment Failed
              </option>
            </select>
          </section>

          {/* AUDIT TABLE */}
          <section className="audit-card">
            <div className="audit-card-header">
              <div>
                <h2>System Event History</h2>

                <span>
                  {filteredLogs.length} event
                  {filteredLogs.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="audit-live">
                <span className="audit-live-dot"></span>
                Live Data
              </div>
            </div>

            {/* LOADING */}
            {loading ? (
              <div className="audit-empty">
                <div className="audit-loader"></div>

                <p>Loading audit events...</p>
              </div>
            ) : error ? (
              /* ERROR */
              <div className="audit-empty">
                <div className="audit-empty-icon">!</div>

                <h3>Unable to load audit trail</h3>

                <p>{error}</p>

                <button
                  className="audit-retry-btn"
                  onClick={fetchAuditLogs}
                >
                  Retry
                </button>
              </div>
            ) : filteredLogs.length === 0 ? (
              /* EMPTY */
              <div className="audit-empty">
                <div className="audit-empty-icon">⌕</div>

                <h3>No audit events found</h3>

                <p>
                  Try changing your search or event filter.
                </p>
              </div>
            ) : (
              /* TABLE */
              <div className="audit-table-wrapper">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>EVENT</th>
                      <th>DESCRIPTION</th>
                      <th>AMOUNT</th>
                      <th>CASE</th>
                      <th>STATUS</th>
                      <th>TIMESTAMP</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLogs.map((log) => {
                      const config = eventConfig[log.event] || {
                        label: log.event,
                        icon: "•",
                        className: "",
                      };

                      return (
                        <tr key={log._id}>
                          {/* EVENT */}
                          <td>
                            <div className="audit-event">
                              <div
                                className={`audit-event-icon ${config.className}`}
                              >
                                {config.icon}
                              </div>

                              <span>{config.label}</span>
                            </div>
                          </td>

                          {/* DESCRIPTION */}
                          <td>
                            <div className="audit-description">
                              {log.description}
                            </div>
                          </td>

                          {/* AMOUNT */}
                          <td>
                            <strong>
                              {log.amount
                                ? formatAmount(log.amount)
                                : "—"}
                            </strong>
                          </td>

                          {/* CASE */}
                          <td>
                            <span className="audit-case-id">
                              {log.recoveryCaseId?._id
                                ? `#${log.recoveryCaseId._id.slice(-6)}`
                                : "—"}
                            </span>
                          </td>

                          {/* STATUS */}
                          <td>
                            <span
                              className={`audit-status ${String(
                                log.recoveryCaseId?.status || ""
                              ).replace("_", "-")}`}
                            >
                              {log.recoveryCaseId?.status || "—"}
                            </span>
                          </td>

                          {/* TIMESTAMP */}
                          <td>
                            <span className="audit-time">
                              {formatDate(log.createdAt)}
                            </span>
                          </td>

                          {/* VIEW */}
                          <td>
                            <button
                              className="audit-view-btn"
                              onClick={() => setSelectedLog(log)}
                            >
                              →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* DETAILS DRAWER */}
      {selectedLog && (
        <div
          className="audit-drawer-overlay"
          onClick={() => setSelectedLog(null)}
        >
          <aside
            className="audit-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* DRAWER HEADER */}
            <div className="audit-drawer-header">
              <div>
                <div className="page-eyebrow">
                  EVENT DETAILS
                </div>

                <h2>
                  {eventConfig[selectedLog.event]?.label ||
                    selectedLog.event}
                </h2>
              </div>

              <button
                className="audit-close-btn"
                onClick={() => setSelectedLog(null)}
              >
                ×
              </button>
            </div>

            {/* DESCRIPTION */}
            <div className="audit-detail-section">
              <span className="audit-detail-label">
                Description
              </span>

              <p>{selectedLog.description}</p>
            </div>

            {/* EVENT INFORMATION */}
            <div className="audit-detail-grid">
              <div>
                <span className="audit-detail-label">
                  Event
                </span>

                <strong>{selectedLog.event}</strong>
              </div>

              <div>
                <span className="audit-detail-label">
                  Amount
                </span>

                <strong>
                  {formatAmount(selectedLog.amount)}
                </strong>
              </div>

              <div>
                <span className="audit-detail-label">
                  Case ID
                </span>

                <strong>
                  {selectedLog.recoveryCaseId?._id || "—"}
                </strong>
              </div>

              <div>
                <span className="audit-detail-label">
                  Case Status
                </span>

                <strong>
                  {selectedLog.recoveryCaseId?.status || "—"}
                </strong>
              </div>

              <div>
                <span className="audit-detail-label">
                  Risk Level
                </span>

                <strong>
                  {selectedLog.recoveryCaseId?.riskLevel || "—"}
                </strong>
              </div>

              <div>
                <span className="audit-detail-label">
                  Risk Score
                </span>

                <strong>
                  {selectedLog.recoveryCaseId?.riskScore ?? "—"}
                </strong>
              </div>
            </div>

            {/* TIMESTAMP */}
            <div className="audit-detail-section">
              <span className="audit-detail-label">
                Timestamp
              </span>

              <p>{formatDate(selectedLog.createdAt)}</p>
            </div>

            {/* METADATA */}
            {selectedLog.metadata &&
              Object.keys(selectedLog.metadata).length > 0 && (
                <div className="audit-detail-section">
                  <span className="audit-detail-label">
                    Metadata
                  </span>

                  <div className="audit-metadata-card">
                    {Object.entries(selectedLog.metadata).map(
                      ([key, value]) => (
                        <div
                          className="audit-metadata-row"
                          key={key}
                        >
                          <span className="audit-metadata-key">
                            {formatMetadataKey(key)}
                          </span>

                          <span className="audit-metadata-value">
                            {formatMetadataValue(value)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </aside>
        </div>
      )}
    </div>
  );
}
