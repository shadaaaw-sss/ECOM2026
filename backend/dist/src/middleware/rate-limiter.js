import { RateLimiterMemory } from 'rate-limiter-flexible';
const limiter = new RateLimiterMemory({
    points: 100,
    duration: 60,
});
export function rateLimiterMiddleware(req, res, next) {
    limiter.consume(req.ip || '127.0.0.1')
        .then(() => next())
        .catch(() => res.status(429).json({ message: 'Too many requests' }));
}
export const rateLimiter = rateLimiterMiddleware;
