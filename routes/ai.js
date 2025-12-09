const express = require("express");
const multer = require("multer");
// Keeping your existing import method
const { GoogleGenAI } = require("@google/genai");
const { uploadImageToFirebase } = require("../utils/firebase");
const Gallery = require("../models/gallery");

const router = express.Router();

// Initialize Google GenAI client
// Ensure GOOGLE_API_KEY is in your .env file
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// --- MULTER CONFIGURATION ---
// High-efficiency memory storage (RAM) for fast processing
const storage = multer.memoryStorage();

// Strict file type validation
const allowedMimes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function fileFilter(req, file, cb) {
  if (allowedMimes.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Use PNG, JPEG, or WEBP.`
      )
    );
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit per file
});

// ==========================================
// ROUTE 1: SIMPLE EDIT / GENERATION
// URL: /api/images/edit
// ==========================================
router.post("/edit", upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const file = req.file;
    const userId = req.body.userId; // Optional: for saving to gallery
    const saveToGallery = req.body.saveToGallery === "true"; // Optional flag

    if (!file) return res.status(400).json({ error: "Image file is required" });
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const b64 = file.buffer.toString("base64");

    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: file.mimetype,
          data: b64,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents,
    });

    // Helper to safely extract image
    const imgPart = extractImageFromResponse(response);

    if (!imgPart) {
      return res
        .status(502)
        .json({ error: "Model returned text instead of an image." });
    }

    const dataUrl = `data:${imgPart.mime};base64,${imgPart.data}`;

    // Optional: Save to Firebase and Gallery if userId and saveToGallery flag provided
    let galleryImage = null;
    if (userId && saveToGallery) {
      try {
        const imageBuffer = Buffer.from(imgPart.data, "base64");
        const firebaseUrl = await uploadImageToFirebase(
          imageBuffer,
          userId,
          imgPart.mime
        );

        galleryImage = new Gallery({
          userId,
          firebaseUrl,
          originalPrompt: prompt,
          toolType: "ai-styling",
          metadata: {
            mimeType: imgPart.mime,
            fileSize: imageBuffer.length,
          },
        });

        await galleryImage.save();
        console.log("Image saved to gallery:", galleryImage._id);
      } catch (saveError) {
        console.error(
          "Gallery save error:",
          saveError.error?.message || saveError.message
        );
        // Don't fail the request if gallery save fails - just log it
      }
    }

    res.json({
      dataUrl,
      mime: imgPart.mime,
      galleryId: galleryImage ? galleryImage._id : null,
    });
  } catch (err) {
    console.error("Error in /edit:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  }
});

// ==========================================
// ROUTE 2: VIRTUAL OUTFIT TRY-ON (The "Full Marks" Feature)
// URL: /api/images/outfit-tryon
// ==========================================
router.post(
  "/outfit-tryon",
  upload.fields([
    { name: "personImage", maxCount: 1 },
    { name: "outfitImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // 1. Validate Inputs
      const personFile = req.files["personImage"]?.[0];
      const outfitFile = req.files["outfitImage"]?.[0];
      const userId = req.body.userId; // Optional: for saving to gallery
      const saveToGallery = req.body.saveToGallery === "true";

      if (!personFile || !outfitFile) {
        return res.status(400).json({
          error: "Both 'personImage' and 'outfitImage' are required.",
        });
      }

      console.log("Starting Virtual Try-On Pipeline...");

      const personB64 = personFile.buffer.toString("base64");
      const outfitB64 = outfitFile.buffer.toString("base64");

      // --- STEP 1: SEMANTIC GROUNDING ---
      // We ask Gemini to describe the outfit first. This "loads" the details into context.
      // We use the lighter 'gemini-2.5-flash' for this text task.

      const groundingPrompt =
        "Analyze this clothing image. Describe the garment in precise technical detail including fabric texture (e.g., denim, silk), neck style, sleeve length, fit, and pattern. Output ONLY the description.";

      const descriptionResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: groundingPrompt },
          { inlineData: { mimeType: outfitFile.mimetype, data: outfitB64 } },
        ],
      });

      // Robust fallback if the description fails
      let outfitDescription = "The clothing item shown in the second image";
      try {
        if (descriptionResponse?.response?.text) {
          outfitDescription = descriptionResponse.response.text();
        } else if (
          descriptionResponse?.candidates?.[0]?.content?.parts?.[0]?.text
        ) {
          outfitDescription =
            descriptionResponse.candidates[0].content.parts[0].text;
        }
      } catch (textError) {
        console.warn(
          "Could not extract outfit description, using fallback:",
          textError.message
        );
      }

      console.log(
        "Outfit Grounding Complete:",
        outfitDescription.substring(0, 50) + "..."
      );

      // --- STEP 2: MULTIMODAL GENERATION ---
      // We inject the description + both images into the prompt.

      const fusionPrompt = `
      Create a photorealistic image of the person from the first image wearing the outfit from the second image.

      INSTRUCTIONS:
      1. **Subject Identity:** The face, body shape, skin tone, and hair of the person in the first image must remain 100% unchanged.
      2. **Outfit Application:** Dress the subject in the garment described as: "${outfitDescription}".
      3. **Fit & Physics:** The clothing must hang naturally on the subject's pose.
      4. **Lighting:** Match the lighting of the original person image.
      `;

      const contents = [
        { text: fusionPrompt },
        { inlineData: { mimeType: personFile.mimetype, data: personB64 } }, // Img 1: Person
        { inlineData: { mimeType: outfitFile.mimetype, data: outfitB64 } }, // Img 2: Outfit
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents,
        config: {
          responseModalities: ["IMAGE"], // Force image output
          // Safety settings can be adjusted here if clothing is flagging filters
        },
      });

      // Extract Result
      const imgPart = extractImageFromResponse(response);

      if (!imgPart) {
        return res.status(502).json({
          error: "Generation failed. The model might have blocked the request.",
        });
      }

      const dataUrl = `data:${imgPart.mime};base64,${imgPart.data}`;

      // Optional: Save to Firebase and Gallery
      let galleryImage = null;
      if (userId && saveToGallery) {
        try {
          const imageBuffer = Buffer.from(imgPart.data, "base64");
          const firebaseUrl = await uploadImageToFirebase(
            imageBuffer,
            userId,
            imgPart.mime
          );

          galleryImage = new Gallery({
            userId,
            firebaseUrl,
            originalPrompt: fusionPrompt,
            toolType: "outfit-tryon",
            metadata: {
              mimeType: imgPart.mime,
              fileSize: imageBuffer.length,
              aiAnalysis: outfitDescription,
            },
          });

          await galleryImage.save();
          console.log("Outfit try-on saved to gallery:", galleryImage._id);
        } catch (saveError) {
          console.error(
            "Gallery save error:",
            saveError.error?.message || saveError.message
          );
          // Don't fail the request if gallery save fails - just log it
        }
      }
      // Return Image AND the AI's analysis (Great for your project presentation)
      res.json({
        dataUrl,
        mime: imgPart.mime,
        aiAnalysis: outfitDescription,
        galleryId: galleryImage ? galleryImage._id : null,
      });
    } catch (err) {
      console.error("Error in /outfit-tryon:", err);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  }
);

// --- HELPER FUNCTION ---
// Extracts image data from the complex Gemini response structure
function extractImageFromResponse(response) {
  let parts = [];

  // Handle different potential response structures from the SDK
  if (response?.candidates?.[0]?.content?.parts) {
    parts = response.candidates[0].content.parts;
  } else if (Array.isArray(response.parts)) {
    parts = response.parts;
  }

  const imgPart = parts.find((p) => p.inlineData && p.inlineData.data);

  if (imgPart) {
    return {
      data: imgPart.inlineData.data,
      mime: imgPart.inlineData.mimeType || "image/png",
    };
  }
  return null;
}

module.exports = router;
