import mongoose from "mongoose";

const recoveryCaseSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      unique: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    revenueAtRisk: {
      type: Number,
      required: true,
      min: 0,
    },

    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    riskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true,
    },

    rootCause: {
      type: String,
      default: null,
    },

    recommendedAction: {
      type: String,
      default: null,
    },

    agentDecision: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "detected",
        "diagnosing",
        "awaiting_approval",
        "recovering",
        "recovered",
        "failed",
        "escalated",
        "stopped",
      ],
      default: "detected",
    },

    recoveryWindowEndsAt: {
      type: Date,
      default: null,
    },

    attemptCount: {
      type: Number,
      default: 0,
    },

    revenueRecovered: {
      type: Number,
      default: 0,
    },

    escalationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("RecoveryCase", recoveryCaseSchema);