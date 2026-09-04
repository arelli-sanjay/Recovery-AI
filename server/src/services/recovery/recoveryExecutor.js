import razorpay from "../../config/razorpay.js";

import RecoveryAttempt from "../../models/RecoveryAttempt.js";
import RecoveryAudit from "../../models/RecoveryAudit.js";

const MAX_ATTEMPTS = 3;
const MAX_AMOUNT = 10000;

export const executePaymentLinkRecovery = async ({
  recoveryCase,
  transaction,
  customer,
}) => {

  // 1. SAFETY CHECKS
  if (!recoveryCase) {
    throw new Error("Recovery case not found");
  }

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (!customer) {
    throw new Error("Customer not found");
  }

  if (recoveryCase.status !== "recovering") {
    throw new Error(
      `Recovery case is not executable in status: ${recoveryCase.status}`
    );
  }

  if (recoveryCase.attemptCount >= MAX_ATTEMPTS) {
    throw new Error("Maximum recovery attempts reached");
  }

  if (recoveryCase.revenueAtRisk > MAX_AMOUNT) {
    throw new Error("Recovery amount exceeds automated limit");
  }

  // 2. PREVENT DUPLICATE ACTIVE ATTEMPTS
  const existingAttempt = await RecoveryAttempt.findOne({
    recoveryCaseId: recoveryCase._id,

    status: {
      $in: ["created", "pending"],
    },
  });

  if (existingAttempt) {
    return {
      alreadyExists: true,
      attempt: existingAttempt,
    };
  }

  // 3. CALCULATE ATTEMPT NUMBER
  const attemptNumber =
    recoveryCase.attemptCount + 1;

  const amount = recoveryCase.revenueAtRisk;

  // 4. CREATE RAZORPAY PAYMENT LINK
  let paymentLink;

  try {
    paymentLink =
      await razorpay.paymentLink.create({
        amount: Math.round(amount * 100),

        currency:
          transaction.currency || "INR",

        accept_partial: false,

        description:
          `Recovery payment for ${customer.name}`,

        customer: {
          name: customer.name,
          email: customer.email,
          contact: customer.phone || undefined,
        },

        notify: {
          sms: false,
          email: false,
        },

        reminder_enable: true,

        notes: {
          recoveryCaseId:
            recoveryCase._id.toString(),

          transactionId:
            transaction._id.toString(),

          attemptNumber:
            attemptNumber.toString(),

          recoveryType:
            "AI_REVENUE_RECOVERY",
        },
      });
  } catch (error) {
    throw new Error(
      `Razorpay payment link creation failed: ${error.message}`
    );
  }

  // 5. SAVE RECOVERY ATTEMPT
  const attempt =
    await RecoveryAttempt.create({
      recoveryCaseId:
        recoveryCase._id,

      transactionId:
        transaction._id,

      attemptNumber,

      action:
        "CREATE_PAYMENT_LINK",

      amount,

      currency:
        transaction.currency || "INR",

      razorpayPaymentLinkId:
        paymentLink.id,

      paymentLinkUrl:
        paymentLink.short_url,

      status: "pending",
    });

  // 6. UPDATE RECOVERY CASE
  recoveryCase.attemptCount =
    attemptNumber;

  await recoveryCase.save();

  // 7. CREATE AUDIT TRAIL EVENT
  await RecoveryAudit.create({
    recoveryCaseId:
      recoveryCase._id,

    event:
      "PAYMENT_LINK_CREATED",

    description:
      `Recovery payment link created for ₹${amount}.`,

    amount,

    metadata: {
      razorpayPaymentLinkId:
        paymentLink.id,

      paymentLinkUrl:
        paymentLink.short_url,

      attemptNumber,

      recoveryType:
        "AI_REVENUE_RECOVERY",
    },
  });

  // 8. RETURN RESULT
  return {
    alreadyExists: false,

    attempt,
  };
};