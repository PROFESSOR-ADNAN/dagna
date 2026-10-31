import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: unknown;
}

export class AppError extends Error {
  public statusCode: number;
  public type: string;
  public details?: unknown;

  constructor(message: string, statusCode = 400, type = 'about:blank', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const instance = req.originalUrl || req.url;

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      type: err.type,
      title: err.message,
      status: err.statusCode,
      detail: err.message,
      instance,
      errors: err.details,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      type: 'https://dagna.dev/errors/validation',
      title: 'Validation Error',
      status: 400,
      detail: 'The submitted request payload failed schema validation.',
      instance,
      errors: err.flatten(),
    });
    return;
  }

  console.error('Unhandled Server Exception:', err);

  res.status(500).json({
    type: 'https://dagna.dev/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected internal error occurred. Our engineering team has been notified.',
    instance,
  });
}
