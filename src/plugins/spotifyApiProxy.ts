import fastifyHttpProxy from '@fastify/http-proxy';
import fastifyPlugin from 'fastify-plugin';

export default fastifyPlugin(async function spotifyApiProxy(app) {
  const authorization = new Map<string, string | undefined>();

  await app.register(fastifyHttpProxy, {
    upstream: 'https://api.spotify.com',
    prefix: '/api',
    rewritePrefix: '/',
    preHandler: async function (request) {
      const { key } = request.query as { key?: string };
      if (!key) return;

      const ref = await app.spotifyService.getRefByKeyOrThrow(key);
      authorization.set(key, ref.accessToken);
    },
    replyOptions: {
      rewriteRequestHeaders(request, headers) {
        const query = request.query as { key?: string };
        if (typeof query.key !== 'string') return headers;

        const auth = authorization.get(query.key);
        if (auth) headers['authorization'] = `Bearer ${auth}`;

        return headers;
      },
    },
  });
});
