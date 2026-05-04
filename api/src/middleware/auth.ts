import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../prisma/client.js';
import { getCookie } from '../utils/cookies.js';
import { config } from '../config.js';
import { hasRole, isSellerRole, normalizeRole } from '../utils/roles.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    sellerVerified: boolean;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    const cookieToken = getCookie(req, config.cookies.accessTokenName);
    const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : cookieToken;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const decoded = verifyAccessToken(token) as { userId: number; role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { role: true } });
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    req.user = { id: user.id, role: normalizeRole(user.role.name), sellerVerified: Boolean(user.sellerVerifiedAt) };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !hasRole(req.user.role, roles)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

export const authenticate = requireAuth;

export const authorize = (roles: string | string[]) => requireRole(Array.isArray(roles) ? roles : [roles]);

export const requireSellerAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (hasRole(req.user.role, ['Admin'])) return next();
  if (!isSellerRole(req.user.role) || !req.user.sellerVerified) {
    return res.status(403).json({ message: 'Seller verification is required' });
  }
  next();
};
