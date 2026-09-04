import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import RecoveryCase from "../models/RecoveryCase.js";

import generateDemoTransactions from "../services/recovery/demoDataGenerator.js";
import calculateRisk from "../services/recovery/riskEngine.js";

// SIMULATE TRANSACTIONS
export const simulateTransactions = async (req, res) => {
  try {
    const count = Math.min(
      Number(req.body.count) || 100,
      500
    );

    const demoTransactions = generateDemoTransactions(count);

    const createdTransactions = [];
    const recoveryCases = [];

    for (const item of demoTransactions) {
      let customer = await Customer.findOne({
        email: item.customerEmail,
      });

      if (!customer) {
        customer = await Customer.create({
          name: item.customerName,
          email: item.customerEmail,
        });
      }

      if (item.status === "success") {
        customer.totalSuccessfulPayments += 1;
        customer.lifetimeValue += item.amount;
      }

      if (item.status === "failed") {
        customer.totalFailedPayments += 1;
      }

      await customer.save();

      const transaction = await Transaction.create({
        customerId: customer._id,
        amount: item.amount,
        currency: "INR",
        status: item.status,
        failureReason: item.failureReason,
        paymentMethod: item.paymentMethod,
      });

      createdTransactions.push(transaction);

      if (
        ["failed", "abandoned", "pending"].includes(
          transaction.status
        )
      ) {
        const risk = calculateRisk({
          transaction,
          customer,
        });

        const recoveryCase = await RecoveryCase.create({
          transactionId: transaction._id,
          customerId: customer._id,
          revenueAtRisk: transaction.amount,
          riskScore: risk.riskScore,
          riskLevel: risk.riskLevel,
        });

        recoveryCases.push(recoveryCase);
      }
    }

    res.status(201).json({
      success: true,
      message: `${createdTransactions.length} demo transactions generated`,
      transactionsCreated: createdTransactions.length,
      recoveryCasesCreated: recoveryCases.length,
    });
  } catch (error) {
    console.error("Simulation error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate demo transactions",
      error: error.message,
    });
  }
};

//GET TRANSACTIONS
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("customerId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load transactions",
      error: error.message,
    });
  }
};