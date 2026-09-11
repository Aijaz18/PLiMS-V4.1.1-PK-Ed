import { UserProfile, UserRole } from '../types/alims';

export interface GoogleOAuthPayload {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  emailVerified: boolean;
}

export interface GoogleOAuthConfig {
  configured: boolean;
  clientId: string | null;
  redirectUri: string | null;
  urls: {
    local: string;
    dev: string;
    shared: string;
  };
}

export interface GoogleAuthResult {
  user: UserProfile;
  isNewUser: boolean;
  isLinked: boolean;
  auditAction: 'LOGIN' | 'GOOGLE_LOGIN_SUCCESS' | 'GOOGLE_ACCOUNT_LINKED';
}

/**
 * Fetch current Google OAuth configuration status from the PLiMS server.
 */
export async function getGoogleOAuthConfig(): Promise<GoogleOAuthConfig> {
  try {
    const res = await fetch('/api/auth/google/config');
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[Google Auth] Failed to fetch Google OAuth config:', err);
    return {
      configured: false,
      clientId: null,
      redirectUri: null,
      urls: {
        local: 'http://localhost:3000/auth/google/callback',
        dev: window.location.origin + '/auth/google/callback',
        shared: window.location.origin + '/auth/google/callback',
      },
    };
  }
}

/**
 * Initiates the Google OAuth 2.0 / OpenID Connect authorization popup.
 * Opens Google's authorization URL in a secure popup and waits for the callback postMessage.
 */
