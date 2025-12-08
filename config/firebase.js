const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
// You'll need to add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL,
// FIREBASE_PRIVATE_KEY, and FIREBASE_STORAGE_BUCKET to your .env file
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) {
    return admin.storage();
  }

  try {
    // Parse the private key (it may contain \n as literal string in .env)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined;

    if (!process.env.FIREBASE_PROJECT_ID || !privateKey) {
      console.warn(
        "Firebase credentials not found in .env. Gallery features will be disabled."
      );
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    firebaseInitialized = true;
    console.log("Firebase Admin SDK initialized successfully");
    return admin.storage();
  } catch (error) {
    console.error("Firebase initialization error:", error.message);
    return null;
  }
}

// Get storage bucket
function getStorageBucket() {
  const storage = initializeFirebase();
  if (!storage) return null;
  return storage.bucket();
}

module.exports = {
  initializeFirebase,
  getStorageBucket,
  admin,
};
