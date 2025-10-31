import admin from 'firebase-admin';

// Initialize Firebase Admin SDK once in the server runtime
// Uses local service account file in development; in production, rely on env vars
if (!admin.apps.length) {
  try {
    // Prefer GOOGLE_APPLICATION_CREDENTIALS or env-provided creds
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_CONFIG) {
      admin.initializeApp();
    } else {
      // Fallback to bundled service account for local dev
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const serviceAccount = require('../serviceAccountKey.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    }
  } catch (err) {
    // If initialization races in dev, ignore
    // eslint-disable-next-line no-console
    console.warn('Firebase Admin initialization warning:', err);
  }
}

export const adminDb = admin.firestore();
export const adminFieldValue = admin.firestore.FieldValue;

export default admin;


