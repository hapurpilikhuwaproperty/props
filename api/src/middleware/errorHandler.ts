import { NextFunction, Request, Response } from 'express';
import { log } from '../utils/logger';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  log.error('Unhandled error', err);
  const status = err.status || 500;
  if (status >= 500) {
    res.status(status).json({
      message: 'Internal server error',
    });
    return;
  }
  res.status(status).json({ message: err.message || 'Request failed', errors: err.errors });
};
