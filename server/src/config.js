import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};

if (config.nodeEnv === 'production' && config.jwtSecret === 'dev-insecure-secret-change-me') {
  // Fail fast: never run production with the default secret.
  throw new Error('JWT_SECRET must be set in production.');
}
