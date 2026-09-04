import {
  Search,
  RefreshCcw,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  ChevronRight,
  Bot,
  IndianRupee,
  Activity,
  Loader2,
  X,
  User,
  CreditCard,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  getRecoveryCases,
  getRecoveryCaseById,
} from "../services/recoveryCasesApi";

export default function RecoveryCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  const [selectedCase, setSelectedCase] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  //LOAD RECOVERY CASES
  const loadCases = async () => {
    try {
      setError("");

      const result = await getRecoveryCases();

      if (result.success) {
        setCases(result.data || []);
      } else {
        throw new Error(
          result.message || "Failed to load cases"
        );
      }
    } catch (err) {
      console.error(
        "Recovery cases loading error:",
        err
      );

      setError(
        err.message ||
          "Failed to load recovery cases"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  //INITIAL LOAD
  useEffect(() => {
    loadCases();
  }, []);

  //REFRESH
  const handleRefresh = () => {
    setRefreshing(true);
    loadCases();
  };

  //OPEN CASE DETAILS
  const openCase = async (id) => {
    try {
      setDetailLoading(true);

      const result = await getRecoveryCaseById(id);

      if (result.success) {
        setSelectedCase(result.data);
      }
    } catch (err) {
      console.error(
        "Case details error:",
        err
      );
    } finally {
      setDetailLoading(false);
    }
  };

  //FILTER CASES
  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const customer =
        item.customerId?.name || "";

      const email =
        item.customerId?.email || "";

      const caseId =
        item._id || "";

      const rootCause =
        item.rootCause || "";

      const matchesSearch =
        !search ||
        customer
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        email
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        caseId
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        rootCause
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesRisk =
        riskFilter === "ALL" ||
        item.riskLevel === riskFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter;

      const matchesPayment =
        paymentFilter === "ALL" ||
        item.transactionId?.paymentMethod ===
          paymentFilter;

      return (
        matchesSearch &&
        matchesRisk &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [
    cases,
    search,
    riskFilter,
    statusFilter,
    paymentFilter,
  ]);

  //STATISTICS
  const stats = useMemo(() => {
    const total = cases.length;

    const detected = cases.filter(
      (item) => item.status === "detected"
    ).length;

    const recovering = cases.filter(
      (item) => item.status === "recovering"
    ).length;

    const recovered = cases.filter(
      (item) => item.status === "recovered"
    ).length;

    //Count both current escalation states
    const escalated = cases.filter(
      (item) =>
        item.status === "awaiting_approval" ||
        item.status === "escalated"
    ).length;

    const revenueAtRisk = cases.reduce(
      (sum, item) =>
        sum + (item.revenueAtRisk || 0),
      0
    );

    const revenueRecovered = cases.reduce(
      (sum, item) =>
        sum + (item.revenueRecovered || 0),
      0
    );

    return {
      total,
      detected,
      recovering,
      recovered,
      escalated,
      revenueAtRisk,
      revenueRecovered,
    };
  }, [cases]);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar />

        <section className="recovery-page">
          {/* PAGE HEADER */}
          <div className="recovery-page-header">
            <div>
              <div className="eyebrow">
                RECOVERY OPERATIONS
              </div>

              <h1>Recovery Cases</h1>

              <p>
                Monitor, diagnose and recover
                at-risk payments.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCcw
                size={16}
                className={
                  refreshing ? "spin" : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {/* SUMMARY CARDS */}
          <div className="recovery-stats">
            <RecoveryStat
              label="Total Cases"
              value={stats.total}
              icon={Activity}
              type="purple"
            />

            <RecoveryStat
              label="Detected"
              value={stats.detected}
              icon={Clock3}
              type="blue"
            />

            <RecoveryStat
              label="Recovering"
              value={stats.recovering}
              icon={RefreshCcw}
              type="cyan"
            />

            <RecoveryStat
              label="Recovered"
              value={stats.recovered}
              icon={CheckCircle2}
              type="green"
            />

            <RecoveryStat
              label="Escalations"
              value={stats.escalated}
              icon={ShieldAlert}
              type="red"
            />

            <RecoveryStat
              label="Revenue at Risk"
              value={`₹${stats.revenueAtRisk.toLocaleString(
                "en-IN"
              )}`}
              icon={IndianRupee}
              type="orange"
            />
          </div>

          {/* RECOVERY VALUE STRIP */}
          <div className="recovery-value-strip">
            <div>
              <span>Revenue at Risk</span>

              <strong>
                ₹
                {stats.revenueAtRisk.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div className="value-divider" />

            <div>
              <span>Successfully Recovered</span>

              <strong className="success-value">
                ₹
                {stats.revenueRecovered.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div className="value-divider" />

            <div>
              <span>Recovery Opportunities</span>

              <strong>{stats.total}</strong>
            </div>

            <div className="value-ai">
              <Bot size={18} />

              <span>
                AI Recovery Engine
                <small>Monitoring cases</small>
              </span>

              <span className="live-indicator">
                LIVE
              </span>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="cases-toolbar">
            <div className="case-search">
              <Search size={17} />

              <input
                type="text"
                placeholder="Search customer, case ID or root cause..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            <div className="filter-group">
              <Filter size={15} />

              <select
                value={riskFilter}
                onChange={(e) =>
                  setRiskFilter(e.target.value)
                }
              >
                <option value="ALL">
                  All Risk
                </option>

                <option value="HIGH">
                  High Risk
                </option>

                <option value="MEDIUM">
                  Medium Risk
                </option>

                <option value="LOW">
                  Low Risk
                </option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
              >
                <option value="ALL">
                  All Status
                </option>

                <option value="detected">
                  Detected
                </option>

                <option value="diagnosing">
                  Diagnosing
                </option>

                <option value="awaiting_approval">
                  Awaiting Approval
                </option>

                <option value="recovering">
                  Recovering
                </option>

                <option value="recovered">
                  Recovered
                </option>

                <option value="failed">
                  Failed
                </option>

                <option value="escalated">
                  Escalated
                </option>

                <option value="stopped">
                  Stopped
                </option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) =>
                  setPaymentFilter(e.target.value)
                }
              >
                <option value="ALL">
                  All Payments
                </option>

                <option value="card">
                  Card
                </option>

                <option value="upi">
                  UPI
                </option>

                <option value="wallet">
                  Wallet
                </option>

                <option value="netbanking">
                  Net Banking
                </option>
              </select>
            </div>
          </div>

          {/* CASE TABLE */}
          <div className="cases-table-panel">
            <div className="table-header">
              <div>
                <h2>Recovery Pipeline</h2>

                <span>
                  {filteredCases.length} cases
                  matching current filters
                </span>
              </div>

              <div className="table-live">
                <span />
                Live data
              </div>
            </div>

            {/* LOADING */}
            {loading ? (
              <div className="cases-loading">
                <Loader2
                  size={28}
                  className="spin"
                />

                <p>
                  Loading recovery cases...
                </p>
              </div>
            ) : error ? (
              <div className="cases-error">
                <AlertTriangle size={30} />

                <strong>
                  Unable to load cases
                </strong>

                <span>{error}</span>

                <button
                  onClick={handleRefresh}
                >
                  Try Again
                </button>
              </div>
            ) : filteredCases.length === 0 ? (
              <div className="cases-empty">
                <Search size={30} />

                <strong>
                  No recovery cases found
                </strong>

                <span>
                  Try changing your filters
                  or search query.
                </span>
              </div>
            ) : (
              <div className="cases-table-wrapper">
                <table className="cases-table">
                  <thead>
                    <tr>
                      <th>CASE</th>
                      <th>CUSTOMER</th>
                      <th>AMOUNT AT RISK</th>
                      <th>RISK</th>
                      <th>ROOT CAUSE</th>
                      <th>AI ACTION</th>
                      <th>STATUS</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCases.map(
                      (item) => (
                        <RecoveryCaseRow
                          key={item._id}
                          item={item}
                          onClick={() =>
                            openCase(item._id)
                          }
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* CASE DETAIL DRAWER */}
      {selectedCase && (
        <div
          className="case-drawer-overlay"
          onClick={() =>
            setSelectedCase(null)
          }
        >
          <aside
            className="case-drawer"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {detailLoading ? (
              <div className="drawer-loading">
                <Loader2
                  size={28}
                  className="spin"
                />

                <span>
                  Loading case...
                </span>
              </div>
            ) : (
              <CaseDetails
                recoveryCase={selectedCase}
                onClose={() =>
                  setSelectedCase(null)
                }
              />
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

//SUMMARY STAT
function RecoveryStat({
  label,
  value,
  icon: Icon,
  type,
}) {
  return (
    <div className={`recovery-stat ${type}`}>
      <div className="recovery-stat-icon">
        <Icon size={18} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

//CASE ROW
function RecoveryCaseRow({
  item,
  onClick,
}) {
  const customer =
    item.customerId || {};

  const transaction =
    item.transactionId || {};

  return (
    <tr
      className="recovery-case-row"
      onClick={onClick}
    >
      <td>
        <div className="case-id">
          <strong>
            {formatCaseId(item._id)}
          </strong>

          <span>
            {formatDate(item.createdAt)}
          </span>
        </div>
      </td>

      <td>
        <div className="customer-cell">
          <div className="customer-avatar">
            {(customer.name || "C")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {customer.name ||
                "Unknown Customer"}
            </strong>

            <span>
              {customer.email ||
                "No email"}
            </span>
          </div>
        </div>
      </td>

      <td>
        <div className="amount-cell">
          <strong>
            ₹
            {(
              item.revenueAtRisk || 0
            ).toLocaleString("en-IN")}
          </strong>

          <span>
            {transaction.paymentMethod ||
              "—"}
          </span>
        </div>
      </td>

      <td>
        <RiskBadge
          level={item.riskLevel}
          score={item.riskScore}
        />
      </td>

      <td>
        <div className="root-cause">
          {item.rootCause ? (
            <>
              <AlertTriangle size={14} />

              <span>
                {item.rootCause}
              </span>
            </>
          ) : (
            <span className="muted">
              Awaiting diagnosis
            </span>
          )}
        </div>
      </td>

      <td>
        <div className="ai-action">
          <Bot size={14} />

          <span>
            {formatAction(
              item.recommendedAction
            )}
          </span>
        </div>
      </td>

      <td>
        <StatusBadge
          status={item.status}
        />
      </td>

      <td>
        <button
          className="row-arrow"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <ChevronRight size={17} />
        </button>
      </td>
    </tr>
  );
}

//RISK BADGE
function RiskBadge({
  level,
  score,
}) {
  const normalized =
    level?.toLowerCase() || "low";

  return (
    <div
      className={`risk-badge ${normalized}`}
    >
      <span />

      <div>
        <strong>
          {level || "LOW"}
        </strong>

        <small>
          {score ?? 0}/100
        </small>
      </div>
    </div>
  );
}

//STATUS BADGE
function StatusBadge({
  status,
}) {
  const config = {
    detected: {
      label: "Detected",
      className: "detected",
    },

    diagnosing: {
      label: "Diagnosing",
      className: "diagnosing",
    },

    awaiting_approval: {
      label: "Awaiting Approval",
      className: "awaiting",
    },

    recovering: {
      label: "Recovering",
      className: "recovering",
    },

    recovered: {
      label: "Recovered",
      className: "recovered",
    },

    failed: {
      label: "Failed",
      className: "failed",
    },

    escalated: {
      label: "Escalated",
      className: "escalated",
    },

    stopped: {
      label: "Stopped",
      className: "stopped",
    },
  };

  const current =
    config[status] || {
      label: status,
      className: "",
    };

  return (
    <span
      className={`status-badge ${current.className}`}
    >
      {current.label}
    </span>
  );
}

//CASE DETAILS
function CaseDetails({
  recoveryCase,
  onClose,
}) {
  const customer =
    recoveryCase.customerId || {};

  const transaction =
    recoveryCase.transactionId || {};

  const decision =
    recoveryCase.agentDecision;

  return (
    <div className="case-details">
      {/* HEADER */}
      <div className="drawer-header">
        <div>
          <span className="drawer-eyebrow">
            RECOVERY CASE
          </span>

          <h2>
            {formatCaseId(
              recoveryCase._id
            )}
          </h2>

          <span className="drawer-date">
            Created{" "}
            {formatDate(
              recoveryCase.createdAt
            )}
          </span>
        </div>

        <button
          className="drawer-close"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      {/* RISK HERO */}
      <div className="case-risk-hero">
        <div>
          <span>REVENUE AT RISK</span>

          <strong>
            ₹
            {(
              recoveryCase.revenueAtRisk ||
              0
            ).toLocaleString("en-IN")}
          </strong>
        </div>

        <RiskBadge
          level={recoveryCase.riskLevel}
          score={
            recoveryCase.riskScore
          }
        />
      </div>

      {/* CUSTOMER */}
      <DetailSection
        icon={User}
        title="Customer"
      >
        <div className="customer-detail">
          <div className="large-avatar">
            {(customer.name || "C")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {customer.name ||
                "Unknown"}
            </strong>

            <span>
              {customer.email ||
                "No email"}
            </span>

            {customer.phone && (
              <span>
                {customer.phone}
              </span>
            )}
          </div>
        </div>

        <div className="customer-metrics">
          <Metric
            label="Lifetime Value"
            value={
              customer.lifetimeValue
                ? `₹${Number(
                    customer.lifetimeValue
                  ).toLocaleString(
                    "en-IN"
                  )}`
                : "—"
            }
          />

          <Metric
            label="Successful Payments"
            value={
              customer
                .totalSuccessfulPayments ??
              "—"
            }
          />

          <Metric
            label="Failed Payments"
            value={
              customer
                .totalFailedPayments ??
              "—"
            }
          />
        </div>
      </DetailSection>

      {/* TRANSACTION */}
      <DetailSection
        icon={CreditCard}
        title="Transaction"
      >
        <div className="detail-grid">
          <Metric
            label="Amount"
            value={`₹${Number(
              transaction.amount || 0
            ).toLocaleString(
              "en-IN"
            )}`}
          />

          <Metric
            label="Payment Method"
            value={
              transaction.paymentMethod ||
              "—"
            }
          />

          <Metric
            label="Payment Status"
            value={
              transaction.status ||
              "—"
            }
          />

          <Metric
            label="Failure Reason"
            value={
              transaction.failureReason ||
              "—"
            }
          />
        </div>
      </DetailSection>

      {/* AI DIAGNOSIS */}
      <DetailSection
        icon={Bot}
        title="AI Diagnosis"
      >
        <div className="ai-diagnosis">
          <div className="diagnosis-item">
            <span>ROOT CAUSE</span>

            <strong>
              {recoveryCase.rootCause ||
                "Diagnosis pending"}
            </strong>
          </div>

          <div className="diagnosis-item">
            <span>
              RECOMMENDED ACTION
            </span>

            <strong>
              {formatAction(
                recoveryCase.recommendedAction
              )}
            </strong>
          </div>

          {decision?.confidence !==
            undefined && (
            <div className="confidence-row">
              <span>AI Confidence</span>

              <strong>
                {Math.round(
                  decision.confidence *
                    100
                )}
                %
              </strong>
            </div>
          )}

          {decision?.reason && (
            <p className="ai-reason">
              {decision.reason}
            </p>
          )}
        </div>
      </DetailSection>

      {/* RECOVERY STATUS */}
      <DetailSection
        icon={Activity}
        title="Recovery Progress"
      >
        <div className="recovery-progress">
          <ProgressStep
            label="Detected"
            active
            completed={
              recoveryCase.status !==
              "detected"
            }
          />

          <ProgressStep
            label="Diagnosis"
            active={
              recoveryCase.rootCause
            }
            completed={
              !!recoveryCase.rootCause
            }
          />

          <ProgressStep
            label="Recovery Action"
            active={
              recoveryCase.attemptCount >
                0
            }
            completed={
              recoveryCase.attemptCount >
                0
            }
          />

          <ProgressStep
            label="Recovered"
            active={
              recoveryCase.status ===
              "recovered"
            }
            completed={
              recoveryCase.status ===
              "recovered"
            }
          />
        </div>
      </DetailSection>
    </div>
  );
}

//DETAIL SECTION
function DetailSection({
  icon: Icon,
  title,
  children,
}) {
  return (
    <div className="detail-section">
      <div className="detail-section-title">
        <Icon size={16} />

        <span>{title}</span>
      </div>

      {children}
    </div>
  );
}

//METRIC
function Metric({
  label,
  value,
}) {
  return (
    <div className="metric">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

//PROGRESS STEP
function ProgressStep({
  label,
  active,
  completed,
}) {
  return (
    <div
      className={`progress-step ${
        active ? "active" : ""
      } ${completed ? "completed" : ""}`}
    >
      <div className="progress-dot">
        {completed && (
          <CheckCircle2 size={13} />
        )}
      </div>

      <span>{label}</span>
    </div>
  );
}

//HELPERS
function formatCaseId(id) {
  if (!id) return "RC-UNKNOWN";

  return `RC-${id
    .slice(-6)
    .toUpperCase()}`;
}

function formatAction(action) {
  if (!action) {
    return "Awaiting AI analysis";
  }

  return action
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}