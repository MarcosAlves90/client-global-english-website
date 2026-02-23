import admin from "firebase-admin"

// initialize firebase-admin lazily; the SDK will reuse the app if it's
// already been created (important when using hot reload in development).
if (!admin.apps.length) {
  // these environment variables must be set in your deployment environment
  // with values from a service account JSON. For local development you can
  // copy the JSON into a single variable or use a .env file with
  // FIREBASE_PRIVATE_KEY containing the raw key (newlines replaced with
  // \n).
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase admin credentials in environment variables."
    )
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  })
}

export const adminAuth = admin.auth()
export const adminDb = admin.firestore()
export default admin
