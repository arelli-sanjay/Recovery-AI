import crypto from "crypto";

import RecoveryCase from "../models/RecoveryCase.js";
import RecoveryAttempt from "../models/RecoveryAttempt.js";
import RecoveryAudit from "../models/RecoveryAudit.js";
import Transaction from "../models/Transaction.js";
import Customer from "../models/Customer.js";

// VERIFY RAZORPAY WEBHOOK SIGNATURE
const verifySignature = (req) => {
  const signature =
    req.headers["x-razorpay-signature"];

  if (!signature) {
    console.log("Razorpay signature missing");
    return false;
  }

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.log(
      "RAZORPAY_WEBHOOK_SECRET is missing from .env"
    );

    return false;
  }

  if (!Buffer.isBuffer(req.body)) {
    console.log(
      "Webhook body is NOT a Buffer"
    );

    console.log(
      "Body type:",
      typeof req.body
    );

    return false;
  }

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_WEBHOOK_SECRET
      )
      .update(req.body)
      .digest("hex");

  const receivedBuffer =
    Buffer.from(signature, "utf8");

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8"
    );

  if (
    receivedBuffer.length !==
    expectedBuffer.length
  ) {
    console.log(
      "Razorpay signature length mismatch"
    );

    return false;
  }

  const isValid =
    crypto.timingSafeEqual(
      receivedBuffer,
      expectedBuffer
    );

  if (isValid) {
    console.log(
      "Razorpay webhook signature verified"
    );
  } else {
    console.log(
      "Razorpay webhook signature INVALID"
    );
  }

  return isValid;
};

// RAZORPAY WEBHOOK CONTROLLER
export const razorpayWebhook =
  async (req, res) => {

    try {
      console.log(
        "RAZORPAY WEBHOOK RECEIVED"
      );

      // 1. CHECK REQUEST BODY
      console.log(
        "Body type:",
        Buffer.isBuffer(req.body)
          ? "Buffer"
          : typeof req.body
      );

      console.log(
        "Body size:",
        Buffer.isBuffer(req.body)
          ? req.body.length
          : "N/A"
      );

      // 2. VERIFY RAZORPAY SIGNATURE
      if (!verifySignature(req)) {

        console.log(
          "Webhook rejected because signature is invalid"
        );

        return res.status(400).json({
          success: false,
          message:
            "Invalid webhook signature",
        });
      }

      // 3. PARSE WEBHOOK JSON
      const event =
        JSON.parse(
          req.body.toString()
        );

      console.log(
        "Razorpay Event:",
        event.event
      );

      // 4. HANDLE PAYMENT LINK PAID
      if (
        event.event ===
        "payment_link.paid"
      ) {

        console.log(
          "PAYMENT LINK PAID EVENT RECEIVED"
        );

        const paymentLink =
          event.payload
            ?.payment_link
            ?.entity;


        if (!paymentLink) {

          console.log(
            "Payment link data missing"
          );

          return res.status(400).json({
            success: false,
            message:
              "Payment link data missing",
          });
        }


        console.log(
          "Payment Link ID:",
          paymentLink.id
        );

        const recoveryCaseId =
          paymentLink.notes
            ?.recoveryCaseId;


        console.log(
          "Recovery Case ID:",
          recoveryCaseId || "NOT FOUND"
        );

        if (!recoveryCaseId) {

          console.log(
            "Payment is not associated with a Recovery Case"
          );

          return res.status(200).json({
            success: true,
            message:
              "Payment not associated with recovery case",
          });
        }

        // 5. FIND RECOVERY CASE
        console.log(
          "Searching RecoveryCase..."
        );

        const recoveryCase =
          await RecoveryCase.findById(
            recoveryCaseId
          );

        if (!recoveryCase) {

          console.log(
            "Recovery Case not found:",
            recoveryCaseId
          );

          return res.status(404).json({
            success: false,
            message:
              "Recovery case not found",
          });
        }

        console.log(
          "Recovery Case found:",
          recoveryCase._id
        );

        // 6. FIND RECOVERY ATTEMPT
        console.log(
          "Searching RecoveryAttempt..."
        );

        const attempt =
          await RecoveryAttempt.findOne({
            recoveryCaseId:
              recoveryCase._id,

            razorpayPaymentLinkId:
              paymentLink.id,
          });

        if (!attempt) {

          console.log(
            "Recovery Attempt not found"
          );

          console.log(
            "Payment Link ID:",
            paymentLink.id
          );

          console.log(
            "Recovery Case ID:",
            recoveryCase._id
          );

          return res.status(404).json({
            success: false,
            message:
              "Recovery attempt not found",
          });
        }

        console.log(
          "Recovery Attempt found:",
          attempt._id
        );

        // 7. IDEMPOTENCY CHECK
        if (
          attempt.status ===
          "success"
        ) {

          console.log(
            "Webhook already processed"
          );

          return res.status(200).json({
            success: true,
            message:
              "Webhook already processed",
          });
        }

        // 8. UPDATE RECOVERY ATTEMPT
        console.log(
          "Updating RecoveryAttempt..."
        );

        attempt.status =
          "success";

        attempt.completedAt =
          new Date();

        await attempt.save();

        console.log(
          "RecoveryAttempt updated"
        );

        // 9. UPDATE RECOVERY CASE
        console.log(
          "Updating RecoveryCase..."
        );

        const recoveredAmount =
          attempt.amount;

        recoveryCase.revenueRecovered =
          recoveredAmount;

        recoveryCase.status =
          "recovered";

        await recoveryCase.save();


        console.log(
          "RecoveryCase updated"
        );

        // 10. UPDATE TRANSACTION
        console.log(
          "Updating Transaction..."
        );

        const transaction =
          await Transaction.findById(
            recoveryCase.transactionId
          );

        if (transaction) {

          transaction.status =
            "success";

          await transaction.save();

          console.log(
            "Transaction updated"
          );

        } else {

          console.log(
            "Transaction not found"
          );
        }

        // 11. UPDATE CUSTOMER
        console.log(
          "Updating Customer..."
        );

        const customer =
          await Customer.findById(
            recoveryCase.customerId
          );

        if (customer) {

          customer.totalSuccessfulPayments +=
            1;

          customer.lifetimeValue +=
            recoveredAmount;

          await customer.save();

          console.log(
            "Customer updated"
          );

        } else {

          console.log(
            "Customer not found"
          );
        }

        // 12. CREATE AUDIT LOG
        console.log(
          "Creating RecoveryAudit..."
        );

        await RecoveryAudit.create({

          recoveryCaseId:
            recoveryCase._id,

          event:
            "PAYMENT_SUCCESS",

          description:
            `Recovery payment of ₹${recoveredAmount} successfully received.`,

          amount:
            recoveredAmount,

          metadata: {

            razorpayPaymentLinkId:
              paymentLink.id,

            attemptNumber:
              attempt.attemptNumber,
          },
        });

        console.log(
          "RecoveryAudit created"
        );

        // PAYMENT SUCCESS
        console.log(
          `Amount Recovered: ₹${recoveredAmount}`
        );

        console.log(
          `Payment Link: ${paymentLink.id}`
        );
      }

      // 13. RETURN SUCCESS RESPONSE
      return res.status(200).json({
        success: true,
        message:
          "Webhook processed",
      });


    } catch (error) {

      console.error(
        "\nRAZORPAY WEBHOOK ERROR:"
      );

      console.error(
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Webhook processing failed",

        error:
          error.message,
      });
    }
  };