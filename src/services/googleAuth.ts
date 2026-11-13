import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse or initialize the app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline'
});

// Flag to prevent race conditions during popup
let isSigningIn = false;
// Cache access token strictly in memory (per skill requirements)
let cachedAccessToken: string | null = null;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token might need re-prompt or user interaction
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Direct Google Identity Services (GIS) OAuth Token Client
 * Bypasses Firebase Auth domain restrictions when running on web domains like GitHub Pages
 */
export const signInWithGoogleIdentityServices = (): Promise<{ user: any; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.oauth2) {
      return reject(new Error('Google Identity Services SDK belum terpasang atau sedang memuat. Silakan muat ulang halaman.'));
    }

    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId || '608568671536-870d7pjf4b48odafnspu5i8jqurp4sip.apps.googleusercontent.com',
        scope: SCOPES.join(' '),
        callback: async (resp: any) => {
          if (resp.error) {
            return reject(new Error(`Google OAuth error: ${resp.error}`));
          }
          if (resp.access_token) {
            cachedAccessToken = resp.access_token;
            try {
              const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${resp.access_token}` }
              });
              if (uRes.ok) {
                const uInfo = await uRes.json();
                const gisUser = {
                  email: uInfo.email || 'workspace-user@gmcc.id',
                  displayName: uInfo.name || uInfo.email || 'Google User'
                };
                return resolve({ user: gisUser, accessToken: resp.access_token });
              }
            } catch {
              // Ignore userinfo failure, token is valid for Sheets & Drive
            }
            return resolve({
              user: { email: 'workspace-user@gmcc.id', displayName: 'Google Workspace User' },
              accessToken: resp.access_token
            });
          }
          reject(new Error('Tidak ada access token yang diterima dari Google.'));
        }
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (gisInitErr) {
      reject(gisInitErr);
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        cachedAccessToken = credential.accessToken;
        return { user: result.user, accessToken: cachedAccessToken };
      }
    } catch (fbErr: any) {
      const isDomainErr = 
        fbErr?.code === 'auth/unauthorized-domain' || 
        String(fbErr?.message || '').toLowerCase().includes('unauthorized-domain');

      if (isDomainErr && typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
        console.warn('Firebase unauthorized-domain detected. Falling back to Google Identity Services token flow...');
        return await signInWithGoogleIdentityServices();
      }
      throw fbErr;
    }
    throw new Error('Gagal mendapatkan token autentikasi Google.');
  } catch (err: any) {
    console.error('Google Sign-in Error:', err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const signOutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
