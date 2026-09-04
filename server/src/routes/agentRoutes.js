import express from "express";

import {analyzeCase,} from "../controllers/agentController.js";

const router = express.Router();

router.post("/analyze/:id",analyzeCase);

export default router;