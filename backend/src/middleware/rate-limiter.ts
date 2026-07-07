import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

const limiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  limiter.consume(req.ip || '127.0.0.1')
    .then(() => next())
    .catch(() => res.status(429).json({ message: 'Too many requests' }));
}

export const rateLimiter = rateLimiterMiddleware;
