import admin from 'firebase-admin';

// Initialize Firebase Admin SDK once in the server runtime
// Uses local service account file in development; in production, rely on env vars
if (!admin.apps.length) {
  try {
    let initialized = false;

    // First, try GOOGLE_APPLICATION_CREDENTIALS (for GCP environments)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://foodbooking-3ccec-default-rtdb.asia-southeast1.firebasedatabase.app'
        });
        initialized = true;
      } catch (credError) {
        console.warn('Failed to initialize with GOOGLE_APPLICATION_CREDENTIALS, trying other methods...');
      }
    }

    // If not initialized yet, try FIREBASE_CONFIG (JSON string)
    if (!initialized && process.env.FIREBASE_CONFIG) {
      try {
        const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
        if (firebaseConfig.private_key && firebaseConfig.client_email) {
          admin.initializeApp({
            credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://foodbooking-3ccec-default-rtdb.asia-southeast1.firebasedatabase.app'
          });
          initialized = true;
        }
      } catch (parseError) {
        console.warn('Failed to parse FIREBASE_CONFIG, trying other methods...');
      }
    }

    // If not initialized yet, try individual environment variables (for Vercel)
    if (!initialized) {
      const firebaseConfig = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      };

      if (firebaseConfig.private_key && firebaseConfig.client_email && firebaseConfig.project_id) {
        admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://foodbooking-3ccec-default-rtdb.asia-southeast1.firebasedatabase.app'
        });
        initialized = true;
      }
    }

    // Fallback to bundled service account for local dev only
    // Try require first, then fallback to fs.readFileSync (works better with Next.js)
    if (!initialized) {
      try {
        let serviceAccount: admin.ServiceAccount;
        
        // First try require (works in some Next.js configurations)
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          serviceAccount = require('../serviceAccountKey.json');
        } catch (requireError) {
          // If require fails, try reading with fs (more reliable in Next.js)
          const fs = require('fs');
          const path = require('path');
          const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
          const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8');
          serviceAccount = JSON.parse(serviceAccountData);
        }
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://foodbooking-3ccec-default-rtdb.asia-southeast1.firebasedatabase.app'
        });
        initialized = true;
      } catch (loadError: any) {
        // File doesn't exist or can't be loaded - this is expected in production
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Could not load serviceAccountKey.json:', loadError.message);
        }
      }
    }

    // If still not initialized, throw an error
    if (!initialized && !admin.apps.length) {
      throw new Error(
        'Firebase Admin SDK initialization failed. ' +
        'Please ensure either GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_CONFIG, ' +
        'or individual Firebase environment variables (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, etc.) are set, ' +
        'or serviceAccountKey.json exists in the project root.'
      );
    }
  } catch (err: any) {
    // Log the error but don't throw during module load to allow graceful handling in API routes
    console.error('Firebase Admin initialization error:', err);
    // In development, we might want to be more strict
    if (process.env.NODE_ENV === 'development' && err.message.includes('initialization failed')) {
      console.error('\n⚠️  Firebase Admin SDK is not initialized. API routes using Admin SDK will fail.\n');
    }
  }
}

// Export adminDb and adminFieldValue
// During build time, these may not be initialized, but that's OK as API routes only run at runtime
// We use a try-catch to handle build-time scenarios gracefully
let _adminDb: admin.firestore.Firestore | undefined;
let _adminFieldValue: typeof admin.firestore.FieldValue | undefined;

try {
  if (admin.apps.length > 0) {
    _adminDb = admin.firestore();
    _adminFieldValue = admin.firestore.FieldValue;
  }
} catch (error) {
  // During build time, Firebase Admin may not be initialized
  // This is expected and will be initialized at runtime when API routes are called
  console.warn('Firebase Admin exports not initialized during build (this is expected)');
}

// Create getter functions that initialize on first access
export const adminDb = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    if (!_adminDb) {
      if (admin.apps.length === 0) {
        throw new Error('Firebase Admin not initialized. Make sure environment variables are set.');
      }
      _adminDb = admin.firestore();
    }
    return (_adminDb as any)[prop];
  }
});

export const adminFieldValue = new Proxy({} as typeof admin.firestore.FieldValue, {
  get(_target, prop) {
    if (!_adminFieldValue) {
      if (admin.apps.length === 0) {
        throw new Error('Firebase Admin not initialized. Make sure environment variables are set.');
      }
      _adminFieldValue = admin.firestore.FieldValue;
    }
    return (_adminFieldValue as any)[prop];
  }
});

// Helper function to check if Firebase Admin is initialized
export function isFirebaseAdminInitialized(): boolean {
  return admin.apps.length > 0;
}

// Helper function to ensure Firebase Admin is initialized, throws if not
export function ensureFirebaseAdminInitialized(): void {
  if (!admin.apps.length) {
    throw new Error(
      'Firebase Admin SDK is not initialized. ' +
      'Please ensure either GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_CONFIG, ' +
      'or individual Firebase environment variables (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID, etc.) are set, ' +
      'or serviceAccountKey.json exists in the project root.'
    );
  }
}

export default admin;


