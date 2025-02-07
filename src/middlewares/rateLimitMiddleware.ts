import rateLimit from "express-rate-limit";

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 uploads per 15 minutes per IP
  message: "Too many uploads! Please try again later.",
  headers: true,
});
