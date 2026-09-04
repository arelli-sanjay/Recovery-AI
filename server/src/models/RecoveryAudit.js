import mongoose from "mongoose";

const recoveryAuditSchema = new mongoose.Schema(
  {
    recoveryCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecoveryCase",
      required: true,
    },

    event: {
      type: String,
      enum: [
        "CASE_DETECTED",
        "AI_ANALYZED",
        "POLICY_ALLOWED",
        "POLICY_ESCALATED",
        "POLICY_STOPPED",
        "PAYMENT_LINK_CREATED",
        "PAYMENT_SUCCESS",
        "PAYMENT_FAILED",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "RecoveryAudit",
  recoveryAuditSchema
);