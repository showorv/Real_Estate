import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './app/config/env';
import { notFound } from './app/middleware/notFound';
import { globalError } from './app/middleware/globalErrorHandle';
import { router } from './app/routers';


export function createApp(): Application {
  const app = express();

  // --- Security & parsing ---
  app.use(helmet());
  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true, // required so the refresh-token cookie is sent/received
    })
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());

  if (!env.isProduction) {
    app.use(morgan('dev'));
  }

  app.get("/", (req, res) => {
  res.send("Server is running");
});
  // --- Rate limiting (applies to all /api routes; auth routes get a stricter
  // limiter layered on top once the auth module is wired in) ---
//   app.use(
//     '/api',
//     rateLimit({
//       windowMs: env.rateLimit.windowMs,
//       max: env.rateLimit.max,
//       standardHeaders: true,
//       legacyHeaders: false,
//       message: { success: false, message: 'Too many requests, please try again later' },
//     })
//   );

  // --- Routes ---
  app.use('/api/v1', router);

 
  app.use(notFound);
  app.use(globalError);

  return app;
}