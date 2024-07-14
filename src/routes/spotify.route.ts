import type { FastifyRequest } from 'fastify';
import { asRoute } from '../lib/util/typings';
import spotifyApiProxy from '../plugins/spotifyApiProxy';
import {
  type SpotifyCallbackQuery,
  spotifyCallbackQuerySchema,
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
    });
});
