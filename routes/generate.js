// routes/generate.js
require("dotenv").config();
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const User = require("../models/user");

// Google Generative AI client
const { GoogleGenerativeAI } = require("@google/generative-ai");

// configure multer (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// init client with correct SDK pattern
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
);
const MODEL_NAME = "gemini-2.5-flash-image"; // Latest Gemini 2.0 model with image generation

// Helper: Convert buffer to Gemini-compatible format
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

// POST /api/generate/image
router.post("/image", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const { prompt, userId } = req.body;

    if (!file) return res.status(400).json({ error: "No image uploaded" });
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    // Optional: check user and quota
    let user = null;
    if (userId) {
      user = await User.findById(userId);
      if (!user) return res.status(403).json({ error: "User not found" });
      if (typeof user.requests_left !== "undefined" && user.requests_left <= 0)
        return res.status(403).json({ error: "No requests left" });
    }

    // 1) Preprocess image (resize to 1024 px width to save cost)
    const resizedBuffer = await sharp(file.buffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .png()
      .toBuffer();

    // 2) Call Gemini model using correct SDK pattern from guide
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Convert image buffer to Gemini format
    const imagePart = bufferToGenerativePart(resizedBuffer, "image/png");

    // Generate content with prompt + image (array format per guide)
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;

    // 4) Parse response for inlineData (CRITICAL: following guide's pattern)
    let imageUrl = null;
    let outBuffer = null;
    const candidates = response?.candidates || [];

    for (const cand of candidates) {
      const parts = cand?.content?.parts || [];
      for (const part of parts) {
        // Check for inline image data (base64)
        if (
          part.inlineData &&
          part.inlineData.data &&
          part.inlineData.mimeType
        ) {
          outBuffer = Buffer.from(part.inlineData.data, "base64");
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
      if (outBuffer) break;
    }

    // Fallback error if no image returned
    if (!outBuffer) {
      const text = response?.text?.();
      console.error("Gemini returned no image. Response:", text || response);
      return res.status(500).json({
        error:
          "Model did not return an image. Try a different prompt or image.",
        details: text,
      });
    }

    // 4) Save image to public/generated
    const outDir = path.join(__dirname, "..", "public", "generated");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const filename = `studioaljo_${Date.now()}.png`;
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, outBuffer);

    // 5) decrement quota (only on success)
    if (user) {
      if (typeof user.requests_left !== "undefined") {
        user.requests_left = Math.max(0, user.requests_left - 1);
        await user.save();
      }
    }

    // 6) return URL
    const publicUrl = `/generated/${filename}`;
    res.json({ ok: true, url: publicUrl, prompt: prompt });
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

module.exports = router;
