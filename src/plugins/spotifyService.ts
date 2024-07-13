import fastifyPlugin from 'fastify-plugin';
import CacheService from '../services/CacheService';
import { caching } from 'cache-manager';
import redisStore from '@jmrl23/redis-store';
import { REDIS_URL } from '../lib/constant/env';
import SpotifyService from '../services/SpotifyService';

declare module 'fastify' {
  interface FastifyInstance {
    spotifyService: SpotifyService;
  }
}

export default fastifyPlugin(async function spotifyService(app) {
  const cacheService = new CacheService(
    await caching(
      redisStore({
        url: REDIS_URL,
        prefix: 'SpotifyService',
      }),
    ),
  );
  const spotifyService = new SpotifyService(cacheService);

  app.decorate('spotifyService', spotifyService);
});
