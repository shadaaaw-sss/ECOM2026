import { NextFunction, Request, Response } from 'express';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (err instanceof Error) {
    if (isDevelopment) {
      return res.status(500).json({ message: err.message, stack: err.stack });
    }
    return res.status(500).json({ message: err.message });
  }

  return res.status(500).json({ message: 'Internal server error' });
}
