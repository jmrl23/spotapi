import axios, { type AxiosInstance } from 'axios';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from './constant/env';

interface Headers extends Record<string, string> {}

export function spotifyAccounts(
  url: string,
  headers: Headers = {},
): AxiosInstance {
  return axios.create({
    baseURL: `https://accounts.spotify.com${url}`,
    headers: {
      authorization: `Basic ${Buffer.from(
        SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET,
      ).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
      ...headers,
    },
  });
}

export function spotifyApi(
  url: string,
  accessToken: string,
  headers: Headers = {},
): AxiosInstance {
  return axios.create({
    baseURL: `https://api.spotify.com${url}`,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...headers,
    },
  });
}
