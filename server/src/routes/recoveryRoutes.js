import express from "express";

import {getRecoveryCases, getRecoveryCaseById, executeRecovery} from "../controllers/recoveryController.js";

const router = express.Router();

router.get("/cases", getRecoveryCases);

router.get("/cases/:id", getRecoveryCaseById);

router.post("/:id/execute", executeRecovery);

export default router;