import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../lib/env.js';
import { proxyGeminiRequest } from '../services/geminiProxyService.js';

export function createGeminiRouter() {
  const router = Router();
  const limiter = rateLimit({
    windowMs: env.API_RATE_LIMIT_WINDOW_MS,
    max: env.API_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });

  router.post('/gemini', limiter, async (req, res, next) => {
    try {
      await proxyGeminiRequest(req, res);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
