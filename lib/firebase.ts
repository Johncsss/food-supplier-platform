import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from '../shared/firebase-config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only on client side
let analytics: any = null;
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  }).catch(() => {
    // Analytics not available
    console.log('Analytics not available');
  });

  // Optionally initialize App Check if site key is provided
  const appCheckSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
  if (appCheckSiteKey) {
    // Enable debug token in local dev to simplify setup
    // @ts-ignore
    if (typeof window !== 'undefined' && location.hostname === 'localhost') {
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(appCheckSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
        console.log('App Check initialized');
      } catch (err) {
        console.warn('App Check initialization failed:', err);
      }
    }).catch(() => {
      console.log('App Check not available');
    });
  }
}

export { analytics };

export default app; 