import { ZodError, type ZodTypeAny, type z } from 'zod';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** An Error that carries an HTTP status for the central error handler. */
export interface HttpError extends Error {
  status?: number;
}

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown> | unknown;

/**
 * Wrap an async route handler so thrown errors reach Express' error handler.
 */
export function asyncHandler(fn: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/**
 * Parse a request body with a zod schema. Throws a tagged error on failure
 * that the central error handler turns into a 400.
 */
export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.infer<S> {
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.issues[0];
      const e: HttpError = new Error(first ? first.message : 'Dữ liệu không hợp lệ.');
      e.status = 400;
      throw e;
    }
    throw err;
  }
}

/** YYYY-MM string for a Date. */
export function monthKey(date: Date | string | number): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
