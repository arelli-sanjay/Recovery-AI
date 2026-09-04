import express from "express";

import {
  getAuditLogs,
  getAuditLogsByCase,
} from "../controllers/auditController.js";

const router = express.Router();

router.get("/", getAuditLogs);

router.get(
  "/case/:recoveryCaseId",
  getAuditLogsByCase
);

export default router;