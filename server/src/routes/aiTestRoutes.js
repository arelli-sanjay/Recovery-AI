import express from "express";
import ai from "../config/gemini.js";

const router = express.Router();

router.get("/test", async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents:
        "Reply with exactly: Gemini connection successful",
    });

    res.status(200).json({
      success: true,
      message: response.text,
    });
  } catch (error) {
    console.error("Gemini test error:", error);

    res.status(500).json({
      success: false,
      message: "Gemini connection failed",
      error: error.message,
    });
  }
});

export default router;