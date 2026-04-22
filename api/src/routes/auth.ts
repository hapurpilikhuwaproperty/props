import { Response, Router } from 'express';
import { validate } from '../middleware/validate';
import { authLimiter, forgotPasswordLimiter, otpRequestLimiter, otpVerifyLimiter, refreshLimiter } from '../middleware/rateLimit';
import { forgotSchema, loginSchema, otpRequestSchema, otpVerifySchema, refreshSchema, registerSchema, resetSchema } from '../schemas/authSchemas';
import * as authService from '../services/authService';
import { requestOtp, verifyOtp } from '../services/otpService';
import { createReset, completeReset } from '../services/resetService';
import { clearSessionCookies, getCookie, setSessionCookies } from '../utils/cookies';
import { config } from '../config';

const router = Router();

const respondWithSession = (res: Response, session: Awaited<ReturnType<typeof authService.issueTokens>>) => {
  setSessionCookies(res, { accessToken: session.accessToken, refreshToken: session.refreshToken! });
  res.json({ user: session.user });
};

router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const session = await authService.register(name, email, password, phone);
    setSessionCookies(res, { accessToken: session.accessToken, refreshToken: session.refreshToken! });
    res.status(201).json({ user: session.user });
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const session = await authService.login(email, password);
    respondWithSession(res, session);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', refreshLimiter, validate(refreshSchema), async (req, res, next) => {
  try {
    const refreshToken = req.body.refreshToken || getCookie(req, config.cookies.refreshTokenName);
    if (!refreshToken) throw { status: 401, message: 'Invalid refresh token' };
    const session = await authService.refresh(refreshToken);
    respondWithSession(res, session);
  } catch (err) {
    next(err);
  }
});

router.get('/session', async (req, res, next) => {
  try {
    const accessToken = getCookie(req, config.cookies.accessTokenName);
    const refreshToken = getCookie(req, config.cookies.refreshTokenName);
    const session = await authService.resolveSession(accessToken, refreshToken);
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

// Password reset (placeholder: issue a token, email link). For now just 200.
router.post('/forgot', forgotPasswordLimiter, validate(forgotSchema), async (req, res, next) => {
  try {
    await createReset(req.body.email);
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
    await requestOtp(req.body.email);
    res.json({ status: 'sent' });
  } catch (err) {
    next(err);
  }
});

router.post('/otp/verify', otpVerifyLimiter, validate(otpVerifySchema), async (req, res, next) => {
  try {
    const session = await verifyOtp(req.body.email, req.body.code);
    respondWithSession(res, session);
  } catch (err) {
    next(err);
  }
});

export default router;
