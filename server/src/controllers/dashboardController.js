import Transaction from "../models/Transaction.js";
import RecoveryCase from "../models/RecoveryCase.js";
import RecoveryAudit from "../models/RecoveryAudit.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const [
      totalTransactions,
      atRiskTransactions,
      highRiskCases,
      mediumRiskCases,
      lowRiskCases,
      recoveredCases,
      revenueAtRiskResult,
      revenueRecoveredResult,
      recoveryPipeline,
      recoveryReasons,
      recentCases,
      recentActivity,
    ] = await Promise.all([
      
      Transaction.countDocuments(),

      // AT-RISK CASES & LEVELS
      RecoveryCase.countDocuments({
        status: {
          $nin: ["recovered", "stopped"],
        },
      }),

      RecoveryCase.countDocuments({
        riskLevel: "HIGH",
      }),

      RecoveryCase.countDocuments({
        riskLevel: "MEDIUM",
      }),

      RecoveryCase.countDocuments({
        riskLevel: "LOW",
      }),

      
      // RECOVERED CASES
      RecoveryCase.countDocuments({
        status: "recovered",
      }),

      // REVENUE AT RISK
      RecoveryCase.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$revenueAtRisk",
            },
          },
        },
      ]),

      // REVENUE RECOVERED
      RecoveryCase.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$revenueRecovered",
            },
          },
        },
      ]),

      // RECOVERY PIPELINE
      RecoveryCase.aggregate([
        {
          $group: {
            _id: "$status",
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      // TOP RECOVERY REASONS
      RecoveryCase.aggregate([
        {
          $match: {
            rootCause: {
              $ne: null,
            },
          },
        },
        {
          $group: {
            _id: "$rootCause",
            count: {
              $sum: 1,
            },
            amount: {
              $sum: "$revenueAtRisk",
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
        {
          $limit: 5,
        },
      ]),

      // RECENT RECOVERY CASES
      RecoveryCase.find()
        .populate(
          "customerId",
          "name email"
        )
        .populate(
          "transactionId",
          "amount currency status failureReason paymentMethod createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5),

      // RECOVERY ACTIVITY
      RecoveryAudit.find()
        .populate(
          "recoveryCaseId",
          "status revenueAtRisk revenueRecovered"
        )
        .sort({
          createdAt: -1,
        })
        .limit(8),
    ]);

    // CALCULATE REVENUE
    const revenueAtRisk =
      revenueAtRiskResult[0]?.total || 0;

    const revenueRecovered =
      revenueRecoveredResult[0]?.total || 0;

    const recoveryRate =
      revenueAtRisk > 0
        ? Number(
            (
              (revenueRecovered /
                revenueAtRisk) *
              100
            ).toFixed(2)
          )
        : 0;

    // FORMAT PIPELINE
    const pipeline = {
      detected: 0,
      diagnosing: 0,
      awaiting_approval: 0,
      recovering: 0,
      recovered: 0,
      failed: 0,
      escalated: 0,
      stopped: 0,
    };

    recoveryPipeline.forEach((item) => {
      if (
        Object.prototype.hasOwnProperty.call(
          pipeline,
          item._id
        )
      ) {
        pipeline[item._id] =
          item.count;
      }
    });

    // RESPONSE
    res.status(200).json({
      success: true,

      data: {
        totalTransactions,
        atRiskTransactions,

        revenueAtRisk,
        revenueRecovered,
        recoveryRate,

        recoveredCases,

        riskDistribution: {
          high: highRiskCases,
          medium: mediumRiskCases,
          low: lowRiskCases,
        },

        pipeline,
        recoveryReasons,
        recentCases,
        recentActivity,
      },
    });
  } catch (error) {
    console.error(
      "Dashboard summary error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load dashboard summary",
      error: error.message,
    });
  }
};