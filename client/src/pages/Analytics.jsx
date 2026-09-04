import { useEffect, useMemo, useState } from "react";

import {
  TrendingUp,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Activity,
  RefreshCw,
  Target,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const API_BASE_URL = "http://localhost:5000/api";

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //LOAD ANALYTICS
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/dashboard/summary`
      );

      if (!response.ok) {
        throw new Error("Failed to load analytics");
      }

      const result = await response.json();

      if (result.success) {
        setAnalytics(result.data);
      } else {
        setError("Failed to load analytics data");
      }
    } catch (err) {
      console.error("Analytics loading error:", err);
      setError("Unable to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  //INITIAL LOAD
  useEffect(() => {
    loadAnalytics();
  }, []);

  //FORMAT CURRENCY
  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const recoveryPercentage = useMemo(() => {
    if (!analytics) return 0;

    return Math.min(
      Number(analytics.recoveryRate || 0),
      100
    );
  }, [analytics]);

  const totalRiskCases = useMemo(() => {
    if (!analytics?.riskDistribution) return 0;

    return (
      Number(analytics.riskDistribution.high || 0) +
      Number(analytics.riskDistribution.medium || 0) +
      Number(analytics.riskDistribution.low || 0)
    );
  }, [analytics]);

  const pipelineItems = [
    ["detected", "Detected"],
    ["diagnosing", "Diagnosing"],
    ["awaiting_approval", "Awaiting Approval"],
    ["recovering", "Recovering"],
    ["recovered", "Recovered"],
    ["failed", "Failed"],
    ["escalated", "Escalated"],
    ["stopped", "Stopped"],
  ];

  //LOADING
  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar />

        <div className="main-area">
          <Topbar />

          <main className="analytics-page">
            <div className="analytics-state">
              <RefreshCw
                size={28}
                className="spin"
              />

              <p>
                Loading recovery analytics...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  //ERROR
  if (error || !analytics) {
    return (
      <div className="app-shell">
        <Sidebar />

        <div className="main-area">
          <Topbar />

          <main className="analytics-page">
            <div className="analytics-state error-state">
              <AlertTriangle size={30} />

              <p>
                {error || "Analytics unavailable"}
              </p>

              <button
                className="retry-button"
                onClick={loadAnalytics}
              >
                Try Again
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <main className="analytics-page">
          <div className="analytics-header">
            <div>
              <div className="section-eyebrow">
                RECOVERY INTELLIGENCE
              </div>

              <h1>Analytics</h1>

              <p>
                Measure how effectively Recovery AI converts
                at-risk revenue into recovered revenue.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={loadAnalytics}
              disabled={loading}
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>

          <section className="analytics-kpi-grid">
            <div className="analytics-kpi-card">
              <div className="analytics-kpi-icon purple">
                <IndianRupee size={21} />
              </div>

              <div>
                <span>Revenue At Risk</span>

                <strong>
                  {formatCurrency(
                    analytics.revenueAtRisk
                  )}
                </strong>
              </div>
            </div>

            <div className="analytics-kpi-card">
              <div className="analytics-kpi-icon green">
                <TrendingUp size={21} />
              </div>

              <div>
                <span>Revenue Recovered</span>

                <strong>
                  {formatCurrency(
                    analytics.revenueRecovered
                  )}
                </strong>
              </div>
            </div>

            <div className="analytics-kpi-card">
              <div className="analytics-kpi-icon violet">
                <Target size={21} />
              </div>

              <div>
                <span>Recovery Rate</span>

                <strong>
                  {analytics.recoveryRate || 0}%
                </strong>
              </div>
            </div>

            <div className="analytics-kpi-card">
              <div className="analytics-kpi-icon orange">
                <AlertTriangle size={21} />
              </div>

              <div>
                <span>At-Risk Cases</span>

                <strong>
                  {analytics.atRiskTransactions || 0}
                </strong>
              </div>
            </div>
          </section>

          <section className="analytics-main-grid">
            <div className="analytics-panel recovery-performance">
              <div className="analytics-panel-header">
                <div>
                  <span className="panel-eyebrow">
                    RECOVERY PERFORMANCE
                  </span>

                  <h2>Revenue Recovery</h2>

                  <p>
                    Recovered revenue against the total revenue
                    currently identified as at risk.
                  </p>
                </div>

                <div className="analytics-panel-icon">
                  <TrendingUp size={19} />
                </div>
              </div>

              <div className="recovery-amount-row">
                <div>
                  <span>Recovered</span>

                  <strong>
                    {formatCurrency(
                      analytics.revenueRecovered
                    )}
                  </strong>
                </div>

                <div>
                  <span>At Risk</span>

                  <strong>
                    {formatCurrency(
                      analytics.revenueAtRisk
                    )}
                  </strong>
                </div>
              </div>

              <div className="recovery-progress">
                <div className="recovery-progress-track">
                  <div
                    className="recovery-progress-fill"
                    style={{
                      width: `${recoveryPercentage}%`,
                    }}
                  />
                </div>

                <div className="recovery-progress-labels">
                  <span>
                    {analytics.recoveryRate || 0}%
                    recovered
                  </span>

                  <span>
                    {formatCurrency(
                      Math.max(
                        Number(
                          analytics.revenueAtRisk || 0
                        ) -
                          Number(
                            analytics.revenueRecovered || 0
                          ),
                        0
                      )
                    )}{" "}
                    remaining at risk
                  </span>
                </div>
              </div>

              <div className="recovery-highlight">
                <CheckCircle2 size={18} />

                <div>
                  <strong>
                    {analytics.recoveredCases || 0}{" "}
                    recovery cases successfully recovered
                  </strong>

                  <span>
                    Recovery performance is calculated
                    from actual RecoveryCase revenue.
                  </span>
                </div>
              </div>
            </div>

            <div className="analytics-panel">
              <div className="analytics-panel-header">
                <div>
                  <span className="panel-eyebrow">
                    RISK DISTRIBUTION
                  </span>

                  <h2>Revenue Risk Profile</h2>
                </div>

                <ShieldCheck size={19} />
              </div>

              <div className="risk-total">
                <strong>{totalRiskCases}</strong>

                <span>Total recovery cases</span>
              </div>

              <div className="risk-bars">
                <div className="risk-bar-row">
                  <div className="risk-bar-label">
                    <span className="risk-dot high" />

                    <span>High Risk</span>

                    <strong>
                      {analytics.riskDistribution?.high || 0}
                    </strong>
                  </div>

                  <div className="risk-bar-track">
                    <div
                      className="risk-bar-fill high"
                      style={{
                        width: `${
                          totalRiskCases
                            ? (analytics.riskDistribution.high /
                                totalRiskCases) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="risk-bar-row">
                  <div className="risk-bar-label">
                    <span className="risk-dot medium" />

                    <span>Medium Risk</span>

                    <strong>
                      {analytics.riskDistribution?.medium || 0}
                    </strong>
                  </div>

                  <div className="risk-bar-track">
                    <div
                      className="risk-bar-fill medium"
                      style={{
                        width: `${
                          totalRiskCases
                            ? (analytics.riskDistribution.medium /
                                totalRiskCases) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="risk-bar-row">
                  <div className="risk-bar-label">
                    <span className="risk-dot low" />

                    <span>Low Risk</span>

                    <strong>
                      {analytics.riskDistribution?.low || 0}
                    </strong>
                  </div>

                  <div className="risk-bar-track">
                    <div
                      className="risk-bar-fill low"
                      style={{
                        width: `${
                          totalRiskCases
                            ? (analytics.riskDistribution.low /
                                totalRiskCases) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="analytics-secondary-grid">
            <div className="analytics-panel">
              <div className="analytics-panel-header">
                <div>
                  <span className="panel-eyebrow">
                    RECOVERY PIPELINE
                  </span>

                  <h2>Case Lifecycle</h2>
                </div>

                <Activity size={19} />
              </div>

              <div className="pipeline-grid">
                {pipelineItems.map(([key, label]) => (
                  <div
                    className={`pipeline-item ${key}`}
                    key={key}
                  >
                    <span>{label}</span>

                    <strong>
                      {analytics.pipeline?.[key] || 0}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="analytics-panel">
              <div className="analytics-panel-header">
                <div>
                  <span className="panel-eyebrow">
                    FAILURE INTELLIGENCE
                  </span>

                  <h2>Top Recovery Reasons</h2>
                </div>

                <AlertTriangle size={19} />
              </div>

              {analytics.recoveryReasons?.length > 0 ? (
                <div className="reason-list">
                  {analytics.recoveryReasons.map(
                    (reason, index) => (
                      <div
                        className="reason-row"
                        key={`${reason._id}-${index}`}
                      >
                        <div className="reason-number">
                          {index + 1}
                        </div>

                        <div className="reason-info">
                          <strong>
                            {reason._id}
                          </strong>

                          <span>
                            {reason.count} recovery case
                            {reason.count !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="reason-amount">
                          {formatCurrency(
                            reason.amount
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="analytics-empty">
                  <CheckCircle2 size={24} />

                  <span>
                    No recovery reasons recorded yet.
                  </span>
                </div>
              )}
            </div>
          </section>

          <section className="analytics-panel batch-panel">
            <div className="analytics-panel-header">
              <div>
                <span className="panel-eyebrow">
                  BATCH OVERVIEW
                </span>

                <h2>Recovery System Performance</h2>

                <p>
                  Current system-wide payment and recovery
                  metrics.
                </p>
              </div>
            </div>

            <div className="batch-metrics">
              <div className="batch-metric">
                <span>Total Transactions</span>

                <strong>
                  {analytics.totalTransactions || 0}
                </strong>
              </div>

              <div className="batch-metric">
                <span>Recovered Cases</span>

                <strong>
                  {analytics.recoveredCases || 0}
                </strong>
              </div>

              <div className="batch-metric">
                <span>Revenue Recovered</span>

                <strong>
                  {formatCurrency(
                    analytics.revenueRecovered
                  )}
                </strong>
              </div>

              <div className="batch-metric">
                <span>Recovery Rate</span>

                <strong>
                  {analytics.recoveryRate || 0}%
                </strong>
              </div>
            </div>

            <div className="analytics-footnote">
              <ArrowUpRight size={15} />

              <span>
                Metrics are calculated from live transaction
                and recovery-case data.
              </span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Analytics;