import mongoose from "mongoose";

const recoveryAttemptSchema = new mongoose.Schema(
  {
    recoveryCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecoveryCase",
      required: true,
    },

    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },

    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    action: {
      type: String,
      enum: [
        "CREATE_PAYMENT_LINK",
        "ESCALATE",
        "STOP",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "INR",
    },

    razorpayPaymentLinkId: {
      type: String,
      default: null,
    },

    paymentLinkUrl: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "success",
        "failed",
        "expired",
      ],
      default: "created",
    },

    failureReason: {
      type: String,
      default: null,
    },

    executedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "RecoveryAttempt",
  recoveryAttemptSchema
);