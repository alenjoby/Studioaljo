const express = require("express");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

// Initialize Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Multer setup: memory storage, validate mime, 20MB max inline limit
const storage = multer.memoryStorage();
const allowedMimes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function fileFilter(req, file, cb) {
  if (allowedMimes.has(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported image type"));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

// POST /api/images/edit
router.post("/images/edit", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt; // Now reading prompt directly from client
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Image file is required" });
    }
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const b64 = file.buffer.toString("base64");

    // Structure contents to match official example: text first, then inline image
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: file.mimetype,
          data: b64,
        },
      },
    ];

    // Call Gemini 2.5 Flash Image for image generation/editing
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents,
    });

    // Extract first image part
    // Prefer official example path: candidates[0].content.parts
    let parts = [];
    if (
      response &&
      response.candidates &&
      response.candidates[0] &&
      response.candidates[0].content &&
      Array.isArray(response.candidates[0].content.parts)
    ) {
      parts = response.candidates[0].content.parts;
    } else if (response && Array.isArray(response.parts)) {
      parts = response.parts;
    }

    const imgPart = parts.find((p) => p.inlineData && p.inlineData.data);
    if (!imgPart) {
      return res.status(502).json({ error: "Model did not return an image" });
    }

    const outB64 = imgPart.inlineData.data;
    const mime = imgPart.inlineData.mimeType || "image/png";
    const dataUrl = `data:${mime};base64,${outB64}`;

    res.json({ dataUrl, mime });
  } catch (err) {
    console.error("/api/images/edit error:", err);
    const msg = err?.message || "Unexpected error";
    res.status(500).json({ error: msg });
  }
});

module.exports = router;
