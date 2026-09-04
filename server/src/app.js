import express from "express";
import cors from "cors";

import transactionRoutes from "./routes/transactionRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import recoveryRoutes from "./routes/recoveryRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import aiTestRoutes from "./routes/aiTestRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import escalationRoutes from "./routes/escalationRoutes.js";

import { razorpayWebhook } from "./controllers/webhookController.js";

const app = express();

app.use(cors());


// ============================================
// RAZORPAY WEBHOOK
// MUST COME BEFORE express.json()
// ============================================

app.post(
  "/api/webhooks/razorpay",
  express.raw({
    type: "application/json",
  }),
  razorpayWebhook
);


// ============================================
// NORMAL JSON MIDDLEWARE
// ============================================

app.use(express.json());


// ============================================
// API ROUTES
// ============================================

app.use("/api/transactions", transactionRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/recovery", recoveryRoutes);

app.use("/api/agent", agentRoutes);

app.use("/api/ai", aiTestRoutes);

app.use("/api/audit", auditRoutes);

app.use("/api/customers", customerRoutes);

app.use("/api/escalations", escalationRoutes);


// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Revenue Recovery API is running",
  });
});


// ============================================
// RAZORPAY TEST
// ============================================

app.get("/api/razorpay/test", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Razorpay client initialized successfully",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


export default app;