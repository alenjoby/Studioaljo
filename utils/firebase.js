const { getStorageBucket } = require("../config/firebase");
const crypto = require("crypto");

/**
 * Generate a unique ID
 */
function generateImageId() {
  return crypto.randomBytes(12).toString("hex");
}

/**
 * Upload image buffer to Firebase Storage
 * @param {Buffer} buffer - Image buffer
 * @param {String} userId - User ID for folder organization
 * @param {String} mimetype - Image MIME type (e.g., 'image/png')
 * @returns {Promise<String>} - Public download URL
 */
async function uploadImageToFirebase(buffer, userId, mimetype = "image/png") {
  const bucket = getStorageBucket();
  if (!bucket) {
    throw new Error("Firebase Storage not configured");
  }

  const imageId = generateImageId();
  const extension = mimetype.split("/")[1] || "png";
  const fileName = `users/${userId}/${imageId}.${extension}`;

  const file = bucket.file(fileName);

  // Upload with metadata
  await file.save(buffer, {
    metadata: {
      contentType: mimetype,
      metadata: {
        firebaseStorageDownloadTokens: imageId, // For public URL generation
      },
    },
  });

  // Make file publicly accessible
  await file.makePublic();

  // Get public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

  return publicUrl;
}

/**
 * Delete image from Firebase Storage
 * @param {String} firebaseUrl - Full Firebase Storage URL
 * @returns {Promise<Boolean>} - Success status
 */
async function deleteImageFromFirebase(firebaseUrl) {
  const bucket = getStorageBucket();
  if (!bucket) {
    throw new Error("Firebase Storage not configured");
  }

  try {
    // Extract file path from URL
    // URL format: https://storage.googleapis.com/{bucket}/{filePath}
    const urlParts = firebaseUrl.split(`${bucket.name}/`);
    if (urlParts.length < 2) {
      throw new Error("Invalid Firebase URL format");
    }

    const filePath = urlParts[1];
    const file = bucket.file(filePath);

    await file.delete();
    return true;
  } catch (error) {
    console.error("Firebase delete error:", error.message);
    return false;
  }
}

/**
 * Generate thumbnail (optional - for future implementation)
 * @param {Buffer} buffer - Original image buffer
 * @returns {Promise<Buffer>} - Thumbnail buffer
 */
async function generateThumbnail(buffer) {
  // TODO: Implement image resizing using sharp or jimp
  // For now, return original buffer
  return buffer;
}

module.exports = {
  uploadImageToFirebase,
  deleteImageFromFirebase,
  generateThumbnail,
};
