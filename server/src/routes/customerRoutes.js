import express from "express";
import {
  getCustomers,
  getCustomerById,
} from "../controllers/customerController.js";

const router = express.Router();

router.get("/", getCustomers);
router.get("/:id", getCustomerById);

export default router;