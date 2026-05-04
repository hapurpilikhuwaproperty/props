import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().trim().regex(/^\+?[0-9\s-]{8,16}$/, 'Mobile number is required'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const authStartSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3),
    redirectUrl: z.string().url().optional(),
  }),
});

export const verifyOtpStartSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3),
    code: z.string().regex(/^\d{6}$/),
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(32),
  }),
});

export const magicLinkRequestSchema = z.object({
  body: z.object({
    email: z.string().email(),
    redirectUrl: z.string().url().optional(),
  }),
});

export const magicLinkVerifySchema = z.object({
  body: z.object({
    token: z.string().min(32),
  }),
});

export const mfaVerifySchema = z.object({
  body: z.object({
    challengeId: z.string().min(16),
    code: z.string().regex(/^\d{6}$/),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export const forgotSchema = z.object({
  body: z.object({
    email: z.string().email(),
    redirectUrl: z.string().url().optional(),
  }),
});

export const resetSchema = z.object({
  body: z.object({
    token: z.string().min(32),
    password: z.string().min(8),
  }),
});

export const otpRequestSchema = z.object({
  body: z.object({
    channel: z.enum(['EMAIL', 'PHONE']),
    identifier: z.string().min(3),
  }),
});

export const otpVerifySchema = z.object({
  body: z.object({
    channel: z.enum(['EMAIL', 'PHONE']),
    identifier: z.string().min(3),
    code: z.string().regex(/^\d{6}$/),
  }),
});
