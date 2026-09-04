import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  getEscalations,
  approveEscalation,
  rejectEscalation,
} from "../services/escalationApi";

function Escalations() {
  const [escalations, setEscalations] = useState([]);
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  //LOAD ESCALATIONS
  const loadEscalations = async (preserveSelection = true) => {
    try {
      setLoading(true);
      setError(null);

      const result = await getEscalations();

      if (!result?.success) {
        setError(
          result?.message ||
            "Failed to load escalations"
        );
        return;
      }

      const data = result.data || [];

      setEscalations(data);

      setSelectedEscalation((currentSelected) => {
        if (preserveSelection && currentSelected?._id) {
          const fresh = data.find(
            (item) => item._id === currentSelected._id
          );

          if (fresh) {
            return fresh;
          }
        }

        return data[0] || null;
      });
    } catch (err) {
      console.error("Escalations loading error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to connect to escalation service"
      );
    } finally {
      setLoading(false);
    }
  };

  //INITIAL LOAD
  useEffect(() => {
    loadEscalations(false);
  }, []);

  //STATISTICS
  const stats = useMemo(() => {
    const total = escalations.length;

    const highRisk = escalations.filter(
      (item) =>
        String(item.riskLevel).toUpperCase() === "HIGH"
    ).length;

    const mediumRisk = escalations.filter(
      (item) =>
        String(item.riskLevel).toUpperCase() === "MEDIUM"
    ).length;

    const revenue = escalations.reduce(
      (sum, item) =>
        sum + Number(item.revenueAtRisk || 0),
      0
    );

    return {
      total,
      highRisk,
      mediumRisk,
      revenue,
    };
  }, [escalations]);

  //APPROVE ESCALATION
  const handleApprove = async () => {
    if (!selectedEscalation?._id) {
      return;
    }

    if (processing) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const result = await approveEscalation(
        selectedEscalation._id
      );

      if (!result?.success) {
        setError(
          result?.message ||
            result?.error ||
            "Failed to approve recovery"
        );
        return;
      }

      setSuccess(
        "Recovery approved. The case is now ready for execution."
      );

      await loadEscalations(false);
    } catch (err) {
      console.error("Approve escalation error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to approve recovery"
      );
    } finally {
      setProcessing(false);
    }
  };

  //REJECT ESCALATION
  const handleReject = async () => {
    if (!selectedEscalation?._id) {
      return;
    }

    if (processing) {
      return;
    }

    const confirmed = window.confirm(
      "Reject this recovery action?\n\nThe case will be stopped and the recovery action will not be executed."
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const result = await rejectEscalation(
        selectedEscalation._id,
        "Recovery rejected by human reviewer"
      );

      if (!result?.success) {
        setError(
          result?.message ||
            result?.error ||
            "Failed to reject recovery"
        );
        return;
      }

      setSuccess(
        "Recovery rejected and the case has been stopped."
      );

      await loadEscalations(false);
    } catch (err) {
      console.error("Reject escalation error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to reject recovery"
      );
    } finally {
      setProcessing(false);
    }
  };

  //HELPERS
  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN");
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Awaiting Approval";
    }

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getRiskClass = (risk) => {
    return String(risk || "LOW").toLowerCase();
  };

  const getRiskIcon = (risk) => {
    const normalized = String(
      risk || "LOW"
    ).toUpperCase();

    if (normalized === "HIGH") {
      return <ShieldAlert size={17} />;
    }

    if (normalized === "MEDIUM") {
      return <AlertTriangle size={17} />;
    }

    return <ShieldCheck size={17} />;
  };

  //LOADING
  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar />

        <div className="main-area">
          <Topbar />

          <div className="escalation-loading">
            <RefreshCw
              size={28}
              className="spin"
            />

            <span>
              Loading escalation queue...
            </span>
          </div>
        </div>
      </div>
    );
  }

  //MAIN UI
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <section className="escalations-page">
          {/* HEADER */}
          <div className="escalations-header">
            <div>
              <div className="escalations-eyebrow">
                <ShieldAlert size={15} />
                HUMAN-IN-THE-LOOP CONTROL
              </div>

              <h1>Escalations</h1>

              <p>
                Review recovery decisions that
                require human approval before
                money-moving actions.
              </p>
            </div>

            <div className="escalation-live">
              <span className="escalation-live-dot" />

              <div>
                <strong>
                  Approval Gate Active
                </strong>

                <small>
                  AI actions remain bounded
                </small>
              </div>

              <button
                className="escalation-refresh"
                onClick={() =>
                  loadEscalations(true)
                }
                disabled={loading || processing}
              >
                <RefreshCw
                  size={17}
                  className={
                    loading ? "spin" : ""
                  }
                />
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="escalation-alert error">
              <XCircle size={18} />

              <span>{error}</span>

              <button
                onClick={() =>
                  setError(null)
                }
              >
                ×
              </button>
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="escalation-alert success">
              <CheckCircle2 size={18} />

              <span>{success}</span>

              <button
                onClick={() =>
                  setSuccess(null)
                }
              >
                ×
              </button>
            </div>
          )}

          {/* STATS */}
          <div className="escalation-stats">
            <div className="escalation-stat-card">
              <div className="escalation-stat-icon orange">
                <Clock3 size={19} />
              </div>

              <div>
                <span>
                  Awaiting Approval
                </span>

                <strong>
                  {stats.total}
                </strong>
              </div>
            </div>

            <div className="escalation-stat-card">
              <div className="escalation-stat-icon red">
                <ShieldAlert size={19} />
              </div>

              <div>
                <span>High Risk</span>

                <strong>
                  {stats.highRisk}
                </strong>
              </div>
            </div>

            <div className="escalation-stat-card">
              <div className="escalation-stat-icon orange">
                <AlertTriangle size={19} />
              </div>

              <div>
                <span>Medium Risk</span>

                <strong>
                  {stats.mediumRisk}
                </strong>
              </div>
            </div>

            <div className="escalation-stat-card">
              <div className="escalation-stat-icon purple">
                <CircleDollarSign size={19} />
              </div>

              <div>
                <span>Revenue At Risk</span>

                <strong>
                  ₹{formatAmount(stats.revenue)}
                </strong>
              </div>
            </div>
          </div>

          {/* WORKSPACE */}
          <div className="escalation-workspace">
            {/* QUEUE */}
            <section className="escalation-queue">
              <div className="escalation-section-heading">
                <div>
                  <h2>Approval Queue</h2>

                  <p>
                    Recovery actions waiting for
                    human review
                  </p>
                </div>

                <span className="escalation-count">
                  {escalations.length} pending
                </span>
              </div>

              <div className="escalation-list">
                {escalations.length === 0 ? (
                  <div className="escalation-empty">
                    <CheckCircle2 size={40} />

                    <h3>
                      No pending escalations
                    </h3>

                    <p>
                      All recovery decisions are
                      currently within policy or
                      already reviewed.
                    </p>

                    <button
                      onClick={() =>
                        loadEscalations(false)
                      }
                    >
                      <RefreshCw size={15} />
                      Refresh Queue
                    </button>
                  </div>
                ) : (
                  escalations.map((item) => {
                    const customer =
                      item.customerId;

                    return (
                      <button
                        key={item._id}
                        className={`escalation-item ${
                          selectedEscalation?._id ===
                          item._id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedEscalation(
                            item
                          );

                          setError(null);
                          setSuccess(null);
                        }}
                      >
                        <div className="escalation-avatar">
                          {customer?.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "C"}
                        </div>

                        <div className="escalation-item-info">
                          <strong>
                            {customer?.name ||
                              "Unknown Customer"}
                          </strong>

                          <span>
                            ₹
                            {formatAmount(
                              item.revenueAtRisk
                            )}{" "}
                            at risk
                          </span>
                        </div>

                        <div
                          className={`escalation-risk ${getRiskClass(
                            item.riskLevel
                          )}`}
                        >
                          {item.riskLevel || "LOW"}
                        </div>

                        <div className="escalation-item-arrow">
                          <ArrowRight size={15} />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            {/* REVIEW PANEL */}
            <section className="escalation-review">
              {!selectedEscalation ? (
                <div className="escalation-empty">
                  <ShieldCheck size={45} />

                  <h3>
                    No escalation selected
                  </h3>

                  <p>
                    Select an escalation from
                    the approval queue to review
                    the AI decision.
                  </p>
                </div>
              ) : (
                <>
                  {/* HEADER */}
                  <div className="review-header">
                    <div>
                      <span className="review-label">
                        HUMAN REVIEW
                      </span>

                      <h2>
                        Recovery Approval
                      </h2>

                      <p>
                        Case ID:{" "}
                        <strong>
                          {selectedEscalation._id}
                        </strong>
                      </p>
                    </div>

                    <div
                      className={`review-risk ${getRiskClass(
                        selectedEscalation.riskLevel
                      )}`}
                    >
                      {getRiskIcon(
                        selectedEscalation.riskLevel
                      )}

                      {selectedEscalation.riskLevel ||
                        "LOW"}{" "}
                      RISK
                    </div>
                  </div>

                  {/* CUSTOMER */}
                  <div className="review-card">
                    <div className="review-card-title">
                      <UserCheck size={17} />
                      Customer
                    </div>

                    <div className="customer-review">
                      <div className="customer-review-avatar">
                        {selectedEscalation.customerId
                          ?.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "C"}
                      </div>

                      <div>
                        <strong>
                          {selectedEscalation
                            .customerId
                            ?.name ||
                            "Unknown Customer"}
                        </strong>

                        <span>
                          {selectedEscalation
                            .customerId
                            ?.email ||
                            "No email available"}
                        </span>

                        {selectedEscalation
                          .customerId
                          ?.phone && (
                          <small>
                            {
                              selectedEscalation
                                .customerId
                                .phone
                            }
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* REVENUE */}
                  <div className="review-money-card">
                    <div>
                      <span>
                        Revenue At Risk
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          selectedEscalation.revenueAtRisk
                        )}
                      </strong>
                    </div>

                    <div className="review-money-divider" />

                    <div>
                      <span>Risk Score</span>

                      <strong>
                        {
                          selectedEscalation.riskScore
                        }

                        <small>/100</small>
                      </strong>
                    </div>

                    <div className="review-money-divider" />

                    <div>
                      <span>Attempts</span>

                      <strong>
                        {
                          selectedEscalation.attemptCount ||
                          0
                        }

                        <small>/3</small>
                      </strong>
                    </div>
                  </div>

                  {/* TRANSACTION */}
                  <div className="review-card">
                    <div className="review-card-title">
                      <CircleDollarSign size={17} />
                      Transaction
                    </div>

                    <div className="transaction-grid">
                      <div>
                        <span>Amount</span>

                        <strong>
                          ₹
                          {formatAmount(
                            selectedEscalation
                              .transactionId
                              ?.amount
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Payment Method
                        </span>

                        <strong>
                          {selectedEscalation
                            .transactionId
                            ?.paymentMethod ||
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Status</span>

                        <strong>
                          {selectedEscalation
                            .transactionId
                            ?.status ||
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Failure Reason
                        </span>

                        <strong>
                          {selectedEscalation
                            .transactionId
                            ?.failureReason ||
                            "Not specified"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* AI DECISION */}
                  <div className="review-card ai-review-card">
                    <div className="review-card-title">
                      <BrainCircuit size={17} />
                      AI Decision
                    </div>

                    <div className="ai-review-content">
                      <div className="ai-review-row">
                        <span>Root Cause</span>

                        <strong>
                          {selectedEscalation
                            .rootCause ||
                            "Not specified"}
                        </strong>
                      </div>

                      <div className="ai-review-row">
                        <span>
                          Recommended Action
                        </span>

                        <strong>
                          {selectedEscalation
                            .recommendedAction ||
                            selectedEscalation
                              .agentDecision
                              ?.decision ||
                            "Not specified"}
                        </strong>
                      </div>

                      {selectedEscalation
                        .agentDecision
                        ?.reason && (
                        <div className="ai-reason">
                          <span>
                            Agent Reason
                          </span>

                          <p>
                            {
                              selectedEscalation
                                .agentDecision
                                .reason
                            }
                          </p>
                        </div>
                      )}

                      {selectedEscalation
                        .agentDecision
                        ?.confidence !==
                        undefined && (
                        <div className="ai-confidence">
                          <div>
                            <span>
                              AI Confidence
                            </span>

                            <strong>
                              {Math.round(
                                selectedEscalation
                                  .agentDecision
                                  .confidence *
                                  100
                              )}
                              %
                            </strong>
                          </div>

                          <div className="ai-confidence-bar">
                            <div
                              style={{
                                width: `${
                                  selectedEscalation
                                    .agentDecision
                                    .confidence *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ESCALATION REASON */}
                  <div className="escalation-reason-card">
                    <div className="escalation-reason-icon">
                      <AlertTriangle size={19} />
                    </div>

                    <div>
                      <span>
                        WHY HUMAN APPROVAL IS REQUIRED
                      </span>

                      <strong>
                        {selectedEscalation
                          .escalationReason ||
                          "Recovery action requires human review."}
                      </strong>
                    </div>
                  </div>

                  {/* SAFETY */}
                  <div className="human-gate-card">
                    <div className="human-gate-icon">
                      <ShieldCheck size={21} />
                    </div>

                    <div>
                      <strong>
                        Human Approval Gate
                      </strong>

                      <p>
                        Approving this case only
                        permits the bounded recovery
                        action. The recovery executor
                        still enforces amount and
                        attempt limits.
                      </p>
                    </div>

                    <span>PROTECTED</span>
                  </div>

                  {/* ACTIONS */}
                  <div className="review-actions">
                    <div>
                      <span>Current Status</span>

                      <strong>
                        {formatStatus(
                          selectedEscalation.status
                        )}
                      </strong>
                    </div>

                    <div className="review-action-buttons">
                      <button
                        className="reject-escalation-button"
                        onClick={handleReject}
                        disabled={processing}
                      >
                        {processing ? (
                          <RefreshCw
                            size={16}
                            className="spin"
                          />
                        ) : (
                          <XCircle size={16} />
                        )}

                        Reject
                      </button>

                      <button
                        className="approve-escalation-button"
                        onClick={handleApprove}
                        disabled={processing}
                      >
                        {processing ? (
                          <RefreshCw
                            size={16}
                            className="spin"
                          />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}

                        Approve Recovery
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Escalations;