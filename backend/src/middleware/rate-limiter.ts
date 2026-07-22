import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';

const rateLimiterOptions = {
  points: Number(process.env.RATE_LIMIT_POINTS) || 100,
  duration: Number(process.env.RATE_LIMIT_DURATION) || 60,
  blockDuration: Number(process.env.RATE_LIMIT_BLOCK_DURATION) || 60,
};

const limiter = new RateLimiterMemory(rateLimiterOptions);

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || '127.0.0.1';

  limiter.consume(key)
    .then(() => next())
    .catch((rejRes) => {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', String(secs));
      res.status(429).json({ message: 'Too many requests', retryAfter: secs });
    });
}

export const rateLimiter = rateLimiterMiddleware;
