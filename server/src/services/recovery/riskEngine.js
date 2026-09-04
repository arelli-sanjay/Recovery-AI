const calculateRisk = ({ transaction, customer }) => {
  let score = 0;
  const reasons = [];

  if (transaction.status === "failed") {
    score += 40;
    reasons.push("Payment failed");
  }

  if (transaction.status === "abandoned") {
    score += 35;
    reasons.push("Checkout abandoned");
  }

  if (transaction.status === "pending") {
    score += 20;
    reasons.push("Payment still pending");
  }

  if (customer.totalSuccessfulPayments > 0) {
    score += 20;
    reasons.push("Customer has previous successful payments");
  }

  if (transaction.amount >= 5000) {
    score += 20;
    reasons.push("High-value transaction");
  } else if (transaction.amount >= 2000) {
    score += 10;
    reasons.push("Medium-value transaction");
  }

  const riskScore = Math.min(score, 100);

  let riskLevel = "LOW";

  if (riskScore >= 80) {
    riskLevel = "HIGH";
  } else if (riskScore >= 50) {
    riskLevel = "MEDIUM";
  }

  return {
    riskScore,
    riskLevel,
    reasons,
  };
};

export default calculateRisk;