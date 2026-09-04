const POLICY = {
  MAX_PAYMENT_LINK_AMOUNT: 10000,
  MAX_RECOVERY_ATTEMPTS: 3,
  MIN_AI_CONFIDENCE: 0.70,
  ALLOWED_RISK_LEVELS: ["LOW", "MEDIUM"],
};

export const evaluateRecoveryPolicy = ({
  recoveryCase,
  aiDecision,
}) => {
  const reasons = [];

  // 1. Validate AI decision
  if (!aiDecision) {
    return {
      decision: "STOP",
      allowed: false,
      reasons: ["AI decision is missing"],
    };
  }

  // 2. AI confidence check
  if (
    aiDecision.confidence <
    POLICY.MIN_AI_CONFIDENCE
  ) {
    reasons.push(
      `AI confidence ${aiDecision.confidence} is below minimum ${POLICY.MIN_AI_CONFIDENCE}`
    );
  }

  // 3. Risk check
  if (
    !POLICY.ALLOWED_RISK_LEVELS.includes(
      aiDecision.riskLevel
    )
  ) {
    reasons.push(
      `Risk level ${aiDecision.riskLevel} requires escalation`
    );
  }

  // 4. Recovery attempt limit
  if (
    recoveryCase.attemptCount >=
    POLICY.MAX_RECOVERY_ATTEMPTS
  ) {
    reasons.push(
      "Maximum recovery attempts reached"
    );
  }

  // 5. Revenue amount limit
  if (
    recoveryCase.revenueAtRisk >
    POLICY.MAX_PAYMENT_LINK_AMOUNT
  ) {
    reasons.push(
      "Revenue amount exceeds automated recovery limit"
    );
  }

  // 6. AI explicitly says STOP
  if (aiDecision.decision === "STOP") {
    reasons.push(
      "AI recommended stopping recovery"
    );
  }

  // 7. AI explicitly requests escalation
  if (
    aiDecision.decision === "ESCALATE"
  ) {
    reasons.push(
      "AI recommended human escalation"
    );
  }

  // FINAL POLICY DECISION
  if (reasons.length > 0) {
    return {
      decision: "ESCALATE",
      allowed: false,
      reasons,
    };
  }

  if (
    aiDecision.decision ===
    "CREATE_PAYMENT_LINK"
  ) {
    return {
      decision: "ALLOW",
      allowed: true,
      reasons: [
        "Recovery action passed all policy checks",
      ],
    };
  }

  return {
    decision: "STOP",
    allowed: false,
    reasons: [
      "Unsupported recovery action",
    ],
  };
};