import { initFirestore } from "@auth/firebase-adapter"
import { cert, getApps, initializeApp } from "firebase-admin/app"

// Prevent multiple initializations in Next.js (hot reload, SSR, etc.)
if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error('FIREBASE_PROJECT_ID environment variable is not set')
}
const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Fix private key newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })

export const firestore = initFirestore(app)
