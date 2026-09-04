import { useEffect, useMemo, useState } from "react";

import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Activity,
  Zap,
  RefreshCw,
  XCircle,
  CircleDollarSign,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  getAgentCases,
  analyzeAgentCase,
  executeAgentRecovery,
} from "../services/agentApi";

function AIRecoveryAgent() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [executing, setExecuting] = useState(false);

  const [executionResult, setExecutionResult] = useState(null);
  const [error, setError] = useState(null);

  //LOAD CASES
  const loadCases = async (preserveSelection = true) => {
    try {
      setLoading(true);
      setError(null);

      const result = await getAgentCases();

      if (!result.success) {
        setError(
          result.message || "Failed to load AI agent cases"
        );
        return;
      }

      const data = result.data || [];

      setCases(data);

      setSelectedCase((currentSelected) => {
        //Use the fresh version returned from the backend.
        if (preserveSelection && currentSelected?._id) {
          const freshCase = data.find(
            (item) => item._id === currentSelected._id
          );

          if (freshCase) {
            return freshCase;
          }
        }

        //Prefer an analyzed or recovering case.
        const firstUsefulCase = data.find(
          (item) =>
            item.status === "recovering" ||
            item.status === "awaiting_approval" ||
            item.agentDecision
        );

        return firstUsefulCase || data[0] || null;
      });
    } catch (err) {
      console.error("AI Agent loading error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to connect to recovery service"
      );
    } finally {
      setLoading(false);
    }
  };

  //INITIAL LOAD
  useEffect(() => {
    loadCases(false);
  }, []);

  //STATISTICS
  const stats = useMemo(() => {
    const analyzed = cases.filter(
      (item) => item.agentDecision
    ).length;

    const awaitingApproval = cases.filter(
      (item) =>
        item.status === "awaiting_approval" ||
        item.agentDecision?.requiresApproval === true
    ).length;

    const recovered = cases.filter(
      (item) => item.status === "recovered"
    ).length;

    const active = cases.filter(
      (item) =>
        ["diagnosing", "recovering"].includes(item.status)
    ).length;

    return {
      total: cases.length,
      analyzed,
      awaitingApproval,
      recovered,
      active,
    };
  }, [cases]);

  //ANALYZE WITH AI
  const handleAnalyze = async () => {
    if (!selectedCase?._id) {
      setError("No recovery case selected");
      return;
    }

    const caseId = selectedCase._id;

    setAnalyzing(true);
    setError(null);
    setExecutionResult(null);

    //HARD FRONTEND TIMEOUT
    const timer = setTimeout(() => {
      setAnalyzing(false);

      setError(
        "AI diagnosis took longer than 60 seconds. Please try again."
      );

      setSelectedCase((current) =>
        current
          ? {
              ...current,
              status: "detected",
            }
          : current
      );

      setCases((current) =>
        current.map((item) =>
          item._id === caseId
            ? {
                ...item,
                status: "detected",
              }
            : item
        )
      );
    }, 60000);

    try {
      const result = await analyzeAgentCase(caseId);

      clearTimeout(timer);

      setAnalyzing(false);

      if (!result?.success) {
        setError(
          result?.message || "AI diagnosis failed"
        );
        return;
      }

      const updatedCase = result.data?.recoveryCase;

      if (updatedCase) {
        setSelectedCase(updatedCase);

        setCases((current) =>
          current.map((item) =>
            item._id === updatedCase._id
              ? updatedCase
              : item
          )
        );
      }
    } catch (err) {
      clearTimeout(timer);

      console.error("ANALYSIS ERROR:", err);
      console.error("SERVER RESPONSE:", err.response?.data);

      setAnalyzing(false);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "AI diagnosis failed"
      );
    }
  };

  //EXECUTE RECOVERY
  const handleExecute = async () => {
    if (!selectedCase?._id) {
      setError("No recovery case selected");
      return;
    }

    //Execution is allowed only when the backend case is recovering.
    if (selectedCase.status !== "recovering") {
      setError(
        `Recovery cannot be executed while case status is "${formatStatus(
          selectedCase.status
        )}".`
      );
      return;
    }

    //AI decision must exist.
    if (!selectedCase.agentDecision) {
      setError(
        "AI analysis must be completed before recovery execution."
      );
      return;
    }

    //Approval gate.
    if (
      selectedCase.agentDecision?.requiresApproval === true
    ) {
      setError(
        "Human approval is required before recovery execution."
      );
      return;
    }

    //Prevent duplicate clicks.
    if (executing) {
      return;
    }

    try {
      setExecuting(true);
      setError(null);
      setExecutionResult(null);

      console.log("EXECUTE RECOVERY CLICKED");
      console.log("Case ID:", selectedCase._id);
      console.log("Case status:", selectedCase.status);

      const result = await executeAgentRecovery(
        selectedCase._id
      );

      console.log("EXECUTION RESPONSE:", result);

      if (!result.success) {
        setError(
          result.message ||
            result.error ||
            "Recovery execution failed"
        );
        return;
      }

      //Backend returns the RecoveryAttempt.
      const attempt = result.data?.attempt || null;
      const paymentLink = attempt?.paymentLinkUrl || null;

      console.log("Payment Link:", paymentLink);

      setExecutionResult({
        success: true,
        message:
          result.message ||
          "Recovery action executed successfully",
        paymentLink,
        attempt,
      });

      //Refresh from backend so the old recovering state is not retained.
      await loadCases(true);
    } catch (err) {
      console.error("Recovery execution error:", err);
      console.error("Response:", err.response?.data);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Recovery execution failed"
      );

      //Refresh because the backend may have changed the case state.
      await loadCases(true);
    } finally {
      setExecuting(false);
    }
  };

  //HELPERS
  const getRiskClass = (risk) => {
    return String(risk || "LOW").toLowerCase();
  };

  const getStatusClass = (status) => {
    return String(status || "detected")
      .toLowerCase()
      .replaceAll("_", "-");
  };

  const formatStatus = (status) => {
    if (!status) {
      return "Detected";
    }

    return status
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN");
  };

  //BUTTON STATE
  const getActionButton = () => {
    if (!selectedCase) {
      return null;
    }

    //AI currently diagnosing.
    if (
      analyzing ||
      selectedCase.status === "diagnosing"
    ) {
      return {
        text: "AI Diagnosing...",
        icon: (
          <RefreshCw
            size={16}
            className="spin"
          />
        ),
        disabled: true,
        action: null,
      };
    }

    //Human approval.
    if (
      selectedCase.status === "awaiting_approval" ||
      selectedCase.agentDecision?.requiresApproval === true
    ) {
      return {
        text: "Approval Required",
        icon: <Clock3 size={16} />,
        disabled: true,
        action: null,
      };
    }

    //Case has not been analyzed.
    if (
      !selectedCase.agentDecision &&
      ["detected", "failed"].includes(selectedCase.status)
    ) {
      return {
        text: "Analyze with AI",
        icon: <BrainCircuit size={16} />,
        disabled: false,
        action: handleAnalyze,
      };
    }

    //AI has allowed recovery.
    if (selectedCase.status === "recovering") {
      return {
        text: executing
          ? "Executing..."
          : "Execute Recovery",
        icon: executing ? (
          <RefreshCw
            size={16}
            className="spin"
          />
        ) : (
          <Zap size={16} />
        ),
        disabled: executing,
        action: handleExecute,
      };
    }

    //Already recovered.
    if (selectedCase.status === "recovered") {
      return {
        text: "Recovered",
        icon: <CheckCircle2 size={16} />,
        disabled: true,
        action: null,
      };
    }

    //Stopped.
    if (selectedCase.status === "stopped") {
      return {
        text: "Recovery Stopped",
        icon: <XCircle size={16} />,
        disabled: true,
        action: null,
      };
    }

    //Failed.
    if (selectedCase.status === "failed") {
      return {
        text: "Retry AI Analysis",
        icon: <RefreshCw size={16} />,
        disabled: false,
        action: handleAnalyze,
      };
    }

    return {
      text: "Analyze with AI",
      icon: <BrainCircuit size={16} />,
      disabled: false,
      action: handleAnalyze,
    };
  };

  //LOADING STATE
  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar />

        <div className="main-area">
          <Topbar />

          <div className="agent-loading">
            <RefreshCw
              size={28}
              className="spin"
            />

            <span>
              Loading AI Recovery Agent...
            </span>
          </div>
        </div>
      </div>
    );
  }

  //ERROR STATE
  if (error && !selectedCase) {
    return (
      <div className="app-shell">
        <Sidebar />

        <div className="main-area">
          <Topbar />

          <div className="agent-error">
            <XCircle size={32} />

            <h2>
              Agent unavailable
            </h2>

            <p>{error}</p>

            <button
              onClick={() =>
                loadCases(false)
              }
            >
              <RefreshCw size={17} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const decision = selectedCase?.agentDecision;
  const actionButton = getActionButton();

  //MAIN UI
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <section className="agent-page">
          {/* HEADER */}
          <div className="agent-header">
            <div>
              <div className="eyebrow">
                <Bot size={15} />
                AUTONOMOUS RECOVERY
              </div>

              <h1>
                AI Recovery Agent
              </h1>

              <p>
                Detect, diagnose and recover
                at-risk revenue with bounded
                AI decisions.
              </p>
            </div>

            <div className="agent-live">
              <span className="live-dot"></span>

              <div>
                <strong>
                  Agent Online
                </strong>

                <small>
                  Monitoring recovery cases
                </small>
              </div>

              <button
                className="refresh-agent"
                onClick={() =>
                  loadCases(true)
                }
                disabled={
                  loading ||
                  analyzing ||
                  executing
                }
              >
                <RefreshCw
                  size={17}
                  className={
                    loading
                      ? "spin"
                      : ""
                  }
                />
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="agent-error">
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

          {/* PIPELINE */}
          <div className="agent-pipeline">
            <div className="pipeline-step completed">
              <div className="pipeline-icon">
                <Activity size={18} />
              </div>

              <div>
                <strong>
                  Detect
                </strong>

                <span>
                  Revenue at risk
                </span>
              </div>
            </div>

            <ArrowRight className="pipeline-arrow" />

            <div
              className={`pipeline-step ${
                selectedCase?.status ===
                "diagnosing"
                  ? "active"
                  : selectedCase?.agentDecision
                  ? "completed"
                  : ""
              }`}
            >
              <div className="pipeline-icon">
                <BrainCircuit size={18} />
              </div>

              <div>
                <strong>
                  Diagnose
                </strong>

                <span>
                  Root cause analysis
                </span>
              </div>
            </div>

            <ArrowRight className="pipeline-arrow" />

            <div
              className={`pipeline-step ${
                selectedCase?.agentDecision
                  ? "completed"
                  : ""
              }`}
            >
              <div className="pipeline-icon">
                <Zap size={18} />
              </div>

              <div>
                <strong>
                  Decide
                </strong>

                <span>
                  Bounded intervention
                </span>
              </div>
            </div>

            <ArrowRight className="pipeline-arrow" />

            <div
              className={`pipeline-step ${
                selectedCase?.status ===
                  "recovering" ||
                selectedCase?.status ===
                  "recovered"
                  ? "active"
                  : ""
              }`}
            >
              <div className="pipeline-icon">
                <CircleDollarSign size={18} />
              </div>

              <div>
                <strong>
                  Recover
                </strong>

                <span>
                  Measure outcome
                </span>
              </div>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="agent-stats">
            <div className="agent-stat">
              <div className="stat-icon purple">
                <BrainCircuit size={19} />
              </div>

              <div>
                <span>
                  Cases Analyzed
                </span>

                <strong>
                  {stats.analyzed}
                </strong>
              </div>
            </div>

            <div className="agent-stat">
              <div className="stat-icon blue">
                <Activity size={19} />
              </div>

              <div>
                <span>
                  Active Decisions
                </span>

                <strong>
                  {stats.active}
                </strong>
              </div>
            </div>

            <div className="agent-stat">
              <div className="stat-icon orange">
                <Clock3 size={19} />
              </div>

              <div>
                <span>
                  Approval Required
                </span>

                <strong>
                  {stats.awaitingApproval}
                </strong>
              </div>
            </div>

            <div className="agent-stat">
              <div className="stat-icon green">
                <CheckCircle2 size={19} />
              </div>

              <div>
                <span>
                  Recovered Cases
                </span>

                <strong>
                  {stats.recovered}
                </strong>
              </div>
            </div>
          </div>

          {/* WORKSPACE */}
          <div className="agent-workspace">
            {/* CASE LIST */}
            <section className="agent-cases">
              <div className="section-heading">
                <div>
                  <h2>
                    Agent Decision Queue
                  </h2>

                  <p>
                    Cases requiring AI diagnosis
                    or recovery action
                  </p>
                </div>

                <span className="case-count">
                  {cases.length} cases
                </span>
              </div>

              <div className="case-list">
                {cases.length === 0 ? (
                  <div className="empty-agent">
                    <Bot size={35} />

                    <h3>
                      No recovery cases
                    </h3>

                    <p>
                      There are currently no
                      recovery cases available.
                    </p>
                  </div>
                ) : (
                  cases.map((item) => {
                    const customer = item.customerId;

                    return (
                      <button
                        key={item._id}
                        className={`agent-case ${
                          selectedCase?._id ===
                          item._id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => {
                          setSelectedCase(item);
                          setError(null);
                          setExecutionResult(null);
                        }}
                      >
                        <div className="case-avatar">
                          {customer?.name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "C"}
                        </div>

                        <div className="case-info">
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
                          className={`mini-risk ${getRiskClass(
                            item.riskLevel
                          )}`}
                        >
                          {item.riskLevel ||
                            "LOW"}
                        </div>

                        <div
                          className={`mini-status ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {formatStatus(
                            item.status
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            {/* DECISION PANEL */}
            <section className="decision-panel">
              {!selectedCase ? (
                <div className="empty-agent">
                  <Bot size={40} />

                  <h3>
                    No recovery case selected
                  </h3>

                  <p>
                    Select a case from the
                    decision queue.
                  </p>
                </div>
              ) : (
                <>
                  {/* HEADER */}
                  <div className="decision-header">
                    <div>
                      <span className="decision-label">
                        AI DECISION
                      </span>

                      <h2>
                        {selectedCase
                          .customerId
                          ?.name ||
                          "Customer"}
                      </h2>

                      <p>
                        Case ID:{" "}
                        <strong>
                          {selectedCase._id}
                        </strong>
                      </p>
                    </div>

                    <div
                      className={`risk-pill ${getRiskClass(
                        selectedCase.riskLevel
                      )}`}
                    >
                      <span></span>

                      {selectedCase.riskLevel ||
                        "LOW"}{" "}
                      RISK
                    </div>
                  </div>

                  {/* MONEY RISK */}
                  <div className="money-risk">
                    <div>
                      <span>
                        Revenue at Risk
                      </span>

                      <strong>
                        ₹
                        {formatAmount(
                          selectedCase.revenueAtRisk
                        )}
                      </strong>
                    </div>

                    <div className="money-divider"></div>

                    <div>
                      <span>
                        Risk Score
                      </span>

                      <strong>
                        {selectedCase.riskScore ||
                          0}

                        <small>
                          /100
                        </small>
                      </strong>
                    </div>
                  </div>

                  {/* DIAGNOSIS */}
                  <div className="decision-section">
                    <div className="section-title">
                      <AlertTriangle
                        size={17}
                      />

                      Diagnosis
                    </div>

                    <div className="diagnosis-box">
                      <span>
                        ROOT CAUSE
                      </span>

                      <strong>
                        {selectedCase.rootCause ||
                          (
                            selectedCase.status ===
                            "diagnosing"
                              ? "AI is analyzing this case..."
                              : "Awaiting diagnosis"
                          )}
                      </strong>
                    </div>
                  </div>

                  {/* AI RECOMMENDATION */}
                  <div className="decision-section">
                    <div className="section-title">
                      <BrainCircuit
                        size={17}
                      />

                      Agent Recommendation
                    </div>

                    <div className="recommendation-box">
                      <div className="recommendation-top">
                        <div className="decision-action-icon">
                          <Zap size={20} />
                        </div>

                        <div>
                          <span>
                            RECOMMENDED ACTION
                          </span>

                          <strong>
                            {decision?.decision ||
                              selectedCase.recommendedAction ||
                              (
                                selectedCase.status ===
                                "diagnosing"
                                  ? "AI_ANALYZING"
                                  : "ANALYZE_CASE"
                              )}
                          </strong>
                        </div>
                      </div>

                      {decision?.reason && (
                        <p>
                          {decision.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* CONFIDENCE + APPROVAL */}
                  <div className="decision-grid">
                    <div className="decision-metric">
                      <span>
                        AI Confidence
                      </span>

                      <strong>
                        {decision?.confidence !==
                        undefined
                          ? `${Math.round(
                              decision.confidence *
                                100
                            )}%`
                          : "—"}
                      </strong>

                      <div className="confidence-bar">
                        <div
                          style={{
                            width: `${
                              decision?.confidence
                                ? decision.confidence *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="decision-metric">
                      <span>
                        Approval Gate
                      </span>

                      <strong>
                        {decision
                          ? decision.requiresApproval
                            ? "Required"
                            : "Not Required"
                          : "Pending"}
                      </strong>

                      <small>
                        {decision
                          ? decision.requiresApproval
                            ? "Human approval before execution"
                            : "Within autonomous policy"
                          : "AI analysis required"}
                      </small>
                    </div>
                  </div>

                  {/* BOUNDED POLICY */}
                  <div className="bounded-policy">
                    <div className="policy-icon">
                      <ShieldCheck
                        size={20}
                      />
                    </div>

                    <div>
                      <strong>
                        Bounded Recovery Policy
                      </strong>

                      <p>
                        Agent actions are
                        restricted by recovery
                        rules, approval gates
                        and stopping conditions.
                      </p>
                    </div>

                    <span className="policy-status">
                      ACTIVE
                    </span>
                  </div>

                  {/* EXECUTION RESULT */}
                  {executionResult?.success && (
                    <div className="recovery-success-box">
                      <div className="recovery-success-header">
                        <div className="recovery-success-icon">
                          ✓
                        </div>

                        <div>
                          <h4>
                            Recovery Action Executed
                          </h4>

                          <p>
                            The AI recovery action was
                            successfully executed.
                          </p>
                        </div>
                      </div>

                      {executionResult.paymentLink && (
                        <div className="payment-link-result">
                          <div>
                            <span>
                              Razorpay Payment Link
                            </span>

                            <strong>
                              Payment link created successfully
                            </strong>
                          </div>

                          <a
                            href={
                              executionResult.paymentLink
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="open-payment-link"
                          >
                            Open Payment Link →
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ACTION FOOTER */}
                  <div className="decision-footer">
                    <div>
                      <span>
                        Current Status
                      </span>

                      <strong>
                        {formatStatus(
                          selectedCase.status
                        )}
                      </strong>
                    </div>

                    {/* DETECTED */}
                    {selectedCase.status === "detected" && (
                      <button
                        className="agent-action-button"
                        onClick={handleAnalyze}
                        disabled={
                          analyzing ||
                          executing
                        }
                      >
                        {analyzing ? (
                          <>
                            <RefreshCw
                              size={16}
                              className="spin"
                            />

                            AI Diagnosing...
                          </>
                        ) : (
                          <>
                            <BrainCircuit
                              size={16}
                            />

                            Analyze with AI
                          </>
                        )}
                      </button>
                    )}

                    {/* DIAGNOSING */}
                    {selectedCase.status === "diagnosing" && (
                      <button
                        className="agent-action-button"
                        disabled
                      >
                        <RefreshCw
                          size={16}
                          className="spin"
                        />

                        AI Diagnosing...
                      </button>
                    )}

                    {/* RECOVERING */}
                    {selectedCase.status === "recovering" && (
                      <button
                        className="agent-action-button"
                        onClick={handleExecute}
                        disabled={
                          executing ||
                          analyzing
                        }
                      >
                        {executing ? (
                          <>
                            <RefreshCw
                              size={16}
                              className="spin"
                            />

                            Executing...
                          </>
                        ) : (
                          <>
                            <Zap size={16} />

                            Execute Recovery
                          </>
                        )}
                      </button>
                    )}

                    {/* APPROVAL REQUIRED */}
                    {selectedCase.status === "awaiting_approval" && (
                      <button
                        className="agent-action-button"
                        disabled
                      >
                        <Clock3 size={16} />

                        Approval Required
                      </button>
                    )}

                    {/* STOPPED */}
                    {selectedCase.status === "stopped" && (
                      <button
                        className="agent-action-button"
                        disabled
                      >
                        <ShieldCheck size={16} />

                        Recovery Stopped
                      </button>
                    )}

                    {/* FAILED */}
                    {selectedCase.status === "failed" && (
                      <button
                        className="agent-action-button"
                        onClick={handleAnalyze}
                        disabled={
                          analyzing ||
                          executing
                        }
                      >
                        {analyzing ? (
                          <>
                            <RefreshCw
                              size={16}
                              className="spin"
                            />

                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={16} />

                            Retry Diagnosis
                          </>
                        )}
                      </button>
                    )}

                    {/* RECOVERED */}
                    {selectedCase.status === "recovered" && (
                      <button
                        className="agent-action-button"
                        disabled
                      >
                        <CheckCircle2 size={16} />

                        Recovery Complete
                      </button>
                    )}
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

export default AIRecoveryAgent;