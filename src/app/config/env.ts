import dotenv from 'dotenv';

dotenv.config();


function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT ?? 5001),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',

  mongoUri: required('MONGODB_URI'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: required('JWT_REFRESH_SECRET'),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
    refreshCookieName: process.env.REFRESH_COOKIE_NAME ?? 're_refresh_token',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:5000/api/v1/auth/google/callback',
    // Where the browser lands after a successful Google login — the frontend
    // then calls /auth/refresh (cookie is already set) to get an access token.
    frontendRedirect:
      process.env.FRONTEND_GOOGLE_REDIRECT ??
      `${process.env.CORS_ORIGIN ?? 'http://localhost:3000'}/auth/callback`,
    get isConfigured() {
      return Boolean(this.clientId && this.clientSecret);
    },
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },

  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY ?? '',

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 200),
  },
};