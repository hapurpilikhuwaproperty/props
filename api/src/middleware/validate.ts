import { AnyZodObject } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = schema.parse({ body: req.body, params: req.params, query: req.query });
    req.body = parsed.body ?? req.body;
    req.params = parsed.params ?? req.params;
    req.query = parsed.query ?? req.query;
    return next();
  } catch (err: any) {
    return res.status(400).json({ message: 'Validation failed', errors: err.errors });
  }
};
