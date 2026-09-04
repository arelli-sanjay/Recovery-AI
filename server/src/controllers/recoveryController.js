import Transaction from "../models/Transaction.js";
import RecoveryCase from "../models/RecoveryCase.js";
import Customer from "../models/Customer.js";
import {executePaymentLinkRecovery,} from "../services/recovery/recoveryExecutor.js";

export const executeRecovery = async (req, res) => {
  try {
    const recoveryCase =
      await RecoveryCase.findById(req.params.id);

    if (!recoveryCase) {
      return res.status(404).json({
        success: false,
        message: "Recovery case not found",
      });
    }

    const transaction =
      await Transaction.findById(
        recoveryCase.transactionId
      );

    const customer =
      await Customer.findById(
        recoveryCase.customerId
      );

    if (!transaction || !customer) {
      return res.status(404).json({
        success: false,
        message:
          "Transaction or customer information missing",
      });
    }

    const result =
      await executePaymentLinkRecovery({
        recoveryCase,
        transaction,
        customer,
      });

    return res.status(200).json({
      success: true,
      message:
        result.alreadyExists
          ? "Recovery payment link already exists"
          : "Recovery payment link created",
      data: result,
    });

  } catch (error) {
    console.error(
      "Recovery execution error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Recovery execution failed",
      error: error.message,
    });
  }
};

export const getRecoveryCases = async (req, res) => {
  try {
    const cases = await RecoveryCase.find()
      .populate(
        "customerId",
        "name email phone"
      )
      .populate(
        "transactionId",
        "amount currency status failureReason paymentMethod createdAt"
      )
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: cases.length,
      data: cases,
    });
  } catch (error) {
    console.error(
      "Recovery cases error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load recovery cases",
    });
  }
};

export const getRecoveryCaseById = async (
  req,
  res
) => {
  try {
    const recoveryCase =
      await RecoveryCase.findById(req.params.id)
        .populate(
          "customerId",
          "name email phone totalSuccessfulPayments totalFailedPayments lifetimeValue"
        )
        .populate(
          "transactionId",
          "amount currency status failureReason paymentMethod razorpayOrderId razorpayPaymentId createdAt"
        );

    if (!recoveryCase) {
      return res.status(404).json({
        success: false,
        message: "Recovery case not found",
      });
    }

    res.status(200).json({
      success: true,
      data: recoveryCase,
    });
  } catch (error) {
    console.error(
      "Recovery case details error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load recovery case",
    });
  }
};

