import morgan from 'morgan';
import { RequestHandler } from 'express';

export const httpLogger: RequestHandler = morgan(':method :url :status :response-time ms');

export const log = {
  info: (msg: string, meta?: unknown) => console.info(msg, meta ?? ''),
  error: (msg: string, meta?: unknown) => console.error(msg, meta ?? ''),
};
