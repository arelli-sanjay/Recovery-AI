const VALID_DECISIONS = [
  "CREATE_PAYMENT_LINK",
  "ESCALATE",
  "STOP",
];

export const validateDecision = (decision) => {
  if (!decision || typeof decision !== "object") {
    throw new Error("Invalid AI decision");
  }

  if (!VALID_DECISIONS.includes(decision.decision)) {
    throw new Error("Unsupported AI decision");
  }

  if (
    typeof decision.confidence !== "number" ||
    decision.confidence < 0 ||
    decision.confidence > 1
  ) {
    throw new Error("Invalid AI confidence");
  }

  if (!decision.rootCause) {
    throw new Error("AI root cause is missing");
  }

  if (!decision.reason) {
    throw new Error("AI reasoning is missing");
  }

  return true;
};