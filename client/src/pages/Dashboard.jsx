import {
  Wallet,
  IndianRupee,
  Percent,
  BriefcaseBusiness,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Bot,
  Send,
  Ban,
} from "lucide-react";

import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";

import { getDashboardSummary } from "../services/dashboardApi";

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //LOAD DASHBOARD DATA
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getDashboardSummary();

        if (result?.success && result?.data) {
          setDashboard(result.data);
        } else {
          throw new Error("Invalid dashboard response");
        }
      } catch (err) {
        console.error("Dashboard loading error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  //LOADING STATE
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>

        <h2>Loading Recovery Intelligence...</h2>

        <p>
          Connecting to the recovery engine
        </p>
      </div>
    );
  }

  //ERROR STATE
  if (error) {
    return (
      <div className="dashboard-loading">
        <AlertTriangle size={32} />

        <h2>Unable to load dashboard</h2>

        <p>{error}</p>

        <button
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  //SAFETY CHECK
  if (!dashboard) {
    return (
      <div className="dashboard-loading">
        <h2>No dashboard data available</h2>

        <p>
          The recovery engine returned an empty response.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="main-content">
        <Topbar />

        <section className="dashboard-content">
          {/* KPI CARDS */}
          <div className="stats-grid">
            <StatCard
              title="Revenue at Risk"
              value={`₹${formatNumber(dashboard.revenueAtRisk)}`}
              change={18.6}
              description="Current exposure"
              icon={Wallet}
              type="purple"
            />

            <StatCard
              title="Recovered Amount"
              value={`₹${formatNumber(dashboard.revenueRecovered)}`}
              change={24.3}
              description="Recovered successfully"
              icon={IndianRupee}
              type="orange"
            />

            <StatCard
              title="Recovery Rate"
              value={`${dashboard.recoveryRate}%`}
              change={4.7}
              description="Revenue recovered"
              icon={Percent}
              type="green"
            />

            <StatCard
              title="At-Risk Cases"
              value={dashboard.atRiskTransactions}
              change={16.2}
              description="Requiring recovery"
              icon={BriefcaseBusiness}
              type="blue"
            />
          </div>

          {/* MAIN ANALYTICS */}
          <div className="analytics-grid">
            {/* REVENUE RECOVERED */}
            <div className="panel revenue-panel">
              <div className="panel-header">
                <div>
                  <h2>Revenue Recovered</h2>

                  <span>
                    Current recovery performance
                  </span>
                </div>

                <div className="chart-period">
                  Live
                </div>
              </div>

              <div className="chart-value">
                ₹{formatNumber(dashboard.revenueRecovered)}
              </div>

              <div className="recovery-performance">
                <div className="performance-track">
                  <div
                    className="performance-fill"
                    style={{
                      width: `${Math.min(
                        dashboard.recoveryRate,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <div className="performance-info">
                  <span>Recovery Rate</span>

                  <strong>
                    {dashboard.recoveryRate}%
                  </strong>
                </div>
              </div>

              <div className="revenue-summary">
                <div>
                  <span>Revenue at Risk</span>

                  <strong>
                    ₹{formatNumber(dashboard.revenueAtRisk)}
                  </strong>
                </div>

                <div>
                  <span>Recovered</span>

                  <strong>
                    ₹{formatNumber(dashboard.revenueRecovered)}
                  </strong>
                </div>

                <div>
                  <span>Remaining Risk</span>

                  <strong>
                    ₹{formatNumber(
                      Math.max(
                        dashboard.revenueAtRisk -
                          dashboard.revenueRecovered,
                        0
                      )
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {/* RECOVERY FUNNEL */}
            <div className="panel funnel-panel">
              <div className="panel-header">
                <div>
                  <h2>Recovery Funnel</h2>

                  <span>
                    Cases progressing through recovery
                  </span>
                </div>
              </div>

              <div className="funnel">
                <FunnelRow
                  label="Detected"
                  value={dashboard.pipeline?.detected || 0}
                  className="detected"
                  max={dashboard.pipeline?.detected || 1}
                />

                <FunnelRow
                  label="Diagnosing"
                  value={dashboard.pipeline?.diagnosing || 0}
                  className="analyzed"
                  max={dashboard.pipeline?.detected || 1}
                />

                <FunnelRow
                  label="Awaiting Approval"
                  value={
                    dashboard.pipeline?.awaiting_approval || 0
                  }
                  className="allowed"
                  max={dashboard.pipeline?.detected || 1}
                />

                <FunnelRow
                  label="Recovering"
                  value={dashboard.pipeline?.recovering || 0}
                  className="recovery"
                  max={dashboard.pipeline?.detected || 1}
                />

                <FunnelRow
                  label="Recovered"
                  value={dashboard.pipeline?.recovered || 0}
                  className="recovered"
                  max={dashboard.pipeline?.detected || 1}
                />
              </div>

              {/* FUNNEL FOOTER */}
              <div className="funnel-footer">
                <div>
                  <span>Total detected</span>

                  <strong>
                    {dashboard.pipeline?.detected || 0}
                  </strong>
                </div>

                <div>
                  <span>Successfully recovered</span>

                  <strong>
                    {dashboard.pipeline?.recovered || 0}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* LOWER SECTION */}
          <div className="bottom-grid">
            {/* RECOVERY REASONS */}
            <div className="panel reasons-panel">
              <div className="panel-header">
                <div>
                  <h2>Top Recovery Reasons</h2>

                  <span>
                    Why revenue is slipping
                  </span>
                </div>

                <ArrowUpRight size={18} />
              </div>

              <div className="reason-chart">
                {/* DONUT */}
                <div
                  className="donut"
                  style={getDonutStyle(
                    dashboard.recoveryReasons
                  )}
                >
                  <div className="donut-center">
                    <strong>
                      {dashboard.recoveryReasons?.length || 0}
                    </strong>

                    <span>reasons</span>
                  </div>
                </div>

                {/* REASON LIST */}
                <div className="reason-list">
                  {dashboard.recoveryReasons?.length > 0 ? (
                    dashboard.recoveryReasons
                      .slice(0, 5)
                      .map((reason, index) => (
                        <div
                          key={`${reason._id}-${index}`}
                        >
                          <span
                            className={`legend reason-${index}`}
                          ></span>

                          <span className="reason-name">
                            {reason._id || "Unknown reason"}
                          </span>

                          <strong>
                            ₹{formatNumber(reason.amount || 0)}
                          </strong>
                        </div>
                      ))
                  ) : (
                    <div className="empty-state">
                      No recovery reasons yet
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RECENT CASES */}
            <div className="panel cases-panel">
              <div className="panel-header">
                <div>
                  <h2>Recent Recovery Cases</h2>

                  <span>
                    Latest recovery activity
                  </span>
                </div>
              </div>

              <div className="case-list">
                {dashboard.recentCases?.length > 0 ? (
                  dashboard.recentCases
                    .slice(0, 5)
                    .map((item) => (
                      <Case
                        key={item._id}
                        id={formatCaseId(item._id)}
                        name={
                          item.customerId?.name ||
                          "Unknown Customer"
                        }
                        amount={`₹${formatNumber(
                          item.revenueAtRisk || 0
                        )}`}
                        status={formatStatus(item.status)}
                        statusClass={getStatusClass(item.status)}
                        time={formatTime(
                          item.updatedAt ||
                            item.createdAt
                        )}
                      />
                    ))
                ) : (
                  <div className="empty-state">
                    No recovery cases found
                  </div>
                )}
              </div>
            </div>

            {/* AI INSIGHTS */}
            <div className="panel ai-panel">
              <div className="panel-header">
                <div>
                  <h2>AI Agent Insights</h2>

                  <span>
                    Live recovery activity
                  </span>
                </div>

                <Bot size={20} />
              </div>

              {/* AI HIGHLIGHT */}
              <div className="ai-highlight">
                <div className="ai-avatar">
                  <Bot size={23} />
                </div>

                <div>
                  <strong>
                    {getAIInsight(dashboard).title}
                  </strong>

                  <span>
                    {getAIInsight(dashboard).description}
                  </span>
                </div>

                <ArrowUpRight size={18} />
              </div>

              {/* ACTIVITY */}
              <div className="activity-list">
                {dashboard.recentActivity?.length > 0 ? (
                  dashboard.recentActivity
                    .slice(0, 5)
                    .map((activity) => (
                      <Activity
                        key={activity._id}
                        icon={getActivityIcon(activity.event)}
                        text={
                          activity.description ||
                          activity.event
                        }
                        time={formatTime(
                          activity.createdAt
                        )}
                      />
                    ))
                ) : (
                  <div className="empty-state">
                    No recent AI activity
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RISK DISTRIBUTION */}
          <div className="panel risk-panel">
            <div className="panel-header">
              <div>
                <h2>Risk Distribution</h2>

                <span>
                  Current recovery case risk levels
                </span>
              </div>
            </div>

            <div className="risk-grid">
              <RiskCard
                title="High Risk"
                value={
                  dashboard.riskDistribution?.high ||
                  dashboard.highRiskCases ||
                  0
                }
                className="high-risk"
              />

              <RiskCard
                title="Medium Risk"
                value={
                  dashboard.riskDistribution?.medium ||
                  dashboard.mediumRiskCases ||
                  0
                }
                className="medium-risk"
              />

              <RiskCard
                title="Low Risk"
                value={
                  dashboard.riskDistribution?.low ||
                  dashboard.lowRiskCases ||
                  0
                }
                className="low-risk"
              />

              <RiskCard
                title="Total Cases"
                value={dashboard.atRiskTransactions || 0}
                className="total-risk"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

//FUNNEL ROW
function FunnelRow({
  label,
  value,
  className,
  max,
}) {
  const percentage =
    max > 0
      ? Math.max(
          value > 0 ? 12 : 3,
          Math.min((value / max) * 100, 100)
        )
      : 3;

  return (
    <div className="funnel-row">
      <span>{label}</span>

      <div
        className={`funnel-bar ${className}`}
        style={{
          width: `${percentage}%`,
        }}
      >
        {value}
      </div>
    </div>
  );
}

//CASE COMPONENT
function Case({
  id,
  name,
  amount,
  status,
  statusClass,
  time,
}) {
  return (
    <div className="case-row">
      <div className="case-info">
        <strong>{id}</strong>

        <span>
          {name} · {amount}
        </span>
      </div>

      <span className={`case-status ${statusClass}`}>
        {status}
      </span>

      <small>{time}</small>
    </div>
  );
}

//ACTIVITY COMPONENT
function Activity({
  icon: Icon,
  text,
  time,
}) {
  return (
    <div className="activity-row">
      <div className="activity-icon">
        <Icon size={16} />
      </div>

      <span>{text}</span>

      <small>{time}</small>
    </div>
  );
}

//RISK CARD
function RiskCard({
  title,
  value,
  className,
}) {
  return (
    <div className={`risk-card ${className}`}>
      <div className="risk-card-title">
        {title}
      </div>

      <strong>{value}</strong>

      <span>Recovery cases</span>
    </div>
  );
}

//NUMBER FORMATTER
function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

//CASE ID
function formatCaseId(id) {
  if (!id) {
    return "RC-UNKNOWN";
  }

  return `RC-${id.slice(-6).toUpperCase()}`;
}

//STATUS FORMATTER
function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

//STATUS CLASS
function getStatusClass(status) {
  switch (status) {
    case "recovered":
      return "success";

    case "recovering":
      return "blue-status";

    case "awaiting_approval":
      return "warning";

    case "failed":
    case "stopped":
      return "danger";

    case "detected":
      return "blue-status";

    case "diagnosing":
      return "blue-status";

    default:
      return "blue-status";
  }
}

//TIME FORMATTER
function formatTime(date) {
  if (!date) {
    return "Unknown";
  }

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `${days}d ago`;
  }

  return new Date(date).toLocaleDateString("en-IN");
}

//ACTIVITY ICON
function getActivityIcon(event) {
  switch (event) {
    case "PAYMENT_SUCCESS":
      return CheckCircle2;

    case "RECOVERY_ACTION":
    case "PAYMENT_LINK_CREATED":
    case "RECOVERY_TRIGGERED":
      return Send;

    case "ESCALATED":
      return AlertTriangle;

    case "STOPPED":
      return Ban;

    default:
      return Clock3;
  }
}

//AI INSIGHT
function getAIInsight(dashboard) {
  const recovered = dashboard.revenueRecovered || 0;
  const atRisk = dashboard.revenueAtRisk || 0;
  const recoveryRate = dashboard.recoveryRate || 0;

  if (recovered > 0) {
    return {
      title: "Recovery action is working",
      description: `₹${formatNumber(
        recovered
      )} successfully recovered`,
    };
  }

  if (atRisk > 0) {
    return {
      title: "High recovery potential detected",
      description: `${
        dashboard.atRiskTransactions || 0
      } cases require attention`,
    };
  }

  if (recoveryRate > 50) {
    return {
      title: "Strong recovery performance",
      description: `Recovery rate is ${recoveryRate}%`,
    };
  }

  return {
    title: "AI agent monitoring transactions",
    description: "Waiting for recovery opportunities",
  };
}

//DONUT STYLE
function getDonutStyle(reasons) {
  if (!reasons || reasons.length === 0) {
    return {
      background:
        "conic-gradient(#263044 0deg 360deg)",
    };
  }

  const total = reasons.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  if (total === 0) {
    return {
      background:
        "conic-gradient(#263044 0deg 360deg)",
    };
  }

  const gradients = [];
  let currentDegree = 0;

  const degrees = [
    120,
    180,
    240,
    300,
    360,
  ];

  reasons
    .slice(0, 5)
    .forEach((reason, index) => {
      const amount = Number(reason.amount || 0);
      const degree = (amount / total) * 360;
      const nextDegree = currentDegree + degree;

      gradients.push(
        `var(--reason-${index}) ${currentDegree}deg ${nextDegree}deg`
      );

      currentDegree = nextDegree;
    });

  if (currentDegree < 360) {
    gradients.push(
      `#263044 ${currentDegree}deg 360deg`
    );
  }

  return {
    background: `conic-gradient(${gradients.join(", ")})`,
  };
}