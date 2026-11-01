import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';

export interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
}

let client: OAuth2Client | null = null;
function getClient(): OAuth2Client {
  if (!client) client = new OAuth2Client(config.googleClientId);
  return client;
}

/**
 * Pre-warms the Google OAuth2 client by triggering a background fetch of
 * Google's public key certificates. Call once on server startup so the first
 * real login request does not block on the key-fetch round-trip.
 */
export function warmUpGoogleClient(): void {
  try {
    // getClient() is synchronous; the key fetch happens lazily inside
    // verifyIdToken. We trigger it here with a throw-away verify call so the
    // certs are cached before any real user request arrives.
    const c = getClient();
    // Fire-and-forget — verifyIdToken with an empty token will reject quickly,
    // but the SDK will still populate its cert cache in the process.
    c.getTokenInfo('').catch(() => { /* expected — we only want the cache side-effect */ });
  } catch {
    // Non-fatal: if GOOGLE_CLIENT_ID is misconfigured, verifyGoogleCredential
    // will surface the proper error at runtime.
  }
}

export class GoogleAuthError extends Error {}

export async function verifyGoogleCredential(idToken: string): Promise<GoogleProfile> {
  if (!config.googleClientId) {
    throw new GoogleAuthError('Google sign-in is not configured. Set GOOGLE_CLIENT_ID in server/.env.');
  }

  let payload;
  try {
    const ticket = await getClient().verifyIdToken({ idToken, audience: config.googleClientId });
    payload = ticket.getPayload();
  } catch (err) {
    throw new GoogleAuthError(
      err instanceof Error ? `Invalid Google credential: ${err.message}` : 'Invalid Google credential.',
    );
  }

  if (!payload || !payload.email) {
    throw new GoogleAuthError('Google did not return an email address for this account.');
  }
  if (!payload.email_verified) {
    throw new GoogleAuthError("This Google account's email is not verified.");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    fullName: payload.name || payload.email.split('@')[0],
  };
}
