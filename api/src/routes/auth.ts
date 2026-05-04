import { Response, Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authLimiter, forgotPasswordLimiter, otpRequestLimiter, otpVerifyLimiter, refreshLimiter } from '../middleware/rateLimit.js';
import {
  authStartSchema,
  forgotSchema,
  googleLoginSchema,
  loginSchema,
  magicLinkRequestSchema,
  magicLinkVerifySchema,
  mfaVerifySchema,
  otpRequestSchema,
  otpVerifySchema,
  refreshSchema,
  registerSchema,
  resetSchema,
  verifyOtpStartSchema,
} from '../schemas/authSchemas.js';
import * as authService from '../services/authService.js';
import { requestOtp, verifyOtp } from '../services/otpService.js';
import { createReset, completeReset } from '../services/resetService.js';
import { clearSessionCookies, getCookie, setSessionCookies } from '../utils/cookies.js';
import { config, resolveFrontendUrl } from '../config.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

const sessionContext = (req: AuthRequest): authService.SessionContext => ({
  userAgent: req.get('user-agent') || undefined,
  ipAddress: req.ip,
});

const respondWithAuthResult = (res: Response, result: authService.AuthResult, status = 200) => {
  if ('mfaRequired' in result) {
    return res.status(202).json(result);
  }
  setSessionCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken });
  return res.status(status).json({ user: result.user });
};

const isEmailIdentifier = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isPhoneIdentifier = (value: string) => /^\+?[0-9\s-]{8,16}$/.test(value.trim());

router.post('/start', authLimiter, validate(authStartSchema), async (req, res, next) => {
  try {
    const identifier = req.body.identifier.trim();

    if (isEmailIdentifier(identifier)) {
      const result = await authService.requestMagicLink(identifier, req.body.redirectUrl);
      return res.json(result);
    }

    if (isPhoneIdentifier(identifier)) {
      return res.status(400).json({ message: 'Phone OTP login is coming soon. Use email login for now.' });
    }

    return res.status(400).json({ message: 'Enter a valid email address' });
  } catch (err) {
    next(err);
  }
});

router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const session = await authService.register(name, email, password, phone, sessionContext(req));
    respondWithAuthResult(res, session, 201);
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const session = await authService.login(email, password, sessionContext(req));
    respondWithAuthResult(res, session);
  } catch (err) {
    next(err);
  }
});

router.post('/google', authLimiter, validate(googleLoginSchema), async (req, res, next) => {
  try {
    const session = await authService.loginWithGoogle(req.body.idToken, sessionContext(req));
    respondWithAuthResult(res, session);
  } catch (err) {
    next(err);
  }
});

router.post('/magic/request', authLimiter, validate(magicLinkRequestSchema), async (req, res, next) => {
  try {
    const result = await authService.requestMagicLink(req.body.email, req.body.redirectUrl);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/magic/verify', authLimiter, validate(magicLinkVerifySchema), async (req, res, next) => {
  try {
    const session = await authService.verifyMagicLink(req.body.token, sessionContext(req));
    respondWithAuthResult(res, session);
  } catch (err) {
    next(err);
  }
});

router.get('/magic-link', authLimiter, async (req, res, next) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const frontendUrl = resolveFrontendUrl(typeof req.query.redirect === 'string' ? req.query.redirect : undefined);
    if (!token) return res.redirect(`${frontendUrl}/auth/login?error=invalid_magic_link`);

    const session = await authService.verifyMagicLink(token, sessionContext(req));
    if ('mfaRequired' in session) {
      return res.redirect(`${frontendUrl}/auth/login?mfa=required`);
    }

    setSessionCookies(res, { accessToken: session.accessToken, refreshToken: session.refreshToken });
    return res.redirect(`${frontendUrl}/dashboard`);
  } catch (err) {
    next(err);
  }
});

router.post('/mfa/verify', authLimiter, validate(mfaVerifySchema), async (req, res, next) => {
  try {
    const session = await authService.verifyAdminMfa(req.body.challengeId, req.body.code, sessionContext(req));
    respondWithAuthResult(res, session);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', refreshLimiter, validate(refreshSchema), async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || getCookie(req, config.cookies.refreshTokenName);
    if (!refreshToken) throw { status: 401, message: 'Invalid refresh token' };
    const session = await authService.refresh(refreshToken, sessionContext(req));
    respondWithAuthResult(res, session);
  } catch (err) {
    clearSessionCookies(res);
    next(err);
  }
});

router.get('/session', async (req, res, next) => {
  try {
    const accessToken = getCookie(req, config.cookies.accessTokenName);
    const refreshToken = getCookie(req, config.cookies.refreshTokenName);
    const session = await authService.resolveSession(accessToken, refreshToken, sessionContext(req));
    if (session.tokens) setSessionCookies(res, session.tokens);
    res.json({ user: session.user });
  } catch (err) {
    clearSessionCookies(res);
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = getCookie(req, config.cookies.refreshTokenName);
    await authService.logout(refreshToken);
    clearSessionCookies(res);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

router.get('/sessions', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const sessions = await authService.listSessions(req.user!.id);
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

router.delete('/sessions/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId) || sessionId <= 0) return res.status(400).json({ message: 'Invalid session id' });
    await authService.revokeSession(req.user!.id, sessionId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/seller/request', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await authService.requestSellerUpgrade(req.user!.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// Password reset fallback for users who explicitly set a password.
router.post('/forgot', forgotPasswordLimiter, validate(forgotSchema), async (req, res, next) => {
  try {
    await createReset(req.body.email, req.body.redirectUrl);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

router.post('/reset', validate(resetSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await completeReset(token, password);
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

router.post('/otp/request', otpRequestLimiter, validate(otpRequestSchema), async (req, res, next) => {
  try {
    await requestOtp({ channel: req.body.channel, identifier: req.body.identifier });
    res.json({ status: 'sent' });
  } catch (err) {
    next(err);
  }
});

router.post('/otp/verify', otpVerifyLimiter, validate(otpVerifySchema), async (req, res, next) => {
  try {
    const session = await verifyOtp(
      { channel: req.body.channel, identifier: req.body.identifier, code: req.body.code },
      sessionContext(req),
    );
    respondWithAuthResult(res, session);
  } catch (err) {
    next(err);
  }
});

router.post('/verify-otp', otpVerifyLimiter, validate(verifyOtpStartSchema), async (req, res, next) => {
  try {
    const session = await verifyOtp(
      { channel: 'PHONE', identifier: req.body.identifier, code: req.body.code },
      sessionContext(req),
    );
    respondWithAuthResult(res, session);
  } catch (err) {
    next(err);
  }
});

export default router;
