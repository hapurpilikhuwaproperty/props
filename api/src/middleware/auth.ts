import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../prisma/client';
import { getCookie } from '../utils/cookies';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
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
    req.user = { id: user.id, role: user.role.name };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};
