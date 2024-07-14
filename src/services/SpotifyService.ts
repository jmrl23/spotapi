import type { Prisma } from '@prisma/client';
import { NotFound, Unauthorized } from 'http-errors';
import ms from 'ms';
import crypto from 'node:crypto';
import qs from 'qs';
import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
} from '../lib/constant/env';
import { prismaClient } from '../lib/prisma';
import type CacheService from './CacheService';
import scope from '../lib/scope.json';
import axios from 'axios';

interface Ref
  extends Prisma.ReferenceGetPayload<{
    select: {
      id: true;
      createdAt: true;
      updatedAt: true;
      key: true;
      refreshToken: true;
      accessToken: true;
    };
  }> {}

interface OptionsWithRevalidate {
  revalidate?: boolean;
}

const accountsApi = axios.create({
  baseURL: 'https://accounts.spotify.com/api',
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    authorization: `Basic ${Buffer.from(
      SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET,
    ).toString('base64')}`,
  },
});

export default class SpotifyService {
  constructor(private readonly cacheService: CacheService) {}

  public async createRef(code: string): Promise<Ref> {
    const key = SpotifyService.randomString(6);
    const existing = await prismaClient.reference.findUnique({
      where: { key },
      select: { id: true },
    });
    if (existing) return await this.createRef(code);

    const response = await accountsApi.post(
      '/token',
      qs.stringify({
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    );

    const { refresh_token: refreshToken, access_token: accessToken } =
      response.data;
    if (!refreshToken || !accessToken)
      throw new Unauthorized('Failed to generate tokens');

    const ref = await prismaClient.reference.create({
      data: { key, refreshToken, accessToken },
    });
    await this.cacheService.set(`reference:[ref:id]:${ref.id}`, ref, ms('55m'));
    return ref;
  }

  public async getRefById(
    id: string,
    options: OptionsWithRevalidate & {} = {},
  ): Promise<Ref | null> {
    const cacheKey = `reference:[ref:id]:${id}`;

    if (options.revalidate === true) {
      await this.cacheService.del(cacheKey);
    }

    const cachedRef = await this.cacheService.get<Ref | null>(cacheKey);
    if (cachedRef !== undefined) return cachedRef;

    try {
      const oldRef = await prismaClient.reference.findUnique({
        where: { id },
        select: { refreshToken: true },
      });

      if (!oldRef) throw new Error();

      const response = await accountsApi.post(
        '/token',
        qs.stringify({
          grant_type: 'refresh_token',
          refresh_token: oldRef.refreshToken,
        }),
      );

      const { access_token } = response.data;
      const ref = await prismaClient.reference.update({
        where: { id },
        data: { accessToken: access_token },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          key: true,
          refreshToken: true,
          accessToken: true,
        },
      });
      await this.cacheService.set(cacheKey, ref, ms('55m'));
      return ref;
    } catch (error) {
      await this.cacheService.set(cacheKey, null, ms('55m'));
      return null;
    }
  }

  public async getRefByIdOrThrow(
    id: string,
    options: OptionsWithRevalidate & {} = {},
  ): Promise<Ref> {
    const ref = await this.getRefById(id, options);
    if (ref === null) throw new NotFound('Reference not found');
    return ref;
  }

  public async getRefByKey(
    key: string,
    options: OptionsWithRevalidate & {} = {},
  ): Promise<Ref | null> {
    const cacheKey = `reference:[ref:key]:${key}:id`;

    if (options.revalidate === true) {
      await this.cacheService.del(cacheKey);
    }

    const cachedId = await this.cacheService.get<string | null>(cacheKey);
    if (cachedId === null) return null;
    if (cachedId !== undefined)
      return await this.getRefByIdOrThrow(cachedId, options);

    const ref = await prismaClient.reference.findUnique({
      where: { key },
      select: { id: true },
    });

    if (ref === null) {
      await this.cacheService.set(cacheKey, null, ms('55m'));
      return null;
    } else {
      await this.cacheService.set(cacheKey, ref.id, ms('55m'));
      return await this.getRefByIdOrThrow(ref.id, options);
    }
  }

  public async getRefByKeyOrThrow(
    key: string,
    options: OptionsWithRevalidate & {} = {},
  ): Promise<Ref> {
    const ref = await this.getRefByKey(key, options);
    if (!ref) throw new NotFound('Reference not found');
    return ref;
  }

  public generateAuthorizeUrl(): string {
    return `https://accounts.spotify.com/authorize?${qs.stringify({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scope.join(' '),
      redirect_uri: SPOTIFY_REDIRECT_URI,
      state: SpotifyService.randomString(16),
    })}`;
  }

  private static randomString(length: number): string {
    const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
    return randomBytes.toString('hex').slice(0, length);
  }
}
