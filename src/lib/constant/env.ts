import env from 'env-var';

export const NODE_ENV = process.env.NODE_ENV;

export const SERVER_HOST = env.get('SERVER_HOST').default('0.0.0.0').asString();

export const PORT = env.get('PORT').default(3001).asPortNumber();

export const REDIS_URL = env.get('REDIS_URL').required().asUrlString();

export const SPOTIFY_CLIENT_ID = env
  .get('SPOTIFY_CLIENT_ID')
  .required()
  .asString();

export const SPOTIFY_CLIENT_SECRET = env
  .get('SPOTIFY_CLIENT_SECRET')
  .required()
  .asString();

export const SPOTIFY_REDIRECT_URI = env
  .get('SPOTIFY_REDIRECT_URI')
  .required()
  .asString();
