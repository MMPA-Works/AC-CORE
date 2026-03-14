import rateLimit from 'express-rate-limit';

export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5, 
  message: { message: 'Too many reports submitted from this IP. Please try again after an hour.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { message: 'Too many failed login attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, 
});