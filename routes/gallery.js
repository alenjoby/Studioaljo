const express = require("express");
const router = express.Router();
const Gallery = require("../models/gallery");
const { deleteImageFromFirebase } = require("../utils/firebase");

// ==========================================
// GALLERY ROUTES
// ==========================================

/**
 * GET /gallery
 * Fetch all images for a specific user
 * Query params: userId (required)
 */
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const images = await Gallery.find({ userId })
      .sort({ createdAt: -1 }) // Most recent first
      .select("-__v"); // Exclude version key

    res.json({
      success: true,
      count: images.length,
      images,
    });
  } catch (error) {
    console.error("Gallery fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /gallery/:id
 * Fetch a single image by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.json({ success: true, image });
  } catch (error) {
    console.error("Gallery fetch single error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /gallery
 * Save a new image to gallery
 * Body: { userId, firebaseUrl, originalPrompt, toolType, metadata }
 */
router.post("/", async (req, res) => {
  try {
    const { userId, firebaseUrl, originalPrompt, toolType, metadata } =
      req.body;

    if (!userId || !firebaseUrl || !originalPrompt) {
      return res.status(400).json({
        error: "userId, firebaseUrl, and originalPrompt are required",
      });
    }

    const newImage = new Gallery({
      userId,
      firebaseUrl,
      originalPrompt,
      toolType: toolType || "other",
      metadata: metadata || {},
    });

    await newImage.save();

    res.status(201).json({
      success: true,
      message: "Image saved to gallery",
      image: newImage,
    });
  } catch (error) {
    console.error("Gallery save error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /gallery/:id
 * Update image metadata (e.g., prompt, favorite status)
 * Body: { originalPrompt?, isFavorite?, toolType? }
 */
router.put("/:id", async (req, res) => {
  try {
    const { originalPrompt, isFavorite, toolType } = req.body;

    const updateData = {};
    if (originalPrompt !== undefined)
      updateData.originalPrompt = originalPrompt;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (toolType !== undefined) updateData.toolType = toolType;

    const updatedImage = await Gallery.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedImage) {
      return res.status(404).json({ error: "Image not found" });
    }

    res.json({
      success: true,
      message: "Image updated successfully",
      image: updatedImage,
    });
  } catch (error) {
    console.error("Gallery update error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /gallery/:id
 * Delete image from both Firebase Storage and MongoDB
 */
router.delete("/:id", async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ error: "Image not found" });
    }

    // Delete from Firebase Storage
    try {
      await deleteImageFromFirebase(image.firebaseUrl);
    } catch (firebaseError) {
      console.error("Firebase delete error:", firebaseError.message);
      // Continue with MongoDB deletion even if Firebase fails
    }

    // Delete from MongoDB
    await Gallery.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Gallery delete error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /gallery/user/:userId
 * Delete all images for a specific user (for cleanup/testing)
 */
router.delete("/user/:userId", async (req, res) => {
  try {
    const images = await Gallery.find({ userId: req.params.userId });

    // Delete all from Firebase
    const deletePromises = images.map((img) =>
      deleteImageFromFirebase(img.firebaseUrl).catch((err) =>
        console.error("Firebase delete error:", err)
      )
    );
    await Promise.all(deletePromises);

    // Delete all from MongoDB
    const result = await Gallery.deleteMany({ userId: req.params.userId });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} images`,
    });
  } catch (error) {
    console.error("Gallery bulk delete error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
