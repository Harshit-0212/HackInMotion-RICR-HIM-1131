import { Router } from 'express';
import multer from 'multer';
import { userStore, type StoredUser } from '../lib/users.js';
import { verifyGoogleCredential, GoogleAuthError } from '../lib/googleAuth.js';
import { requireAuth, signToken, type AuthedRequest } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { passwordResetTokenStore } from '../lib/passwordResetTokens.js';
import { sendPasswordResetEmail } from '../lib/email.js';
import { config } from '../config.js';

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_FORGOT_MESSAGE = 'If an account exists for that email, a reset link is on its way.';

const AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (AVATAR_MIME_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type. Please upload a JPG, PNG, or WEBP image.'));
  },
});

function toBackendUser(user: StoredUser) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    user_metadata: { full_name: user.full_name, avatar_image: user.avatar_image ?? null },
  };
}

authRouter.post('/signup', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), async (req, res) => {
  const { email, password, options } = req.body ?? {};
  const fullName = options?.data?.full_name?.trim();

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: { message: 'Email is required.' } });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: { message: 'Password must be at least 8 characters.' } });
    return;
  }

  try {
    const user = await userStore.create(email.trim().toLowerCase(), password, fullName || email.split('@')[0]);
    const token = signToken(user.id);
    res.json({ data: { session: { access_token: token }, user: toBackendUser(user) } });
  } catch (err) {
    res.status(409).json({ error: { message: err instanceof Error ? err.message : 'Signup failed.' } });
  }
});

authRouter.post('/signin', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: { message: 'Email and password are required.' } });
    return;
  }

  const user = await userStore.findByEmail(String(email).trim().toLowerCase());
  if (!user || !(await userStore.verifyPassword(user, password))) {
    res.status(401).json({ error: { message: 'Invalid email or password.' } });
    return;
  }

  const token = signToken(user.id);
  res.json({ data: { session: { access_token: token }, user: toBackendUser(user) } });
});

authRouter.post('/google', async (req, res) => {
  const { credential } = req.body ?? {};

  if (!credential || typeof credential !== 'string') {
    res.status(400).json({ error: { message: 'A Google credential is required.' } });
    return;
  }

  try {
    const profile = await verifyGoogleCredential(credential);
    const user = await userStore.findOrCreateByGoogle(profile.email, profile.googleId, profile.fullName);
    const token = signToken(user.id);
    res.json({ data: { session: { access_token: token }, user: toBackendUser(user) } });
  } catch (err) {
    if (err instanceof GoogleAuthError) {
      res.status(401).json({ error: { message: err.message } });
      return;
    }
    console.error('Google sign-in failed:', err);
    res.status(500).json({ error: { message: 'Something went wrong. Please try again.' } });
  }
});

authRouter.post('/forgot-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), async (req, res) => {
  const { email } = req.body ?? {};

  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    res.status(400).json({ error: { message: 'A valid email address is required.' } });
    return;
  }

  // Only populated when RESEND_API_KEY isn't configured, so the link is still reachable in local dev.
  let devResetUrl: string | undefined;

  try {
    const user = await userStore.findByEmail(email.trim().toLowerCase());
    if (user) {
      const token = await passwordResetTokenStore.create(user.id);
      const resetUrl = `${config.clientOrigin}/reset-password?token=${token}`;
      if (!config.resendApiKey) {
        devResetUrl = resetUrl;
      } else {
        // Fire-and-forget: don't make the caller wait on the email API round-trip.
        sendPasswordResetEmail(user.email, resetUrl).catch((err) =>
          console.error('Failed to send password reset email:', err instanceof Error ? err.message : err),
        );
      }
    }
  } catch (err) {
    console.error('Forgot-password request failed:', err);
  }

  // Always return the same generic response so we never reveal whether an email is registered.
  res.json({ data: { message: GENERIC_FORGOT_MESSAGE, devResetUrl } });
});

authRouter.get('/verify-reset-token', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), async (req, res) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';

  if (!token) {
    res.status(400).json({ error: { message: 'A reset token is required.' } });
    return;
  }

  const match = await passwordResetTokenStore.findValid(token);
  if (!match) {
    res.status(400).json({ error: { message: 'This reset link is invalid or has expired.' } });
    return;
  }

  res.json({ data: { valid: true } });
});

authRouter.post('/reset-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), async (req, res) => {
  const { token, password } = req.body ?? {};

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: { message: 'A reset token is required.' } });
    return;
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: { message: 'Password must be at least 8 characters.' } });
    return;
  }

  const consumed = await passwordResetTokenStore.consume(token);
  if (!consumed) {
    res.status(400).json({ error: { message: 'This reset link is invalid or has expired.' } });
    return;
  }

  await userStore.updatePassword(consumed.userId, password);
  res.json({ data: { message: 'Password updated. You can now sign in with your new password.' } });
});

authRouter.post('/avatar', requireAuth, (req: AuthedRequest, res) => {
  avatarUpload.single('avatar')(req, res, async (uploadErr) => {
    if (uploadErr) {
      const message =
        uploadErr instanceof multer.MulterError && uploadErr.code === 'LIMIT_FILE_SIZE'
          ? 'Image is too large. Maximum size is 2MB.'
          : uploadErr instanceof Error
            ? uploadErr.message
            : 'Upload failed.';
      res.status(400).json({ error: { message } });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: { message: 'No image was uploaded.' } });
      return;
    }

    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    await userStore.updateAvatar(req.userId!, dataUrl);

    const user = await userStore.findById(req.userId!);
    res.json({ data: { user: toBackendUser(user!) } });
  });
});

authRouter.get('/session', requireAuth, async (req: AuthedRequest, res) => {
  const user = await userStore.findById(req.userId!);
  if (!user) {
    res.json({ data: { session: null } });
    return;
  }
  res.json({ data: { session: { user: toBackendUser(user) } } });
});
