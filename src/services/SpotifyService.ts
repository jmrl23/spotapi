import type { Prisma } from '@prisma/client';
import { NotFound, Unauthorized } from 'http-errors';
import ms from 'ms';
import crypto from 'node:crypto';
import qs from 'qs';
import { type CurrentlyPlaying } from 'spotify-types';
import { SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI } from '../lib/constant/env';
import { prismaClient } from '../lib/prisma';
import scope from '../lib/scope.json';
import { spotifyAccounts, spotifyApi } from '../lib/spotify';
import type CacheService from './CacheService';

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

interface Badge {
  schemaVersion: 1;
  namedLogo?: string;
  label?: string;
  message?: string;
  color?: string;
  style?: 'for-the-badge';
}

export default class SpotifyService {
  constructor(private readonly cacheService: CacheService) {}

  public async createRef(code: string): Promise<Ref> {
    const key = SpotifyService.randomString(6);
    const existing = await prismaClient.reference.findUnique({
      where: { key },
      select: { id: true },
    });
    if (existing) return await this.createRef(code);

    const api = spotifyAccounts('/api');
    const response = await api.post(
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

      const api = spotifyAccounts('/api');
      const response = await api.post(
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
    if (!ref) throw new Unauthorized('Invalid key');
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

  public async getPlayer(key: string): Promise<CurrentlyPlaying | null> {
    const ref = await this.getRefByKeyOrThrow(key);
    const v1 = spotifyApi('/v1', ref.accessToken);
    const response = await v1.get<CurrentlyPlaying>('/me/player');

    if (
      !response.data ||
      !response.headers ||
      typeof response.headers.get !== 'function'
    ) {
      return null;
    }

    return response.data;
  }

  public async generateBadgeData(key: string): Promise<Badge> {
    const player = await this.getPlayer(key);

    if (!player) {
      return {
        schemaVersion: 1,
        namedLogo: 'spotify',
        label: 'Not Playing',
        message: 'Offline',
        style: 'for-the-badge',
        color: 'cccccc',
      };
    }

    const playing = player.is_playing;
    const colors = [
      'red',
      'green',
      'blue',
      'yellow',
      'purple',
      'orange',
    ] as const;
    const color = colors[Math.round(Math.random() * (colors.length - 1))];
    let message: string = '-';

    if (player.item) {
      if ('artists' in player.item) {
        const song = player.item.name;
        const artist = player.item.artists.at(0)?.name;
        message = song;
        if (artist) message += ` • ${artist}`;
      } else {
        const show = player.item.show;
        const { name, publisher } = show;
        message = `${name} • ${publisher}`;
      }
    }

    return {
      schemaVersion: 1,
      namedLogo: 'spotify',
      label: playing ? 'Playing' : 'Paused',
      message,
      color,
      style: 'for-the-badge',
    };
  }

  private static randomString(length: number): string {
    const randomBytes = crypto.randomBytes(Math.ceil(length / 2));
    return randomBytes.toString('hex').slice(0, length);
  }
}
