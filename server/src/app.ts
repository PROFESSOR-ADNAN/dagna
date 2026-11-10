import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.routes.js';
import { problemRouter } from './routes/problem.routes.js';
import { submissionRouter } from './routes/submission.routes.js';
import { contestRouter } from './routes/contest.routes.js';
import { groupRouter } from './routes/group.routes.js';
import { userRouter } from './routes/user.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { streamRouter } from './routes/stream.routes.js';
import { judgeRouter } from './routes/judge.routes.js';
import { paymentRouter } from './routes/payment.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Security headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    })
  );

  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '128kb' })); // Max JSON size strictly bounded

  // Health endpoint for Docker and Load Balancers
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
  });

  // Public API surface (v1)
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/problems', problemRouter);
  app.use('/api/v1/submissions', submissionRouter);
  app.use('/api/v1/contests', contestRouter);
  app.use('/api/v1/groups', groupRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/payments', paymentRouter);
  app.use('/api/v1', streamRouter);

  // Private Judge Gateway surface (v1)
  app.use('/judge/v1', judgeRouter);

  // Centralized RFC 9457 error handler
  app.use(errorHandler);

  return app;
}
