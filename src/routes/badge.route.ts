import type { FastifyRequest } from 'fastify';
import { asRoute } from '../lib/util/typings';
import { type BadgeSpotify, badgeSpotifySchema } from '../schemas/badge';
import axios from 'axios';

export const prefix = '/badge';

export default asRoute(async function badgeRoute(app) {
  app.route({
    method: 'GET',
    url: '/spotify',
    schema: {
      description: 'Generate data for custom badge',
      querystring: badgeSpotifySchema,
    },
    async handler(
      request: FastifyRequest<{
        Querystring: BadgeSpotify;
      }>,
    ) {
      const ref = await this.spotifyService.getRefByKeyOrThrow(
        request.query.key,
      );
      const response = await axios.get('https://api.spotify.com/v1/me/player', {
        headers: {
          authorization: `Bearer ${ref.accessToken}`,
        },
      });
      const data: Record<string, any> | '' = response.data;

      if (data === '') {
        return {
          schemaVersion: 1,
          namedLogo: 'spotify',
          label: 'not listening',
          message: 'inactive',
        };
      }

      const message = `${data.item.artists[0].name} - ${data.item.name}`;
      return {
        schemaVersion: 1,
        namedLogo: 'spotify',
        label: 'listening',
        message,
        color: 'blue',
      };
    },
  });
});
