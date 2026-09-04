import express from "express";
import {
  simulateTransactions,getTransactions,
} from "../controllers/transactionController.js";

const router = express.Router();

router.post("/simulate", simulateTransactions);

router.get("/", getTransactions);

export default router;