import type { FastifyRequest } from 'fastify';
import { asRoute } from '../lib/util/typings';
import spotifyApiProxy from '../plugins/spotifyApiProxy';
import {
  type SpotifyBadge,
  spotifyBadgeSchema,
  type SpotifyCallbackQuery,
  spotifyCallbackQuerySchema,
  type SpotifyPlayer,
  spotifyPlayerSchema,
} from '../schemas/spotify';

export const prefix = '/spotify';

export default asRoute(async function spotifyRoute(app) {
  await app.register(spotifyApiProxy);

  app

    .route({
      method: 'GET',
      url: '/login',
      schema: {
        description: 'login to spotify',
        tags: ['spotify'],
      },
      async handler(_, reply) {
        const authorizeUrl = this.spotifyService.generateAuthorizeUrl();
        reply.redirect(authorizeUrl);
      },
    })

    .route({
      method: 'GET',
      url: '/callback',
      schema: {
        description: 'redirect uri',
        tags: ['spotify'],
        querystring: spotifyCallbackQuerySchema,
      },
      async handler(
        request: FastifyRequest<{ Querystring: SpotifyCallbackQuery }>,
      ) {
        const { key } = await this.spotifyService.createRef(request.query.code);
        return {
          key,
        };
      },
    })

    .route({
      method: 'GET',
      url: '/player',
      schema: {
        description: 'get player',
        tags: ['custom'],
        querystring: spotifyPlayerSchema,
      },
      async handler(request: FastifyRequest<{ Querystring: SpotifyPlayer }>) {
        const player = await this.spotifyService.getPlayer(request.query.key);
        return {
          player,
        };
      },
    })

    /**
     * endpoint badge
     *
     * check: https://shields.io/badges/endpoint-badge
     */
    .route({
      method: 'GET',
      url: '/badge',
      schema: {
        description: 'generate data for custom badge',
        tags: ['custom'],
        querystring: spotifyBadgeSchema,
      },
      async handler(request: FastifyRequest<{ Querystring: SpotifyBadge }>) {
        return this.spotifyService.generateBadgeData(request.query.key);
      },
    });
});
