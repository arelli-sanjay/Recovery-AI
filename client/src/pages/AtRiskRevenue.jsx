import { useEffect, useState } from "react";
import {
  AlertTriangle,
  IndianRupee,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AtRiskRevenue() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //LOAD CASES
  useEffect(() => {
    const loadCases = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/recovery/cases"
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error("Failed to load recovery cases");
        }

        setCases(result.data);
      } catch (err) {
        console.error("At-risk revenue error:", err);
        setError("Failed to load at-risk revenue");
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, []);

  const atRiskCases = cases.filter(
    (item) => item.status !== "recovered"
  );

  const totalRisk = atRiskCases.reduce(
    (sum, item) => sum + (item.revenueAtRisk || 0),
    0
  );

  const highRisk = atRiskCases.filter(
    (item) => item.riskLevel === "HIGH"
  ).length;

  const mediumRisk = atRiskCases.filter(
    (item) => item.riskLevel === "MEDIUM"
  ).length;

  const lowRisk = atRiskCases.filter(
    (item) => item.riskLevel === "LOW"
  ).length;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar />

        <section className="dashboard-content">
          //HEADER
          <div className="page-header">
            <div>
              <h1>At-Risk Revenue</h1>

              <p>
                Identify revenue that is at risk and prioritize
                recovery opportunities.
              </p>
            </div>

            <div className="risk-live">
              <span></span>
              Live Monitoring
            </div>
          </div>

          //KPI CARDS
          <div className="stats-grid">
            <RiskStat
              title="Revenue at Risk"
              value={`₹${totalRisk.toLocaleString("en-IN")}`}
              description="Currently recoverable"
              icon={IndianRupee}
              type="purple"
            />

            <RiskStat
              title="High Risk Cases"
              value={highRisk}
              description="Immediate attention"
              icon={ShieldAlert}
              type="red"
            />

            <RiskStat
              title="Medium Risk Cases"
              value={mediumRisk}
              description="Recovery recommended"
              icon={AlertTriangle}
              type="orange"
            />

            <RiskStat
              title="Low Risk Cases"
              value={lowRisk}
              description="Monitor automatically"
              icon={TrendingUp}
              type="green"
            />
          </div>

          //CASE TABLE
          <div className="panel risk-table-panel">
            <div className="panel-header">
              <div>
                <h2>Revenue at Risk</h2>

                <span>
                  Transactions requiring recovery attention
                </span>
              </div>

              <span className="case-count">
                {atRiskCases.length} cases
              </span>
            </div>

            {loading && (
              <div className="empty-state">
                Loading recovery cases...
              </div>
            )}

            {error && (
              <div className="empty-state error-state">
                {error}
              </div>
            )}

            {!loading && !error && atRiskCases.length === 0 && (
              <div className="empty-state">
                No revenue currently at risk.
              </div>
            )}

            {!loading && !error && atRiskCases.length > 0 && (
              <div className="risk-table">
                <div className="risk-table-head">
                  <span>Customer</span>
                  <span>Amount at Risk</span>
                  <span>Risk</span>
                  <span>Root Cause</span>
                  <span>Status</span>
                </div>

                {atRiskCases.map((item) => (
                  <div
                    className="risk-table-row"
                    key={item._id}
                  >
                    <div className="customer-cell">
                      <strong>
                        {item.customerId?.name || "Unknown"}
                      </strong>

                      <small>
                        {item.customerId?.email || "—"}
                      </small>
                    </div>

                    <strong className="amount-cell">
                      ₹
                      {(item.revenueAtRisk || 0)
                        .toLocaleString("en-IN")}
                    </strong>

                    <span
                      className={`risk-badge ${item.riskLevel?.toLowerCase()}`}
                    >
                      {item.riskLevel}
                    </span>

                    <span className="root-cause">
                      {item.rootCause ||
                        item.transactionId?.failureReason ||
                        "Payment issue"}
                    </span>

                    <span
                      className={`case-status ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

//RISK STAT
function RiskStat({
  title,
  value,
  description,
  icon: Icon,
  type,
}) {
  return (
    <div className={`risk-stat ${type}`}>
      <div className="risk-stat-icon">
        <Icon size={20} />
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}

//STATUS HELPERS
function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(status) {
  switch (status) {
    case "recovered":
      return "success";

    case "recovering":
      return "blue-status";

    case "awaiting_approval":
      return "warning";

    case "failed":
    case "escalated":
      return "danger";

    default:
      return "blue-status";
  }
}