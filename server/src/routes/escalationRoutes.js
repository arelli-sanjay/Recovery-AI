import express from "express";

import {
  getEscalations,
  getEscalationById,
  approveEscalation,
  rejectEscalation,
} from "../controllers/escalationController.js";

const router = express.Router();

router.get("/", getEscalations);

router.get("/:id", getEscalationById);

router.post("/:id/approve", approveEscalation);

router.post("/:id/reject", rejectEscalation);

export default router;