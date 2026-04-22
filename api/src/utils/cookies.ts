import { Request, Response } from 'express';
import { config } from '../config';

type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

const parseCookieHeader = (cookieHeader?: string) =>
  Object.fromEntries(
    (cookieHeader || '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...value] = part.split('=');
        return [decodeURIComponent(name), decodeURIComponent(value.join('='))];
      }),
  );

export const getCookie = (req: Request, name: string) => parseCookieHeader(req.headers.cookie)[name];

export const setSessionCookies = (res: Response, tokens: SessionTokens) => {
  res.cookie(config.cookies.accessTokenName, tokens.accessToken, {
    httpOnly: true,
    sameSite: config.cookies.sameSite,
    secure: config.cookies.secure,
    path: '/',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(config.cookies.refreshTokenName, tokens.refreshToken, {
    httpOnly: true,
    sameSite: config.cookies.sameSite,
    secure: config.cookies.secure,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const clearSessionCookies = (res: Response) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: config.cookies.sameSite,
    secure: config.cookies.secure,
    path: '/',
  } as const;

  res.clearCookie(config.cookies.accessTokenName, cookieOptions);
  res.clearCookie(config.cookies.refreshTokenName, cookieOptions);
};
