import jwt from 'jsonwebtoken';
import { config } from '../config';

export const signAccessToken = (payload: object) =>
  jwt.sign(payload, config.accessTokenSecret as jwt.Secret, {
    expiresIn: config.accessTokenTtl as jwt.SignOptions['expiresIn'],
  });

export const signRefreshToken = (payload: object) =>
  jwt.sign(payload, config.refreshTokenSecret as jwt.Secret, {
    expiresIn: config.refreshTokenTtl as jwt.SignOptions['expiresIn'],
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.accessTokenSecret);

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.refreshTokenSecret);