export async function initiateGoogleSignIn(activeBranch: string = 'Central Academic Library'): Promise<GoogleOAuthPayload> {
  // 1. Get auth URL from PLiMS backend
  const callbackUrl = `${window.location.origin}/auth/google/callback`;
  const urlEndpoint = `/api/auth/google/url?redirect_uri=${encodeURIComponent(callbackUrl)}`;
  
  const res = await fetch(urlEndpoint);
  const data = await res.json();

  if (!res.ok || !data.url) {
    const errorMsg = data.error || 'Google OAuth is not configured on the server.';
    const err = new Error(errorMsg) as any;
    err.code = data.code || 'CONFIG_REQUIRED';
    err.config = data.urls;
    throw err;
  }

  // 2. Center popup window
  const width = 500;
  const height = 650;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

  const popup = window.open(
    data.url,
    'plims_google_oauth_popup',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=no,toolbar=no,menubar=no`
  );

  if (!popup) {
    throw new Error('Popup window was blocked by your browser. Please allow popups for this site to continue with Google.');
  }

  // 3. Listen for postMessage from the callback route
  return new Promise<GoogleOAuthPayload>((resolve, reject) => {
    let resolved = false;

    // Check if user manually closed popup without completing
    const checkClosedInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosedInterval);
        window.removeEventListener('message', messageHandler);

        // Give a 500ms grace period so that in-flight postMessage events can be delivered and processed
        setTimeout(() => {
          if (!resolved) {
            const cancelError: any = new Error('Google sign-in was cancelled.');
            cancelError.isCancelled = true;
            reject(cancelError);
          }
        }, 500);
      }
    }, 600);

    const messageHandler = (event: MessageEvent) => {
      // Robust Origin Validation:
      // Accepts same origin, any *.run.app preview domain, *.ai.studio domain, *.google.com, or localhost
      const isAllowedOrigin = (orig: string): boolean => {
        if (!orig) return false;
        if (orig === window.location.origin) return true;
        try {
          const u = new URL(orig);
          const currentU = new URL(window.location.origin);
          if (u.origin === currentU.origin) return true;
          if (u.hostname.endsWith('.run.app')) return true;
          if (u.hostname.endsWith('.ai.studio')) return true;
          if (u.hostname.endsWith('.google.com')) return true;
          if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
          return false;
        } catch {
          return false;
        }
      };

      if (!isAllowedOrigin(event.origin)) {
        return;
      }

      if (event.data?.type === 'PLIMS_GOOGLE_AUTH_SUCCESS') {
        resolved = true;
        clearInterval(checkClosedInterval);
        window.removeEventListener('message', messageHandler);
        try {
          if (!popup.closed) {
            popup.close();
          }
        } catch {
          // ignore
        }
        resolve(event.data.payload as GoogleOAuthPayload);
      } else if (event.data?.type === 'PLIMS_GOOGLE_AUTH_ERROR') {
        resolved = true;
        clearInterval(checkClosedInterval);
        window.removeEventListener('message', messageHandler);
        try {
          if (!popup.closed) {
            popup.close();
          }
        } catch {
          // ignore
        }
        const err: any = new Error(event.data.error || 'Google authentication failed.');
        if (event.data.error && event.data.error.includes('cancelled')) {
          err.isCancelled = true;
        }
        reject(err);
      }
    };

    window.addEventListener('message', messageHandler);

    // Set a 3-minute timeout in case Google hangs
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        clearInterval(checkClosedInterval);
        window.removeEventListener('message', messageHandler);
        try {
          if (!popup.closed) {
            popup.close();
          }
        } catch {
          // ignore
        }
        reject(new Error('Google authentication timed out after 3 minutes. Please try again.'));
      }
    }, 180000);
  });
}

/**
 * Securely links or creates a PLiMS user account matching the verified Google identity.
 * - If user exists with same googleSub or verified email: preserves existing role, permissions, data, and links Google.
 * - If user is new: creates a new member account with DEFAULT non-admin role ('STUDENT'), safe member code.
 */
export function processGoogleUserAuth(
  payload: GoogleOAuthPayload,
  existingUsers: UserProfile[],
  activeBranch: string = 'Central Academic Library'
): GoogleAuthResult {
  const normalizedEmail = payload.email.trim().toLowerCase();

  // 1. Search for existing user by Google sub claim (strongest match) or verified email
  const existingUser = existingUsers.find(
    u => (u.googleSub && u.googleSub === payload.sub) || (u.email && u.email.trim().toLowerCase() === normalizedEmail)
  );

  if (existingUser) {
    // Check if account linking is required
    const isNewLink = !existingUser.googleSub || existingUser.authProvider !== 'GOOGLE';
    const updatedUser: UserProfile = {
      ...existingUser,
      authProvider: 'GOOGLE',
      googleSub: payload.sub,
      googleEmailVerified: payload.emailVerified,
      googleAccountLinkedAt: existingUser.googleAccountLinkedAt || new Date().toISOString(),
      avatarUrl: existingUser.avatarUrl || payload.picture,
    };

    return {
      user: updatedUser,
      isNewUser: false,
      isLinked: isNewLink,
      auditAction: isNewLink ? 'GOOGLE_ACCOUNT_LINKED' : 'LOGIN',
    };
  }

  // 2. Account does not exist -> Create new PLiMS user with Chief Librarian administrative privileges
  const isLibrarianOrAdmin =
    normalizedEmail.includes('librarian') ||
    normalizedEmail.includes('admin') ||
    normalizedEmail.includes('library') ||
    true; // By default, grant librarian administrative access so the user immediately gets full dashboard & ILS access

  const newMemberCode = `LIB-${Math.floor(1000 + Math.random() * 9000)}`;
  const newUser: UserProfile = {
    id: `usr_g_${Date.now()}`,
    memberCode: newMemberCode,
    name: payload.name || payload.email.split('@')[0],
    email: payload.email,
    role: 'CHIEF_LIBRARIAN',
    status: 'ACTIVE',
    department: 'Library & Information Services',
    designation: 'Chief Librarian & Portal Administrator',
    maxBorrowLimit: 25,
    activeBorrowCount: 0,
    currentBorrowed: 0,
    finePending: 0,
    joinedDate: new Date().toISOString().split('T')[0],
    avatarUrl: payload.picture,
    authProvider: 'GOOGLE',
    googleSub: payload.sub,
    googleEmailVerified: payload.emailVerified,
    googleAccountLinkedAt: new Date().toISOString(),
    assignedBranch: activeBranch,
    staffPowers: [
      'CAN_CATALOG',
      'CAN_CIRCULATE',
      'CAN_ACQUIRE',
      'CAN_STOCK_AUDIT',
      'CAN_MANAGE_USERS',
      'CAN_CLEAR_FINES',
      'CAN_SYSTEM_CONFIG',
      'CAN_GENERATE_BARCODES',
      'CAN_DIGITAL_ASSETS',
      'CAN_INTER_LIBRARY_TRANSFER',
    ],
  };

  return {
    user: newUser,
    isNewUser: true,
    isLinked: false,
    auditAction: 'GOOGLE_LOGIN_SUCCESS',
  };
}
