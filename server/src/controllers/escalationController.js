import RecoveryCase from "../models/RecoveryCase.js";
import RecoveryAudit from "../models/RecoveryAudit.js";

// GET ESCALATED RECOVERY CASES
export const getEscalations = async (req, res) => {
  try {
    const escalations = await RecoveryCase.find({
      status: "awaiting_approval",
    })
      .populate(
        "customerId",
        "name email phone totalSuccessfulPayments totalFailedPayments lifetimeValue"
      )
      .populate(
        "transactionId",
        "amount currency status failureReason paymentMethod razorpayOrderId razorpayPaymentId createdAt"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: escalations.length,
      data: escalations,
    });
  } catch (error) {
    console.error("Get escalations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load escalations",
      error: error.message,
    });
  }
};

// GET SINGLE ESCALATION
export const getEscalationById = async (req, res) => {
  try {
    const escalation = await RecoveryCase.findOne({
      _id: req.params.id,
      status: "awaiting_approval",
    })
      .populate(
        "customerId",
        "name email phone totalSuccessfulPayments totalFailedPayments lifetimeValue"
      )
      .populate(
        "transactionId",
        "amount currency status failureReason paymentMethod razorpayOrderId razorpayPaymentId createdAt"
      );

    if (!escalation) {
      return res.status(404).json({
        success: false,
        message: "Escalation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: escalation,
    });
  } catch (error) {
    console.error("Get escalation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load escalation",
      error: error.message,
    });
  }
};

// APPROVE ESCALATED RECOVERY
export const approveEscalation = async (req, res) => {
  try {
    const recoveryCase = await RecoveryCase.findById(
      req.params.id
    );

    if (!recoveryCase) {
      return res.status(404).json({
        success: false,
        message: "Recovery case not found",
      });
    }

    // SAFETY CHECK
    if (recoveryCase.status !== "awaiting_approval") {
      return res.status(400).json({
        success: false,
        message:
          `Case cannot be approved from status: ${recoveryCase.status}`,
      });
    }

    // MOVE CASE TO RECOVERY
    recoveryCase.status = "recovering";
    recoveryCase.escalationReason = null;

    await recoveryCase.save();

    // AUDIT LOG
    await RecoveryAudit.create({
      recoveryCaseId: recoveryCase._id,
      event: "POLICY_ALLOWED",
      description:
        "Human approval granted. Recovery action is now permitted.",
      amount: recoveryCase.revenueAtRisk,
      metadata: {
        action: "HUMAN_APPROVAL",
        previousStatus: "awaiting_approval",
        newStatus: "recovering",
      },
    });

    console.log(
      `Escalation approved: ${recoveryCase._id}`
    );

    return res.status(200).json({
      success: true,
      message: "Recovery approved successfully",
      data: recoveryCase,
    });
  } catch (error) {
    console.error("Approve escalation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve recovery",
      error: error.message,
    });
  }
};

// REJECT ESCALATED RECOVERY
export const rejectEscalation = async (req, res) => {
  try {
    const recoveryCase = await RecoveryCase.findById(
      req.params.id
    );

    if (!recoveryCase) {
      return res.status(404).json({
        success: false,
        message: "Recovery case not found",
      });
    }

    // SAFETY CHECK
    if (recoveryCase.status !== "awaiting_approval") {
      return res.status(400).json({
        success: false,
        message:
          `Case cannot be rejected from status: ${recoveryCase.status}`,
      });
    }

    // REJECTION REASON
    const reason =
      req.body?.reason ||
      "Recovery rejected by human reviewer";

    // STOP RECOVERY
    recoveryCase.status = "stopped";
    recoveryCase.escalationReason = reason;

    await recoveryCase.save();

    // AUDIT LOG
    await RecoveryAudit.create({
      recoveryCaseId: recoveryCase._id,
      event: "POLICY_STOPPED",
      description:
        `Recovery rejected by human reviewer: ${reason}`,
      amount: recoveryCase.revenueAtRisk,
      metadata: {
        action: "HUMAN_REJECTION",
        reason,
        previousStatus: "awaiting_approval",
        newStatus: "stopped",
      },
    });

    console.log(
      `Escalation rejected: ${recoveryCase._id}`
    );

    return res.status(200).json({
      success: true,
      message: "Recovery rejected successfully",
      data: recoveryCase,
    });
  } catch (error) {
    console.error("Reject escalation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject recovery",
      error: error.message,
    });
  }
};