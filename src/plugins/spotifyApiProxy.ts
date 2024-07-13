import fastifyHttpProxy from '@fastify/http-proxy';
import fastifyPlugin from 'fastify-plugin';

export default fastifyPlugin(async function spotifyApiProxy(app) {
  let authorization: undefined | string;

  await app.register(fastifyHttpProxy, {
    upstream: 'https://api.spotify.com',
    prefix: '/api',
    rewritePrefix: '/v1',
    preHandler: async function (request) {
      authorization = '';
      const { key } = request.query as { key?: string };
      if (!key) return;
      const ref = await app.spotifyService.getRefByKeyOrThrow(key);
      if (ref) {
        authorization = ref.accessToken;
      }
    },
    replyOptions: {
      rewriteRequestHeaders(_, headers) {
        const extraHeaders: Record<string, string> = {};

        if (authorization) {
          extraHeaders['authorization'] = `Bearer ${authorization}`;
        }

        return {
          ...headers,
          ...extraHeaders,
        };
      },
    },
  });
});
