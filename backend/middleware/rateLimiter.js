/**
 * Sliding window rate limiter middleware for production protection
 */
const rateLimitMap = new Map();

// Periodic cleanup of expired records to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

const rateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
  const max = options.max || 100; // 100 requests per window default
  const message = options.message || {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  };

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test') return next();

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.baseUrl || ''}:${ip}`;
    const now = Date.now();

    let record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitMap.set(key, record);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    record.count += 1;
    const remaining = Math.max(0, max - record.count);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res.status(429).json(message);
    }

    next();
  };
};

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

const aiLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: { success: false, message: 'AI rate limit exceeded. Please wait a minute before trying again.' },
});

module.exports = {
  rateLimiter,
  apiLimiter,
  authLimiter,
  aiLimiter,
};
