const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("[gemini] Warning: API_KEY/GEMINI_API_KEY not set in .env");
}
const genAI = new GoogleGenerativeAI(apiKey || "");

// Ensure uploads dir
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir + path.sep });

// Daily quota per IP (10/day)
const DAILY_LIMIT = 10;
const quotaStore = new Map(); // ip -> { count, date }
function checkQuota(ip) {
  const today = new Date().toDateString();
  const q = quotaStore.get(ip);
  if (!q || q.date !== today) {
    const fresh = { count: 0, date: today };
    quotaStore.set(ip, fresh);
    return { allowed: true, remaining: DAILY_LIMIT };
  }
  if (q.count >= DAILY_LIMIT) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: DAILY_LIMIT - q.count };
}
function incQuota(ip) {
  const today = new Date().toDateString();
  const q = quotaStore.get(ip);
  if (q && q.date === today) q.count++;
  else quotaStore.set(ip, { count: 1, date: today });
}

function fileToPart(filePath, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType,
    },
  };
}

// GET /api/gemini/quota
router.get("/quota", (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const q = checkQuota(ip);
  res.json({ limit: DAILY_LIMIT, ...q });
});

// POST /api/gemini/generate-image
router.post("/generate-image", upload.single("image"), async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const tempPath = req.file?.path;
  const mime = req.file?.mimetype;
  const { prompt } = req.body || {};

  if (!tempPath || !prompt) {
    return res.status(400).json({ error: "image & prompt required" });
  }

  try {
    const q = checkQuota(ip);
    if (!q.allowed) {
      try {
        fs.unlinkSync(tempPath);
      } catch {}
      return res
        .status(429)
        .json({
          error: "Daily quota exceeded (10/day).",
          limit: DAILY_LIMIT,
          remaining: 0,
        });
    }

    // Model call
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    const imagePart = fileToPart(tempPath, mime);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;

    let imageUrl = null;
    for (const cand of response?.candidates || []) {
      for (const part of cand?.content?.parts || []) {
        if (part.inlineData?.data && part.inlineData?.mimeType) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
      if (imageUrl) break;
    }

    if (!imageUrl) {
      const text = response?.text?.();
      throw new Error(text || "Model did not return an image");
    }

    try {
      fs.unlinkSync(tempPath);
    } catch {}
    incQuota(ip);
    const after = checkQuota(ip);

    res.json({ imageUrl, limit: DAILY_LIMIT, remaining: after.remaining });
  } catch (err) {
    console.error("[gemini] error:", err);
    try {
      fs.unlinkSync(tempPath);
    } catch {}
    res.status(500).json({ error: "Failed to generate image." });
  }
});

module.exports = router;
