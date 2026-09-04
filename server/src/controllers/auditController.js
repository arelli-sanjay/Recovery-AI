import RecoveryAudit from "../models/RecoveryAudit.js";

// GET ALL AUDIT LOGS
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await RecoveryAudit.find()
      .populate(
        "recoveryCaseId",
        "revenueAtRisk riskScore riskLevel status"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });

  } catch (error) {
    console.error(
      "Audit logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load audit logs",
    });
  }
};

// GET AUDIT LOGS FOR ONE RECOVERY CASE
export const getAuditLogsByCase = async (req, res) => {
  try {
    const logs =
      await RecoveryAudit.find({
        recoveryCaseId: req.params.recoveryCaseId,
      })
        .populate(
          "recoveryCaseId",
          "revenueAtRisk riskScore riskLevel status"
        )
        .sort({
          createdAt: 1,
        });

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });

  } catch (error) {
    console.error(
      "Recovery case audit error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load recovery case audit logs",
    });
  }
};