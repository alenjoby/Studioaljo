const mongoose = require("mongoose");

const GallerySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    firebaseUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    originalPrompt: {
      type: String,
      required: true,
    },
    toolType: {
      type: String,
      enum: [
        "ai-styling",
        "room-makeover",
        "meme-maker",
        "ai-avatar",
        "outfit-tryon",
        "background-erase",
        "other",
      ],
      default: "other",
    },
    metadata: {
      width: { type: Number },
      height: { type: Number },
      mimeType: { type: String },
      fileSize: { type: Number },
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Index for efficient user queries
GallerySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Gallery", GallerySchema);
