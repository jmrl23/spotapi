import crypto from 'node:crypto';
import qs from 'qs';
import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
} from '../lib/constant/env';
import scope from '../lib/scope.json';
import { asRoute } from '../lib/util/typings';
import type { FastifyRequest } from 'fastify';
import {
  type SpotifyCallbackQuery,
  spotifyCallbackQuerySchema,
} from '../schemas/spotify';
import SpotifyService from '../services/SpotifyService';

export const prefix = '/spotify';

export default asRoute(async function spotifyRoute(app) {
  app

    .route({
      method: 'GET',
      url: '/login',
      schema: {
        description: 'login to spotify',
        tags: ['spotify'],
      },
      async handler(_, reply) {
        reply.redirect(
          `https://accounts.spotify.com/authorize?${qs.stringify({
            response_type: 'code',
            client_id: SPOTIFY_CLIENT_ID,
            scope: scope.join(' '),
            redirect_uri: SPOTIFY_REDIRECT_URI,
            state: SpotifyService.rs(16),
          })}`,
        );
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
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            authorization: `Basic ${Buffer.from(
              SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET,
            ).toString('base64')}`,
          },
          body: qs.stringify({
            code: request.query.code,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });
        const data = await response.json();
        const reference = await this.spotifyService.createRef(
          data.refresh_token,
          data.access_token,
        );

        return reference;
      },
    });
});
