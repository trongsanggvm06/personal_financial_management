// Augment Express' Request with the fields our auth middleware attaches.
import 'express';

declare global {
  namespace Express {
    interface Request {
      // Set by requireAuth once a valid Bearer token is verified.
      userId: string;
    }
  }
}

export {};
