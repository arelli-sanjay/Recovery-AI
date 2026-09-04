import Transaction from "../models/Transaction.js";
import RecoveryCase from "../models/RecoveryCase.js";
import Customer from "../models/Customer.js";
import RecoveryAudit from "../models/RecoveryAudit.js";

import { analyzeRecoveryCase } from "../services/agent/recoveryAgent.js";
import { validateDecision } from "../services/agent/decisionValidator.js";
import { evaluateRecoveryPolicy } from "../services/recovery/policyEngine.js";

export const analyzeCase = async (req, res) => {
  let recoveryCase = null;

  try {
    console.log("Case ID:", req.params.id);

    // FIND RECOVERY CASE
    recoveryCase = await RecoveryCase.findById(req.params.id);

    if (!recoveryCase) {
      return res.status(404).json({
        success: false,
        message: "Recovery case not found",
      });
    }

    console.log("Current status:", recoveryCase.status);

    // FIND TRANSACTION
    const transaction = await Transaction.findById(
      recoveryCase.transactionId
    );

    // FIND CUSTOMER
    const customer = await Customer.findById(
      recoveryCase.customerId
    );

    if (!transaction || !customer) {
      return res.status(404).json({
        success: false,
        message: "Transaction or customer information missing",
      });
    }

    console.log("Amount:", transaction.amount);
    console.log("Status:", transaction.status);
    console.log("Customer:", customer.name);

    if (
      ["recovering", "recovered", "awaiting_approval"].includes(
        recoveryCase.status
      )
    ) {
      return res.status(200).json({
        success: true,
        message: "Case has already been analyzed",
        data: {
          recoveryCase,
          decision: recoveryCase.agentDecision,
          policyDecision: null,
        },
      });
    }

    // SET DIAGNOSING
    recoveryCase.status = "diagnosing";
    await recoveryCase.save();

    // AI ANALYSIS
    let decision;
    try {
      decision = await Promise.race([
        analyzeRecoveryCase({
          transaction,
          customer,
          recoveryCase,
        }),

        new Promise((_, reject) =>
          setTimeout(() => {
            reject(
              new Error(
                "AI analysis timed out after 30 seconds"
              )
            );
          }, 30000)
        ),
      ]);
    } catch (aiError) {
      console.error("\n GEMINI ANALYSIS FAILED");
      console.error(aiError);

      recoveryCase.status = "failed";
      recoveryCase.escalationReason =
        `AI analysis failed: ${aiError.message}`;

      await recoveryCase.save();

      // AUDIT LOG
      try {
        await RecoveryAudit.create({
          recoveryCaseId: recoveryCase._id,
          event: "POLICY_STOPPED",
          description:
            `AI diagnosis failed. Recovery execution stopped: ${aiError.message}`,
          amount: recoveryCase.revenueAtRisk,
          metadata: {
            reason: "AI_ANALYSIS_FAILED",
            error: aiError.message,
          },
        });
      } catch (auditError) {
        console.error(
          "Audit creation failed:",
          auditError.message
        );
      }

      return res.status(500).json({
        success: false,
        message: "AI diagnosis failed",
        error: aiError.message,
        data: {
          recoveryCase,
        },
      });
    }

    console.log(
      "AI Decision:",
      JSON.stringify(decision, null, 2)
    );

    // VALIDATE AI DECISION
    try {
      validateDecision(decision);
    } catch (validationError) {
      console.error(
        "AI decision validation failed:",
        validationError
      );

      recoveryCase.status = "failed";
      recoveryCase.escalationReason =
        `Invalid AI decision: ${validationError.message}`;

      await recoveryCase.save();

      return res.status(500).json({
        success: false,
        message: "AI returned an invalid decision",
        error: validationError.message,
      });
    }

    // POLICY ENGINE
    const policyDecision = evaluateRecoveryPolicy({
      recoveryCase,
      aiDecision: decision,
    });

    console.log(
      "Policy decision:",
      JSON.stringify(policyDecision, null, 2)
    );

    // SAVE AI DECISION
    recoveryCase.rootCause =
      decision.rootCause || null;

    recoveryCase.recommendedAction =
      decision.decision || null;

    recoveryCase.agentDecision =
      decision;

    // APPLY POLICY RESULT
    if (policyDecision.decision === "ESCALATE") {
      recoveryCase.status = "awaiting_approval";

      recoveryCase.escalationReason =
        policyDecision.reasons?.join("; ") ||
        "Human approval required";

      console.log(
        "Policy result → awaiting_approval"
      );
    }

    else if (policyDecision.decision === "STOP") {
      recoveryCase.status = "stopped";

      recoveryCase.escalationReason =
        policyDecision.reasons?.join("; ") ||
        "Recovery stopped by policy";

      console.log(
        " Policy result → stopped"
      );
    }

    else if (policyDecision.decision === "ALLOW") {
      recoveryCase.status = "recovering";

      recoveryCase.escalationReason = null;

      console.log(
        "Policy result → recovering"
      );
    }

    else {
      recoveryCase.status = "failed";

      recoveryCase.escalationReason =
        "Unknown policy decision";

      console.error(
        "Unknown policy decision:",
        policyDecision.decision
      );
    }

    await recoveryCase.save();

    console.log(
      " Recovery case saved with status:",
      recoveryCase.status
    );

    // AUDIT: AI ANALYZED
    try {
      await RecoveryAudit.create({
        recoveryCaseId: recoveryCase._id,
        event: "AI_ANALYZED",
        description:
          `AI diagnosed the case as "${decision.rootCause}" and recommended "${decision.decision}".`,
        amount: recoveryCase.revenueAtRisk,
        metadata: {
          confidence: decision.confidence,
          riskLevel: decision.riskLevel,
          decision: decision.decision,
          rootCause: decision.rootCause,
        },
      });

      console.log("AI_ANALYZED audit created");
    } catch (auditError) {
      console.error(
        "AI_ANALYZED audit failed:",
        auditError.message
      );
    }

    // AUDIT: POLICY RESULT
    try {
      let auditEvent;

      if (policyDecision.decision === "ALLOW") {
        auditEvent = "POLICY_ALLOWED";
      }

      if (policyDecision.decision === "ESCALATE") {
        auditEvent = "POLICY_ESCALATED";
      }

      if (policyDecision.decision === "STOP") {
        auditEvent = "POLICY_STOPPED";
      }

      if (auditEvent) {
        await RecoveryAudit.create({
          recoveryCaseId: recoveryCase._id,
          event: auditEvent,
          description:
            policyDecision.reasons?.join("; ") ||
            `Recovery policy decision: ${policyDecision.decision}`,
          amount: recoveryCase.revenueAtRisk,
          metadata: {
            policyDecision: policyDecision.decision,
            reasons: policyDecision.reasons || [],
          },
        });

        console.log(
          `${auditEvent} audit created`
        );
      }
    } catch (auditError) {
      console.error(
        "Policy audit failed:",
        auditError.message
      );
    }

    // FINAL RESPONSE
    console.log("AI ANALYSIS COMPLETED");
    console.log("Final status:", recoveryCase.status);

    return res.status(200).json({
      success: true,
      message: "AI recovery analysis completed",
      data: {
        recoveryCase,
        decision,
        policyDecision,
      },
    });

  } catch (error) {
    console.error("\n");
    console.error("AI RECOVERY CONTROLLER ERROR");
    console.error("");
    console.error(error);

    // IMPORTANT FALLBACK
    if (recoveryCase) {
      try {
        recoveryCase.status = "failed";

        recoveryCase.escalationReason =
          `AI recovery analysis failed: ${error.message}`;

        await recoveryCase.save();

        console.log(
          "Case moved from diagnosing → failed"
        );
      } catch (saveError) {
        console.error(
          "Could not update recovery case:",
          saveError
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "AI recovery analysis failed",
      error: error.message,
    });
  }
};